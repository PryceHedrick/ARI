import { describe, it, expect } from 'vitest';
import { generateInterleavedReviewSession } from '../../../src/cognition/learning/interleaving.js';
import { detectTransferOpportunities } from '../../../src/cognition/learning/transfer.js';
import { generateAnalogy } from '../../../src/cognition/learning/analogies.js';

describe('Interleaving & transfer learning', () => {
  it('creates an interleaved review session', () => {
    const session = generateInterleavedReviewSession(['Bayes', 'Kelly', 'EV']);
    expect(session.tasks.length).toBe(3);
    expect(session.tasks[0]?.type).toBe('RETRIEVAL');
  });

  it('detects transfer opportunities for TDD', () => {
    const opps = detectTransferOpportunities('TDD');
    expect(opps.length).toBeGreaterThan(0);
    expect(opps[0]?.corePrinciple).toBeTruthy();
  });

  it('generates analogies', () => {
    const a = generateAnalogy('Bayesian updating');
    expect(a.toLowerCase()).toContain('bayesian');
  });
});

