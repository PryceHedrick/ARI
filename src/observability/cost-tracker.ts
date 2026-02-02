import type { EventBus } from '../kernel/event-bus.js';
import type { AuditLogger } from '../kernel/audit.js';
import type { AgentId } from '../kernel/types.js';

/**
 * Model pricing (per 1M tokens)
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4': { input: 15, output: 75 },
  'claude-sonnet-4': { input: 3, output: 15 },
  'claude-haiku': { input: 0.25, output: 1.25 },
  'gpt-4o': { input: 5, output: 15 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'glm-4.7': { input: 2, output: 2 },
  // Fallback for unknown models
  'default': { input: 3, output: 15 },
};

/**
 * A single cost entry
 */
export interface CostEntry {
  id: string;
  timestamp: Date;
  operation: string;
  agent: AgentId;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

/**
 * Budget configuration
 */
export interface Budget {
  daily: number;
  weekly: number;
  monthly: number;
}

/**
 * Cost summary
 */
export interface CostSummary {
  daily: number;
  weekly: number;
  monthly: number;
  byAgent: Record<string, number>;
  byOperation: Record<string, number>;
  byModel: Record<string, number>;
  trend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Cost entry input (without computed fields)
 */
export interface CostEntryInput {
  timestamp?: Date;
  operation: string;
  agent: AgentId;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * CostTracker - Comprehensive API cost tracking with budgets and alerts
 * 
 * Based on MAHORAGA (Trading Agent) patterns:
 * - Track costs by agent, operation, and model
 * - Budget alerts at 80% threshold
 * - Trend analysis for cost optimization
 */
export class CostTracker {
  private entries: CostEntry[] = [];
  private budget: Budget;
  private readonly eventBus: EventBus;
  private readonly auditLogger: AuditLogger;

  constructor(
    eventBus: EventBus,
    auditLogger: AuditLogger,
    budget: Budget = { daily: 10, weekly: 50, monthly: 200 }
  ) {
    this.eventBus = eventBus;
    this.auditLogger = auditLogger;
    this.budget = budget;
  }

