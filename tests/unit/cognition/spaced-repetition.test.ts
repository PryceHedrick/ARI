import { describe, it, expect } from 'vitest';
import { calculateNextInterval, SpacedRepetitionEngine } from '../../../src/cognition/learning/spaced-repetition.js';

describe('Spaced repetition (SM-2)', () => {
  it('resets on failed recall (quality < 3)', () => {
    const next = calculateNextInterval({ easeFactor: 2.5, interval: 10, repetitions: 5 }, 2);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(0);
  });

  it('uses 1d then 6d then grows by ease factor', () => {
    const first = calculateNextInterval({ easeFactor: 2.5, interval: 0, repetitions: 0 }, 5);
    expect(first.interval).toBe(1);
    expect(first.repetitions).toBe(1);

    const second = calculateNextInterval({ easeFactor: first.easeFactor, interval: first.interval, repetitions: first.repetitions }, 5);
    expect(second.interval).toBe(6);
    expect(second.repetitions).toBe(2);

    const third = calculateNextInterval({ easeFactor: second.easeFactor, interval: second.interval, repetitions: second.repetitions }, 5);
    expect(third.interval).toBeGreaterThanOrEqual(12);
    expect(third.repetitions).toBe(3);
  });

  it('engine schedules due reviews', async () => {
    const engine = new SpacedRepetitionEngine();
    const card = await engine.createCard({
      concept: 'Kelly Criterion',
      front: 'What does Kelly optimize?',
      back: 'Log-wealth growth rate',
      now: new Date('2026-01-01T00:00:00.000Z'),
    });

    const due = engine.getReviewsDue(new Date('2026-01-02T00:00:00.000Z'));
    expect(due.map(c => c.id)).toContain(card.id);

    const review = await engine.reviewCard(card.id, 5, new Date('2026-01-02T00:00:00.000Z'));
    expect(review.nextReview).toBeInstanceOf(Date);
  });
});

