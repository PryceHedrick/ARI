import { describe, it, expect } from 'vitest';
import { PracticeTracker } from '../../../src/cognition/learning/practice-tracker.js';
import { formatPracticeSessionReview } from '../../../src/cognition/learning/session-feedback.js';

describe('Deliberate practice tracker', () => {
  it('records a session and updates skill metrics', async () => {
    const tracker = new PracticeTracker();

    const { session } = tracker.startSession({
      userId: 'u1',
      skill: 'TypeScript refactoring',
      plannedMinutes: 50,
      tasksPlanned: 4,
      startedAt: new Date('2026-01-01T10:00:00.000Z'),
    });

    const recorded = await tracker.recordSession({
      userId: 'u1',
      skill: 'TypeScript refactoring',
      session: {
        ...session,
        endedAt: new Date('2026-01-01T10:50:00.000Z'),
        focusedMinutes: 40,
        tasksCompleted: 3,
        errorPatterns: ['TypeScript generics', 'time estimation'],
      },
    });

    expect(recorded.skill.practice.totalHours).toBeGreaterThan(0);
    expect(recorded.skill.performance.successRate).toBeCloseTo(0.75, 6);
    expect(recorded.skill.currentLevel).toBeGreaterThan(50);
  });

  it('formats a dual-coded session review', async () => {
    const tracker = new PracticeTracker();
    const { session, skill } = tracker.startSession({
      userId: 'u1',
      skill: 'Testing',
      plannedMinutes: 25,
      tasksPlanned: 2,
      startedAt: new Date('2026-01-01T10:00:00.000Z'),
    });

    const end = new Date('2026-01-01T10:25:00.000Z');
    const recorded = await tracker.recordSession({
      userId: 'u1',
      skill: 'Testing',
      session: { ...session, endedAt: end, focusedMinutes: 25, tasksCompleted: 2, errorPatterns: ['vitest edge cases'] },
    });

    const out = formatPracticeSessionReview({ skill: recorded.skill, session: recorded.session });
    expect(out).toContain('Practice Session Review');
    expect(out).toContain('['); // bar
  });
});