  /**
   * Track a cost entry
   */
  track(entry: CostEntryInput): CostEntry {
    const cost = this.calculateCost(entry.model, entry.inputTokens, entry.outputTokens);

    const fullEntry: CostEntry = {
      id: `cost_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: entry.timestamp || new Date(),
      operation: entry.operation,
      agent: entry.agent,
      provider: entry.provider,
      model: entry.model,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      cost,
    };

    this.entries.push(fullEntry);

    this.eventBus.emit('cost:tracked', {
      operation: entry.operation,
      cost,
      model: entry.model,
    });

    // Check budget alerts
    this.checkBudgetAlerts();

    return fullEntry;
  }

  /**
   * Calculate cost for a model usage
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
  }

  /**
   * Get cost summary
   */
  getSummary(): CostSummary {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const month = 30 * day;

    const dailyEntries = this.entries.filter(e => now - e.timestamp.getTime() < day);
    const weeklyEntries = this.entries.filter(e => now - e.timestamp.getTime() < week);
    const monthlyEntries = this.entries.filter(e => now - e.timestamp.getTime() < month);

    const daily = dailyEntries.reduce((sum, e) => sum + e.cost, 0);
    const weekly = weeklyEntries.reduce((sum, e) => sum + e.cost, 0);
    const monthly = monthlyEntries.reduce((sum, e) => sum + e.cost, 0);

    // Group by agent
    const byAgent: Record<string, number> = {};
    for (const entry of monthlyEntries) {
      byAgent[entry.agent] = (byAgent[entry.agent] || 0) + entry.cost;
    }

    // Group by operation
    const byOperation: Record<string, number> = {};
    for (const entry of monthlyEntries) {
      byOperation[entry.operation] = (byOperation[entry.operation] || 0) + entry.cost;
    }

    // Group by model
    const byModel: Record<string, number> = {};
    for (const entry of monthlyEntries) {
      byModel[entry.model] = (byModel[entry.model] || 0) + entry.cost;
    }

    // Calculate trend
    const yesterdayEntries = this.entries.filter(e => {
      const age = now - e.timestamp.getTime();
      return age >= day && age < 2 * day;
    });
    const yesterdayCost = yesterdayEntries.reduce((sum, e) => sum + e.cost, 0);

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (yesterdayCost > 0) {
      if (daily > yesterdayCost * 1.2) trend = 'increasing';
      else if (daily < yesterdayCost * 0.8) trend = 'decreasing';
    }

    return { daily, weekly, monthly, byAgent, byOperation, byModel, trend };
  }

  /**
   * Check budget alerts
   */
  private checkBudgetAlerts(): void {
    const summary = this.getSummary();

    // Daily warning at 80%
    if (summary.daily > this.budget.daily * 0.8) {
      this.eventBus.emit('cost:budget_warning', {
        type: 'daily',
        current: summary.daily,
        budget: this.budget.daily,
        percentage: (summary.daily / this.budget.daily) * 100,
      });
    }

    // Weekly warning at 80%
    if (summary.weekly > this.budget.weekly * 0.8) {
      this.eventBus.emit('cost:budget_warning', {
        type: 'weekly',
        current: summary.weekly,
        budget: this.budget.weekly,
        percentage: (summary.weekly / this.budget.weekly) * 100,
      });
    }

    // Monthly warning at 80%
    if (summary.monthly > this.budget.monthly * 0.8) {
      this.eventBus.emit('cost:budget_warning', {
        type: 'monthly',
        current: summary.monthly,
        budget: this.budget.monthly,
        percentage: (summary.monthly / this.budget.monthly) * 100,
      });
    }

    // Daily exceeded
    if (summary.daily > this.budget.daily) {
      this.eventBus.emit('cost:budget_exceeded', {
        type: 'daily',
        current: summary.daily,
        budget: this.budget.daily,
      });

      void this.auditLogger.log('cost:budget_exceeded', 'core', 'system', {
        type: 'daily',
        current: summary.daily,
        budget: this.budget.daily,
      });
    }

    // Weekly exceeded
    if (summary.weekly > this.budget.weekly) {
      this.eventBus.emit('cost:budget_exceeded', {
        type: 'weekly',
        current: summary.weekly,
        budget: this.budget.weekly,
      });
    }

    // Monthly exceeded
    if (summary.monthly > this.budget.monthly) {
      this.eventBus.emit('cost:budget_exceeded', {
        type: 'monthly',
        current: summary.monthly,
        budget: this.budget.monthly,
      });
    }
  }

  /**
   * Set budget
   */
  setBudget(budget: Partial<Budget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  /**
   * Get current budget
   */
  getBudget(): Budget {
    return { ...this.budget };
  }

  /**
   * Get entries with optional filter
   */
  getEntries(filter?: {
    agent?: AgentId;
    operation?: string;
    model?: string;
    since?: Date;
    until?: Date;
  }): CostEntry[] {
    let results = [...this.entries];

    if (filter?.agent) {
      results = results.filter(e => e.agent === filter.agent);
    }
    if (filter?.operation) {
      results = results.filter(e => e.operation === filter.operation);
    }
    if (filter?.model) {
      results = results.filter(e => e.model === filter.model);
    }
    if (filter?.since) {
      results = results.filter(e => e.timestamp >= filter.since!);
    }
    if (filter?.until) {
      results = results.filter(e => e.timestamp <= filter.until!);
    }

    return results;
  }

  /**
   * Get total cost for a time period
   */
  getTotalCost(since?: Date, until?: Date): number {
    return this.getEntries({ since, until }).reduce((sum, e) => sum + e.cost, 0);
  }

  /**
   * Get cost by model for analysis
   */
  getCostByModel(): Record<string, { cost: number; tokens: number; calls: number }> {
    const result: Record<string, { cost: number; tokens: number; calls: number }> = {};

    for (const entry of this.entries) {
      if (!result[entry.model]) {
        result[entry.model] = { cost: 0, tokens: 0, calls: 0 };
      }
      result[entry.model].cost += entry.cost;
      result[entry.model].tokens += entry.inputTokens + entry.outputTokens;
      result[entry.model].calls++;
    }

    return result;
  }

  /**
   * Get cost by agent for analysis
   */
  getCostByAgent(): Record<string, { cost: number; calls: number; avgCostPerCall: number }> {
    const result: Record<string, { cost: number; calls: number; avgCostPerCall: number }> = {};

    for (const entry of this.entries) {
      if (!result[entry.agent]) {
        result[entry.agent] = { cost: 0, calls: 0, avgCostPerCall: 0 };
      }
      result[entry.agent].cost += entry.cost;
      result[entry.agent].calls++;
    }

    // Calculate averages
    for (const agent in result) {
      result[agent].avgCostPerCall = result[agent].cost / result[agent].calls;
    }

    return result;
  }

  /**
   * Estimate cost for planned operations
   */
  estimateCost(model: string, estimatedInputTokens: number, estimatedOutputTokens: number): number {
    return this.calculateCost(model, estimatedInputTokens, estimatedOutputTokens);
  }

  /**
   * Get budget utilization percentages
   */
  getBudgetUtilization(): {
    daily: number;
    weekly: number;
    monthly: number;
  } {
    const summary = this.getSummary();
    return {
      daily: (summary.daily / this.budget.daily) * 100,
      weekly: (summary.weekly / this.budget.weekly) * 100,
      monthly: (summary.monthly / this.budget.monthly) * 100,
    };
  }

  /**
   * Clear old entries to manage memory
   */
  clearOldEntries(maxAgeMs: number = 90 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    const originalLength = this.entries.length;
    this.entries = this.entries.filter(e => now - e.timestamp.getTime() < maxAgeMs);
    return originalLength - this.entries.length;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntries: number;
    totalCost: number;
    avgCostPerEntry: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const totalCost = this.entries.reduce((sum, e) => sum + e.cost, 0);
    const sortedByTime = [...this.entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      totalEntries: this.entries.length,
      totalCost,
      avgCostPerEntry: this.entries.length > 0 ? totalCost / this.entries.length : 0,
      oldestEntry: sortedByTime.length > 0 ? sortedByTime[0].timestamp : null,
      newestEntry: sortedByTime.length > 0 ? sortedByTime[sortedByTime.length - 1].timestamp : null,
    };
  }
}
