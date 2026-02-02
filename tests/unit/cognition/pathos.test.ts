import { describe, it, expect } from 'vitest';
import { reflect } from '../../../src/cognition/pathos/index.js';
import type { Outcome } from '../../../src/cognition/types.js';

describe('PATHOS', () => {
  describe('reflect()', () => {
    it('uses explicit expectedValue when provided', async () => {
      const outcome: Outcome = {
        description: 'It went well',
        probability: 1,
        value: 10,
      };

      const result = await reflect(outcome, {
        originalDecision: 'Do the thing',
        expectedOutcome: 'It went well',
        expectedValue: 20,
      });

      expect(result.expectedValue).toBe(20);
      expect(result.actualValue).toBe(10);
      expect(result.delta).toBe(-10);
    });
  });
});

