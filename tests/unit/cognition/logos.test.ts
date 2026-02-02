import { describe, it, expect } from 'vitest';
import { calculateExpectedValue, evaluateDecisionTree } from '../../../src/cognition/logos/index.js';
import type { Decision, DecisionNode } from '../../../src/cognition/types.js';

describe('LOGOS', () => {
  describe('calculateExpectedValue()', () => {
    it('populates breakEvenProbability and sensitivityAnalysis', async () => {
      const decision: Decision = {
        description: 'Test EV sensitivity',
        outcomes: [
          { description: 'Small loss', probability: 0.5, value: -1 },
          { description: 'Moderate gain', probability: 0.49, value: 2 },
          { description: 'Rare huge gain', probability: 0.01, value: 100 },
        ],
      };

      const result = await calculateExpectedValue(decision);

      expect(result.sensitivityAnalysis).toBeDefined();
      expect(result.sensitivityAnalysis?.mostCriticalOutcome).toBe('Small loss');
      expect(result.breakEvenProbability).toBeDefined();
      expect(result.breakEvenProbability).toBeGreaterThanOrEqual(0);
      expect(result.breakEvenProbability).toBeLessThanOrEqual(1);
    });
  });

  describe('evaluateDecisionTree()', () => {
    it('enumerates allPaths with probabilities', async () => {
      const tree: DecisionNode = {
        id: 'root',
        type: 'decision',
        description: 'Choose a path',
        children: [
          {
            id: 'optionA',
            type: 'chance',
            description: 'Option A',
            children: [
              { id: 'a_win', type: 'terminal', description: 'A win', probability: 0.6, value: 10 },
              { id: 'a_lose', type: 'terminal', description: 'A lose', probability: 0.4, value: -5 },
            ],
          },
          {
            id: 'optionB',
            type: 'chance',
            description: 'Option B',
            children: [
              { id: 'b_win', type: 'terminal', description: 'B win', probability: 0.2, value: 30 },
              { id: 'b_lose', type: 'terminal', description: 'B lose', probability: 0.8, value: -2 },
            ],
          },
        ],
      };

      const result = await evaluateDecisionTree(tree);

      expect(result.allPaths.length).toBe(4);

      const pathsByLeaf = new Map(result.allPaths.map(p => [p.path[p.path.length - 1], p]));
      expect(pathsByLeaf.get('a_win')?.probability).toBeCloseTo(0.6, 6);
      expect(pathsByLeaf.get('a_lose')?.probability).toBeCloseTo(0.4, 6);
      expect(pathsByLeaf.get('b_win')?.probability).toBeCloseTo(0.2, 6);
      expect(pathsByLeaf.get('b_lose')?.probability).toBeCloseTo(0.8, 6);

      // Paths include the full node chain from root
      expect(pathsByLeaf.get('a_win')?.path[0]).toBe('root');
    });
  });
});

