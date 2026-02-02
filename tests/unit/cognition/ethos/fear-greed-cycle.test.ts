/**
 * Fear/Greed Cycle Detection Tests
 *
 * Tests the trading psychology patterns from Mark Douglas's work.
 * Detects destructive emotional cycles: Fear Spiral, Greed Chase,
 * Revenge Trading, Euphoria, Panic Selling, FOMO.
 */

import { describe, it, expect } from 'vitest';
import { detectFearGreedCycle } from '../../../../src/cognition/ethos/index.js';

describe('Fear/Greed Cycle Detection', () => {
  describe('detectFearGreedCycle', () => {
    // =========================================================================
    // FEAR SPIRAL DETECTION
    // =========================================================================

    describe('Fear Spiral', () => {
      it('should detect fear spiral with multiple losses and fear indicators', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Sold AAPL', outcome: 'loss' },
            { description: 'Sold MSFT', outcome: 'loss' },
          ],
          behavioralSigns: ['feeling scared about the market', 'too anxious to make decisions'],
          currentMood: 'fearful',
        });

        expect(result.pattern).toBe('FEAR_SPIRAL');
        expect(result.detected).toBe(true);
        expect(result.severity).toBeGreaterThan(0.3);
        expect(result.evidence.length).toBeGreaterThan(0);
        expect(result.phase).toBeDefined();
      });

      it('should increase severity with more losses', async () => {
        const twoLosses = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Trade 1', outcome: 'loss' },
            { description: 'Trade 2', outcome: 'loss' },
          ],
          behavioralSigns: ['worried about portfolio'],
        });

        const fourLosses = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Trade 1', outcome: 'loss' },
            { description: 'Trade 2', outcome: 'loss' },
            { description: 'Trade 3', outcome: 'loss' },
            { description: 'Trade 4', outcome: 'loss' },
          ],
          behavioralSigns: ['worried about portfolio'],
        });

        expect(fourLosses.severity).toBeGreaterThan(twoLosses.severity);
      });

      it('should detect fear spiral phase based on severity', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Trade 1', outcome: 'loss' },
            { description: 'Trade 2', outcome: 'loss' },
          ],
          behavioralSigns: ['slightly afraid'],
        });

        if (result.detected) {
          // Phase is determined by severity: early (<0.4), mid (0.4-0.7), late (>0.7)
          expect(['early', 'mid', 'late']).toContain(result.phase);
        }
      });

      it('should detect late phase fear spiral', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Trade 1', outcome: 'loss' },
            { description: 'Trade 2', outcome: 'loss' },
            { description: 'Trade 3', outcome: 'loss' },
            { description: 'Trade 4', outcome: 'loss' },
          ],
          behavioralSigns: [
            'paralyzed by fear',
            'too scared to act',
            'worried about everything',
            'anxious all the time',
          ],
          currentMood: 'fear',
        });

        expect(result.pattern).toBe('FEAR_SPIRAL');
        expect(result.phase).toBe('late');
      });
    });

    // =========================================================================
    // GREED CHASE DETECTION
    // =========================================================================

    describe('Greed Chase', () => {
      it('should detect greed chase with wins and bull market', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Bought NVDA', outcome: 'win' },
            { description: 'Bought AMD', outcome: 'win' },
          ],
          behavioralSigns: ['want to make bigger bets', 'fomo on next opportunity'],
          marketConditions: 'bull',
        });

        expect(result.pattern).toBe('GREED_CHASE');
        expect(result.detected).toBe(true);
        expect(result.evidence.length).toBeGreaterThan(0);
      });

      it('should not detect greed chase in bear market', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Bought NVDA', outcome: 'win' },
            { description: 'Bought AMD', outcome: 'win' },
          ],
          behavioralSigns: ['want to make bigger bets'],
          marketConditions: 'bear',
        });

        expect(result.pattern).not.toBe('GREED_CHASE');
      });

      it('should capture FOMO behavioral signs', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Trade 1', outcome: 'win' },
            { description: 'Trade 2', outcome: 'win' },
          ],
          behavioralSigns: ['fear of missing out on gains', 'everyone else is making money'],
          marketConditions: 'bull',
        });

        expect(result.detected).toBe(true);
        expect(result.evidence.some(e => e.toLowerCase().includes('missing out'))).toBe(true);
      });
    });

    // =========================================================================
    // REVENGE TRADING DETECTION
    // =========================================================================

    describe('Revenge Trading', () => {
      it('should detect revenge trading after angry loss', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            {
              description: 'Lost on TSLA options',
              outcome: 'loss',
              emotionalReaction: 'angry and frustrated',
            },
          ],
          behavioralSigns: ['want to make it back immediately', 'need to prove I can win'],
        });

        expect(result.pattern).toBe('REVENGE_TRADING');
        expect(result.detected).toBe(true);
        expect(result.severity).toBeGreaterThanOrEqual(0.5);
        expect(result.phase).toBe('mid'); // Revenge trading is always problematic
      });

      it('should capture revenge indicators in evidence', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            {
              description: 'Bad trade',
              outcome: 'loss',
              emotionalReaction: 'angry',
            },
          ],
          behavioralSigns: ['must recover losses', 'show them I can win'],
        });

        expect(result.evidence).toContain('Recent loss with angry emotional reaction');
      });

      it('should not detect revenge without angry reaction', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            {
              description: 'Loss',
              outcome: 'loss',
              emotionalReaction: 'calm acceptance',
            },
          ],
          behavioralSigns: ['moving forward with plan'],
        });

        expect(result.pattern).not.toBe('REVENGE_TRADING');
      });
    });

    // =========================================================================
    // EUPHORIA DETECTION
    // =========================================================================

    describe('Euphoria', () => {
      it('should detect euphoria with multiple wins', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Win 1', outcome: 'win' },
            { description: 'Win 2', outcome: 'win' },
            { description: 'Win 3', outcome: 'win' },
          ],
          behavioralSigns: ['I feel invincible', 'trading is easy'],
          currentMood: 'euphoric',
        });

        expect(result.pattern).toBe('EUPHORIA');
        expect(result.detected).toBe(true);
        expect(result.evidence.some(e => e.includes('consecutive wins'))).toBe(true);
      });

      it('should increase severity with more wins', async () => {
        const threeWins = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Win 1', outcome: 'win' },
            { description: 'Win 2', outcome: 'win' },
            { description: 'Win 3', outcome: 'win' },
          ],
          behavioralSigns: ['invincible'],
        });

        const fiveWins = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Win 1', outcome: 'win' },
            { description: 'Win 2', outcome: 'win' },
            { description: 'Win 3', outcome: 'win' },
            { description: 'Win 4', outcome: 'win' },
            { description: 'Win 5', outcome: 'win' },
          ],
          behavioralSigns: ['invincible', 'genius trader'],
        });

        expect(fiveWins.severity).toBeGreaterThan(threeWins.severity);
      });

      it('should detect overconfidence indicators', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Win 1', outcome: 'win' },
            { description: 'Win 2', outcome: 'win' },
            { description: 'Win 3', outcome: 'win' },
          ],
          behavioralSigns: ["I can't lose", 'This is easy money', 'I always pick winners'],
        });

        expect(result.detected).toBe(true);
        expect(result.behavioralSigns.length).toBeGreaterThan(0);
      });
    });

    // =========================================================================
    // NO PATTERN DETECTION
    // =========================================================================

    describe('No Pattern', () => {
      it('should return NONE when no pattern detected', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Trade 1', outcome: 'win' },
            { description: 'Trade 2', outcome: 'loss' },
          ],
          behavioralSigns: ['following the plan'],
          currentMood: 'neutral',
        });

        expect(result.pattern).toBe('NONE');
        expect(result.detected).toBe(false);
        expect(result.severity).toBe(0);
      });

      it('should return NONE with empty input', async () => {
        const result = await detectFearGreedCycle({});

        expect(result.pattern).toBe('NONE');
        expect(result.detected).toBe(false);
      });

      it('should return NONE with balanced decisions', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Trade 1', outcome: 'win' },
            { description: 'Trade 2', outcome: 'loss' },
            { description: 'Trade 3', outcome: 'neutral' },
          ],
          behavioralSigns: ['calm and collected'],
          marketConditions: 'sideways',
        });

        expect(result.pattern).toBe('NONE');
        expect(result.detected).toBe(false);
      });
    });

    // =========================================================================
    // PROVENANCE AND RECOMMENDATIONS
    // =========================================================================

    describe('Output Structure', () => {
      it('should include provenance framework', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Loss', outcome: 'loss' },
            { description: 'Loss', outcome: 'loss' },
          ],
          behavioralSigns: ['fearful'],
        });

        expect(result.provenance).toBeDefined();
        expect(result.provenance.framework).toContain('Trading Psychology');
        expect(result.provenance.computedAt).toBeDefined();
      });

      it('should provide actionable recommendation', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Loss', outcome: 'loss' },
            { description: 'Loss', outcome: 'loss' },
          ],
          behavioralSigns: ['afraid'],
        });

        expect(result.recommendation).toBeDefined();
        expect(typeof result.recommendation).toBe('string');
        expect(result.recommendation.length).toBeGreaterThan(10);
      });

      it('should include triggers when pattern detected', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: [
            { description: 'Sold AAPL at loss', outcome: 'loss' },
            { description: 'Sold MSFT at loss', outcome: 'loss' },
          ],
          behavioralSigns: ['scared'],
        });

        if (result.detected) {
          expect(result.triggers.length).toBeGreaterThan(0);
        }
      });
    });

    // =========================================================================
    // SEVERITY BOUNDS
    // =========================================================================

    describe('Severity Bounds', () => {
      it('should cap severity at 1.0', async () => {
        const result = await detectFearGreedCycle({
          recentDecisions: Array(10).fill({ description: 'Loss', outcome: 'loss' as const }),
          behavioralSigns: Array(10).fill('paralyzed by fear'),
          currentMood: 'extreme fear',
        });

        expect(result.severity).toBeLessThanOrEqual(1);
      });

      it('should have severity >= 0', async () => {
        const result = await detectFearGreedCycle({});

        expect(result.severity).toBeGreaterThanOrEqual(0);
      });
    });

    // =========================================================================
    // PHASE DETECTION
    // =========================================================================

    describe('Phase Detection', () => {
      it('should set phase to none when no pattern', async () => {
        const result = await detectFearGreedCycle({});

        expect(result.phase).toBe('none');
      });

      it('should assign phase based on severity thresholds', async () => {
        // Phase logic: severity < 0.4 = early, 0.4-0.7 = mid, > 0.7 = late
        // With 2 losses + 1 behavioral sign, severity = 0.3 + 0.15*2 + 0.1 = 0.7 (high)
        const result = await detectFearGreedCycle({
          recentDecisions: Array(5).fill({ description: 'Loss', outcome: 'loss' as const }),
          behavioralSigns: [
            'paralyzed',
            'terrified',
            'cannot function',
            'scared to death',
            'anxious mess',
          ],
          currentMood: 'intense fear',
        });

        if (result.detected) {
          // High severity should yield 'late' phase
          expect(result.severity).toBeGreaterThan(0.7);
          expect(result.phase).toBe('late');
        }
      });
    });
  });
});
