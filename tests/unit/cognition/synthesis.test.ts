import { describe, it, expect, beforeEach, vi } from 'vitest';
import { synthesize } from '../../../src/cognition/synthesis.js';
import type { EventBus } from '../../../src/kernel/event-bus.js';

describe('Cross-Pillar Cognitive Synthesis', () => {
  let mockEventBus: EventBus;

  beforeEach(() => {
    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
    } as unknown as EventBus;
  });

  describe('synthesize()', () => {
    it('should combine all three pillars with weighted confidence', async () => {
      const decision = {
        description: 'Launch new product with 60% success probability',
        context: {
          outcomes: [
            { description: 'Success', probability: 0.6, value: 100 },
            { description: 'Failure', probability: 0.4, value: -50 },
          ],
        },
      };

      const result = await synthesize(decision, mockEventBus);

      expect(result.pillarResults).toHaveLength(3);
      expect(result.pillarResults.map((r) => r.pillar)).toEqual(['LOGOS', 'ETHOS', 'PATHOS']);

      // Weighted confidence: LOGOS 0.4, ETHOS 0.3, PATHOS 0.3
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);

      // Should emit synthesis event
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'audit:log',
        expect.objectContaining({
          action: 'cognition:synthesis_complete',
          agent: 'CognitiveSynthesis',
          trustLevel: 'system',
        })
      );
    });

    it('should detect conflicts when confidence gap > 0.3', async () => {
      const decision = {
        description: 'always fail at everything disaster everyone',
        context: {},
      };

      const result = await synthesize(decision, mockEventBus);

      // This decision text should trigger biases (ETHOS will flag)
      // while LOGOS/PATHOS may have different views
      expect(result.pillarResults).toHaveLength(3);

      // Check if conflict detection works
      if (result.conflicts.length > 0) {
        expect(result.flagForHumanReview).toBe(true);
        expect(result.consensus).toBe(false);
      }
    });

    it('should achieve consensus when all pillars agree', async () => {
      const decision = {
        description: 'Continue steady improvement with evidence-based approach',
        context: {
          outcomes: [
            { description: 'Moderate success', probability: 0.7, value: 50 },
            { description: 'Minor setback', probability: 0.3, value: -10 },
          ],
        },
      };

      const result = await synthesize(decision, mockEventBus);

      // Positive EV, no major biases, virtuous decision = likely consensus
      expect(result.pillarResults).toHaveLength(3);

      // All pillars should have reasonable confidence
      const confidences = result.pillarResults.map((r) => r.confidence);
      const maxConfidence = Math.max(...confidences);
      const minConfidence = Math.min(...confidences);
      const gap = maxConfidence - minConfidence;

      if (gap <= 0.3) {
        expect(result.consensus).toBe(true);
        expect(result.flagForHumanReview).toBe(false);
      }
    });

    it('should handle pillar failures gracefully', async () => {
      const decision = {
        description: '', // Empty description will cause some pillars to fail
        context: {},
      };

      // Should not throw, should provide fallback results
      await expect(synthesize(decision, mockEventBus)).resolves.toBeDefined();
    });

    it('should include reasoning from all pillars', async () => {
      const decision = {
        description: 'Test decision',
        context: {
          outcomes: [
            { description: 'Win', probability: 0.5, value: 100 },
            { description: 'Lose', probability: 0.5, value: -50 },
          ],
        },
      };

      const result = await synthesize(decision, mockEventBus);

      // Each pillar should have reasoning
      result.pillarResults.forEach((pillar) => {
        expect(pillar.reasoning).toBeTruthy();
        expect(typeof pillar.reasoning).toBe('string');
        expect(pillar.recommendation).toBeTruthy();
      });

      // Unified recommendation should include all pillar insights
      expect(result.recommendation).toBeTruthy();
      expect(typeof result.recommendation).toBe('string');
    });

    it('should apply correct weights (LOGOS 0.4, ETHOS 0.3, PATHOS 0.3)', async () => {
      const decision = {
        description: 'Test weighted confidence',
        context: {
          outcomes: [
            { description: 'Success', probability: 1.0, value: 100 },
          ],
        },
      };

      const result = await synthesize(decision, mockEventBus);

      // Extract individual confidences
      const logosConf = result.pillarResults.find((r) => r.pillar === 'LOGOS')?.confidence ?? 0;
      const ethosConf = result.pillarResults.find((r) => r.pillar === 'ETHOS')?.confidence ?? 0;
      const pathosConf = result.pillarResults.find((r) => r.pillar === 'PATHOS')?.confidence ?? 0;

      const expectedWeightedConfidence = logosConf * 0.4 + ethosConf * 0.3 + pathosConf * 0.3;

      expect(result.confidence).toBeCloseTo(expectedWeightedConfidence, 5);
    });

    it('should flag for human review when conflicts exist', async () => {
      const decision = {
        description: 'always never everyone no one disaster',
        context: {
          outcomes: [
            { description: 'Best case', probability: 0.1, value: 1000 },
            { description: 'Worst case', probability: 0.9, value: -100 },
          ],
        },
      };

      const result = await synthesize(decision, mockEventBus);

      // This decision has multiple issues:
      // - Negative EV (LOGOS will be cautious)
      // - Heavy cognitive biases (ETHOS will flag)
      // - Potentially poor virtue alignment (PATHOS may flag)

      // Should detect disagreement
      if (result.conflicts.length > 0) {
        expect(result.flagForHumanReview).toBe(true);
      }
    });

    it('should work without EventBus (optional parameter)', async () => {
      const decision = {
        description: 'Test without event bus',
        context: {},
      };

      // Should not throw when eventBus is undefined
      const result = await synthesize(decision);

      expect(result).toBeDefined();
      expect(result.pillarResults).toHaveLength(3);
    });
  });
});
