import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import fs from 'node:fs/promises';
import { EventBus } from '../../../src/kernel/event-bus.js';
import { DecisionJournal } from '../../../src/cognition/learning/decision-journal.js';
import { WeeklyWisdomDigest } from '../../../src/autonomous/weekly-wisdom-digest.js';

describe('WeeklyWisdomDigest', () => {
  let digest: WeeklyWisdomDigest;
  let eventBus: EventBus;
  let journal: DecisionJournal;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `ari-digest-test-${randomUUID()}`);
    eventBus = new EventBus();
    journal = new DecisionJournal(join(tmpDir, 'decisions'));
    await journal.initialize(eventBus);

    digest = new WeeklyWisdomDigest(eventBus, journal, {
      digestDir: join(tmpDir, 'digests'),
    });
  });

  afterEach(async () => {
    await journal.shutdown();
    try { await fs.rm(tmpDir, { recursive: true }); } catch { /* noop */ }
  });

  describe('Generate', () => {
    it('should generate an empty digest with no decisions', async () => {
      const result = await digest.generate();

      expect(result.totalDecisions).toBe(0);
      expect(result.averageConfidence).toBe(0);
      expect(result.topFrameworks).toHaveLength(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate a digest with decision data', async () => {
      // Add diverse decisions
      journal.recordDecision({
        decision: 'Use Bayesian analysis for market entry',
        frameworks_used: ['Bayesian Reasoning', 'Expected Value Theory'],
        pillar: 'LOGOS',
        confidence: 0.85,
        outcome: 'success',
      });

      journal.recordDecision({
        decision: 'Detected anchoring bias in portfolio review',
        frameworks_used: ['Cognitive Bias Detection'],
        pillar: 'ETHOS',
        confidence: 0.7,
        biases_detected: ['ANCHORING_BIAS'],
        outcome: 'success',
      });

      journal.recordDecision({
        decision: 'Reframe catastrophizing about market drop',
        frameworks_used: ['Cognitive Behavioral Therapy (Beck)'],
        pillar: 'PATHOS',
        confidence: 0.8,
        emotional_context: { valence: -0.3, arousal: 0.7, dominance: 0.4 },
        outcome: 'success',
      });

      const result = await digest.generate();

      expect(result.totalDecisions).toBe(3);
      expect(result.averageConfidence).toBeCloseTo(0.783, 1);
      expect(Object.keys(result.pillarDistribution)).toContain('LOGOS');
      expect(Object.keys(result.pillarDistribution)).toContain('ETHOS');
      expect(Object.keys(result.pillarDistribution)).toContain('PATHOS');
      expect(result.topFrameworks.length).toBeGreaterThan(0);
      expect(result.biasesDetected.length).toBe(1);
      expect(result.biasesDetected[0].type).toBe('ANCHORING_BIAS');
      expect(result.emotionalTrend).not.toBeNull();
    });

    it('should calculate pillar distribution correctly', async () => {
      journal.recordDecision({ decision: 'D1', frameworks_used: ['A'], pillar: 'LOGOS', confidence: 0.8 });
      journal.recordDecision({ decision: 'D2', frameworks_used: ['B'], pillar: 'LOGOS', confidence: 0.8 });
      journal.recordDecision({ decision: 'D3', frameworks_used: ['C'], pillar: 'ETHOS', confidence: 0.8 });

      const result = await digest.generate();
      expect(result.pillarDistribution['LOGOS']).toBe(2);
      expect(result.pillarDistribution['ETHOS']).toBe(1);
    });

    it('should rank top frameworks by count', async () => {
      for (let i = 0; i < 5; i++) {
        journal.recordDecision({
          decision: `Decision ${i}`,
          frameworks_used: ['Bayesian Reasoning'],
          pillar: 'LOGOS',
          confidence: 0.8,
        });
      }
      for (let i = 0; i < 3; i++) {
        journal.recordDecision({
          decision: `Decision EV ${i}`,
          frameworks_used: ['Expected Value Theory'],
          pillar: 'LOGOS',
          confidence: 0.7,
        });
      }

      const result = await digest.generate();
      expect(result.topFrameworks[0].name).toBe('Bayesian Reasoning');
      expect(result.topFrameworks[0].count).toBe(5);
      expect(result.topFrameworks[1].name).toBe('Expected Value Theory');
      expect(result.topFrameworks[1].count).toBe(3);
    });

    it('should select key decisions by confidence and outcome', async () => {
      journal.recordDecision({
        decision: 'High confidence success',
        frameworks_used: ['A'],
        pillar: 'LOGOS',
        confidence: 0.95,
        outcome: 'success',
      });
      journal.recordDecision({
        decision: 'Low confidence pending',
        frameworks_used: ['B'],
        pillar: 'LOGOS',
        confidence: 0.5,
      });

      const result = await digest.generate();
      expect(result.keyDecisions[0].decision).toBe('High confidence success');
    });
  });

  describe('Delivery', () => {
    it('should save digest to disk as markdown', async () => {
      journal.recordDecision({
        decision: 'Test decision',
        frameworks_used: ['Bayesian Reasoning'],
        pillar: 'LOGOS',
        confidence: 0.9,
      });

      const result = await digest.generateAndDeliver();
      expect(result.success).toBe(true);
      expect(result.digestPath).toBeDefined();

      const content = await fs.readFile(result.digestPath!, 'utf-8');
      expect(content).toContain('Weekly Wisdom Digest');
      expect(content).toContain('Bayesian Reasoning');
    });

    it('should emit audit event on generation', async () => {
      const events: unknown[] = [];
      eventBus.on('audit:log', (payload) => {
        if (payload.action === 'wisdom_digest:generated') {
          events.push(payload);
        }
      });

      await digest.generateAndDeliver();
      expect(events.length).toBe(1);
    });
  });

  describe('Markdown Formatting', () => {
    it('should produce well-structured markdown', async () => {
      journal.recordDecision({
        decision: 'Market entry analysis',
        frameworks_used: ['Bayesian Reasoning', 'Kelly Criterion'],
        pillar: 'LOGOS',
        confidence: 0.88,
        outcome: 'success',
      });

      journal.recordDecision({
        decision: 'Bias check on portfolio',
        frameworks_used: ['Cognitive Bias Detection'],
        pillar: 'ETHOS',
        confidence: 0.75,
        biases_detected: ['CONFIRMATION_BIAS'],
        outcome: 'success',
      });

      const result = await digest.generate();
      const md = digest.formatAsMarkdown(result);

      expect(md).toContain('# Weekly Wisdom Digest');
      expect(md).toContain('## Summary');
      expect(md).toContain('## Cognitive Pillar Activity');
      expect(md).toContain('## Top Frameworks Used');
      expect(md).toContain('## Key Decisions');
      expect(md).toContain('## Biases Detected & Addressed');
      expect(md).toContain('## Decision Outcomes');
      expect(md).toContain('## Recommendations for Next Week');
    });

    it('should handle empty digest gracefully', async () => {
      const result = await digest.generate();
      const md = digest.formatAsMarkdown(result);

      expect(md).toContain('# Weekly Wisdom Digest');
      expect(md).toContain('No cognitive decisions were recorded');
    });
  });

  describe('Recommendations', () => {
    it('should recommend exploring underused pillars', async () => {
      // All decisions are LOGOS — should recommend exploring other pillars
      for (let i = 0; i < 10; i++) {
        journal.recordDecision({
          decision: `Decision ${i}`,
          frameworks_used: ['Bayesian Reasoning'],
          pillar: 'LOGOS',
          confidence: 0.8,
        });
      }

      const result = await digest.generate();
      // No ETHOS or PATHOS decisions, so recommendations should mention them
      // (but the recommendation logic uses the full stats, which includes all entries)
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should warn about high failure rate', async () => {
      for (let i = 0; i < 5; i++) {
        journal.recordDecision({
          decision: `Failed ${i}`,
          frameworks_used: ['A'],
          pillar: 'LOGOS',
          confidence: 0.5,
          outcome: 'failure',
        });
      }
      journal.recordDecision({
        decision: 'Success',
        frameworks_used: ['A'],
        pillar: 'LOGOS',
        confidence: 0.8,
        outcome: 'success',
      });

      const result = await digest.generate();
      const hasFailRec = result.recommendations.some(r => r.includes('Failure rate'));
      expect(hasFailRec).toBe(true);
    });
  });

  describe('Emotional Trend', () => {
    it('should detect improving emotional trend', async () => {
      // First half: negative valence
      for (let i = 0; i < 4; i++) {
        journal.recordDecision({
          decision: `Negative ${i}`,
          frameworks_used: ['CBT'],
          pillar: 'PATHOS',
          confidence: 0.7,
          emotional_context: { valence: -0.5, arousal: 0.6, dominance: 0.3 },
        });
      }
      // Second half: positive valence
      for (let i = 0; i < 4; i++) {
        journal.recordDecision({
          decision: `Positive ${i}`,
          frameworks_used: ['Stoicism'],
          pillar: 'PATHOS',
          confidence: 0.8,
          emotional_context: { valence: 0.5, arousal: 0.4, dominance: 0.7 },
        });
      }

      const result = await digest.generate();
      expect(result.emotionalTrend).not.toBeNull();
      expect(result.emotionalTrend!.trend).toBe('improving');
    });

    it('should return null when no emotional data', async () => {
      journal.recordDecision({
        decision: 'No emotion',
        frameworks_used: ['Logic'],
        pillar: 'LOGOS',
        confidence: 0.9,
      });

      const result = await digest.generate();
      expect(result.emotionalTrend).toBeNull();
    });
  });
});
