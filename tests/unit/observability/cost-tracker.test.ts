import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CostTracker, MODEL_PRICING } from '../../../src/observability/cost-tracker.js';
import { EventBus } from '../../../src/kernel/event-bus.js';
import { AuditLogger } from '../../../src/kernel/audit.js';

describe('CostTracker', () => {
  let costTracker: CostTracker;
  let eventBus: EventBus;
  let auditLogger: AuditLogger;

  beforeEach(() => {
    eventBus = new EventBus();
    auditLogger = new AuditLogger('/tmp/test-audit.json');
    costTracker = new CostTracker(eventBus, auditLogger, {
      daily: 10,
      weekly: 50,
      monthly: 200,
    });
  });

  describe('track', () => {
    it('should track a cost entry', () => {
      const entry = costTracker.track({
        operation: 'chat_completion',
        agent: 'executor',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 1000,
        outputTokens: 500,
      });

      expect(entry.id).toMatch(/^cost_/);
      expect(entry.operation).toBe('chat_completion');
      expect(entry.agent).toBe('executor');
      expect(entry.cost).toBeGreaterThan(0);
    });

    it('should emit cost:tracked event', () => {
      const trackedHandler = vi.fn();
      eventBus.on('cost:tracked', trackedHandler);

      costTracker.track({
        operation: 'completion',
        agent: 'core',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 100,
        outputTokens: 50,
      });

      expect(trackedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'completion',
          model: 'claude-sonnet-4',
        })
      );
    });

    it('should calculate cost correctly', () => {
      // claude-sonnet-4: input $3/1M, output $15/1M
      const entry = costTracker.track({
        operation: 'test',
        agent: 'core',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });

      // Expected: (1M * $3 + 1M * $15) / 1M = $18
      expect(entry.cost).toBeCloseTo(18, 2);
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost for known models', () => {
      const cost = costTracker.calculateCost('claude-opus-4', 1000, 500);
      // $15/1M input + $75/1M output = (1000 * 15 + 500 * 75) / 1_000_000
      expect(cost).toBeCloseTo(0.0525, 5);
    });

    it('should use default pricing for unknown models', () => {
      const cost = costTracker.calculateCost('unknown-model', 1000, 500);
      // Default: $3/1M input + $15/1M output
      expect(cost).toBeCloseTo(0.0105, 5);
    });
  });

  describe('getSummary', () => {
    it('should return correct summary', () => {
      // Track some entries
      costTracker.track({
        operation: 'op1',
        agent: 'executor',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 1000,
        outputTokens: 500,
      });

      costTracker.track({
        operation: 'op2',
        agent: 'planner',
        provider: 'anthropic',
        model: 'claude-opus-4',
        inputTokens: 500,
        outputTokens: 250,
      });

      const summary = costTracker.getSummary();

      expect(summary.daily).toBeGreaterThan(0);
      expect(summary.byAgent['executor']).toBeGreaterThan(0);
      expect(summary.byAgent['planner']).toBeGreaterThan(0);
      expect(summary.byModel['claude-sonnet-4']).toBeGreaterThan(0);
      expect(summary.byModel['claude-opus-4']).toBeGreaterThan(0);
    });

    it('should calculate trend correctly', () => {
      const summary = costTracker.getSummary();
      expect(['increasing', 'stable', 'decreasing']).toContain(summary.trend);
    });
  });

  describe('budget alerts', () => {
    it('should emit warning when approaching daily budget', () => {
      const warningHandler = vi.fn();
      eventBus.on('cost:budget_warning', warningHandler);

      // Track enough to exceed 80% of $10 daily budget
      costTracker.track({
        operation: 'expensive',
        agent: 'core',
        provider: 'anthropic',
        model: 'claude-opus-4',
        inputTokens: 100_000,
        outputTokens: 100_000,
      });

      // This should trigger warning (100k * $15 + 100k * $75) / 1M = $9
      expect(warningHandler).toHaveBeenCalled();
    });

    it('should emit exceeded when over daily budget', () => {
      const exceededHandler = vi.fn();
      eventBus.on('cost:budget_exceeded', exceededHandler);

      // Track enough to exceed $10 daily budget
      // With claude-opus-4 pricing ($15/M input, $75/M output):
      // 200k input * $15/M = $3, 150k output * $75/M = $11.25, total = $14.25 > $10
      costTracker.track({
        operation: 'expensive',
        agent: 'core',
        provider: 'anthropic',
        model: 'claude-opus-4',
        inputTokens: 200_000,
        outputTokens: 150_000,
      });

      expect(exceededHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'daily',
        })
      );
    });
  });

  describe('setBudget', () => {
    it('should update budget', () => {
      costTracker.setBudget({ daily: 20 });
      
      const budget = costTracker.getBudget();
      expect(budget.daily).toBe(20);
      expect(budget.weekly).toBe(50); // Unchanged
    });
  });

  describe('getEntries', () => {
    beforeEach(() => {
      costTracker.track({
        operation: 'op1',
        agent: 'executor',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 100,
        outputTokens: 50,
      });

      costTracker.track({
        operation: 'op2',
        agent: 'planner',
        provider: 'openai',
        model: 'gpt-4o',
        inputTokens: 200,
        outputTokens: 100,
      });
    });

    it('should return all entries without filter', () => {
      const entries = costTracker.getEntries();
      expect(entries).toHaveLength(2);
    });

    it('should filter by agent', () => {
      const entries = costTracker.getEntries({ agent: 'executor' });
      expect(entries).toHaveLength(1);
      expect(entries[0].agent).toBe('executor');
    });

    it('should filter by model', () => {
      const entries = costTracker.getEntries({ model: 'gpt-4o' });
      expect(entries).toHaveLength(1);
      expect(entries[0].model).toBe('gpt-4o');
    });

    it('should filter by operation', () => {
      const entries = costTracker.getEntries({ operation: 'op1' });
      expect(entries).toHaveLength(1);
      expect(entries[0].operation).toBe('op1');
    });
  });

  describe('getCostByModel', () => {
    it('should aggregate costs by model', () => {
      costTracker.track({
        operation: 'op1',
        agent: 'core',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 1000,
        outputTokens: 500,
      });

      costTracker.track({
        operation: 'op2',
        agent: 'core',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 1000,
        outputTokens: 500,
      });

      const byModel = costTracker.getCostByModel();

      expect(byModel['claude-sonnet-4'].calls).toBe(2);
      expect(byModel['claude-sonnet-4'].tokens).toBe(3000); // 2 * (1000 + 500)
    });
  });

  describe('getCostByAgent', () => {
    it('should aggregate costs by agent', () => {
      costTracker.track({
        operation: 'op1',
        agent: 'executor',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 1000,
        outputTokens: 500,
      });

      costTracker.track({
        operation: 'op2',
        agent: 'executor',
        provider: 'anthropic',
        model: 'claude-opus-4',
        inputTokens: 500,
        outputTokens: 250,
      });

      const byAgent = costTracker.getCostByAgent();

      expect(byAgent['executor'].calls).toBe(2);
      expect(byAgent['executor'].avgCostPerCall).toBeGreaterThan(0);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for planned operations', () => {
      const estimate = costTracker.estimateCost('claude-opus-4', 10000, 5000);
      
      // $15/1M input + $75/1M output
      const expected = (10000 * 15 + 5000 * 75) / 1_000_000;
      expect(estimate).toBeCloseTo(expected, 5);
    });
  });

  describe('getBudgetUtilization', () => {
    it('should return utilization percentages', () => {
      costTracker.track({
        operation: 'test',
        agent: 'core',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 100_000,
        outputTokens: 50_000,
      });

      const utilization = costTracker.getBudgetUtilization();

      expect(utilization.daily).toBeGreaterThan(0);
      expect(utilization.weekly).toBeGreaterThan(0);
      expect(utilization.monthly).toBeGreaterThan(0);
    });
  });

  describe('clearOldEntries', () => {
    it('should remove old entries', () => {
      // Track an entry
      const entry = costTracker.track({
        operation: 'test',
        agent: 'core',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 100,
        outputTokens: 50,
      });

      // Manually make it old by modifying timestamp
      (entry as any).timestamp = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);

      const cleared = costTracker.clearOldEntries(90 * 24 * 60 * 60 * 1000);

      expect(cleared).toBe(1);
      expect(costTracker.getEntries()).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      costTracker.track({
        operation: 'test',
        agent: 'core',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        inputTokens: 100,
        outputTokens: 50,
      });

      const stats = costTracker.getStats();

      expect(stats.totalEntries).toBe(1);
      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.avgCostPerEntry).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeInstanceOf(Date);
      expect(stats.newestEntry).toBeInstanceOf(Date);
    });

    it('should handle empty tracker', () => {
      const stats = costTracker.getStats();

      expect(stats.totalEntries).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.avgCostPerEntry).toBe(0);
      expect(stats.oldestEntry).toBeNull();
      expect(stats.newestEntry).toBeNull();
    });
  });
});
