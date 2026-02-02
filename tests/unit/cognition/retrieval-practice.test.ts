import { describe, it, expect, vi } from 'vitest';
import { UserKnowledgeTracker } from '../../../src/cognition/learning/user-knowledge.js';
import { generateRetrievalQuestion, shouldRetrievalFirst } from '../../../src/cognition/learning/retrieval-practice.js';
import { selectExplanationLevel } from '../../../src/cognition/learning/adaptive-explanation.js';
import type { LearningStorageAdapter } from '../../../src/cognition/learning/storage-adapter.js';

// Create a no-op in-memory storage for tests
function createMockStorage(): LearningStorageAdapter {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    loadCards: vi.fn().mockResolvedValue([]),
    saveCards: vi.fn().mockResolvedValue(undefined),
    appendCard: vi.fn().mockResolvedValue(undefined),
    updateCard: vi.fn().mockResolvedValue(undefined),
    loadReviews: vi.fn().mockResolvedValue([]),
    appendReview: vi.fn().mockResolvedValue(undefined),
    loadPracticeSessions: vi.fn().mockResolvedValue([]),
    savePracticeSession: vi.fn().mockResolvedValue(undefined),
    loadSkillProficiencies: vi.fn().mockResolvedValue([]),
    saveSkillProficiency: vi.fn().mockResolvedValue(undefined),
    loadKnowledgeStates: vi.fn().mockResolvedValue([]),
    saveKnowledgeState: vi.fn().mockResolvedValue(undefined),
    loadCalibrationPredictions: vi.fn().mockResolvedValue([]),
    saveCalibrationPrediction: vi.fn().mockResolvedValue(undefined),
    loadMonthlySummaries: vi.fn().mockResolvedValue([]),
    saveMonthlySummary: vi.fn().mockResolvedValue(undefined),
    loadQueries: vi.fn().mockResolvedValue([]),
    appendQuery: vi.fn().mockResolvedValue(undefined),
    loadFailures: vi.fn().mockResolvedValue([]),
    appendFailure: vi.fn().mockResolvedValue(undefined),
  };
}

describe('Retrieval practice system', () => {
  it('tracks exposures and retrieval attempts', async () => {
    const tracker = new UserKnowledgeTracker({ storage: createMockStorage(), autoPersist: false });

    await tracker.recordExposure('u1', 'Kelly Criterion', new Date('2026-01-01T00:00:00.000Z'));
    const update = await tracker.recordRetrievalAttempt('u1', 'Kelly Criterion', 4, new Date('2026-01-02T00:00:00.000Z'));

    expect(update.state.exposures).toBe(1);
    expect(update.state.retrievalAttempts).toBe(1);
    expect(update.state.retrievalSuccesses).toBe(1);
    expect(update.state.retrievalRate).toBe(1);
    expect(update.state.confidence).toBeGreaterThan(0.5);
    expect(update.state.nextReview).toBeInstanceOf(Date);
  });

  it('generates a retrieval-first prompt if concept was seen before', async () => {
    const tracker = new UserKnowledgeTracker({ storage: createMockStorage(), autoPersist: false });
    await tracker.recordExposure('u1', 'Expected Value');
    const state = await tracker.getState('u1', 'Expected Value');

    expect(shouldRetrievalFirst(state)).toBe(true);

    const level = selectExplanationLevel(state);
    const q = generateRetrievalQuestion({ concept: 'Expected Value', state, level });
    expect(q.prompt).toMatch(/Before I explain more/i);
  });

  it('selects explanation level based on retrievalRate', async () => {
    const tracker = new UserKnowledgeTracker({ storage: createMockStorage(), autoPersist: false });
    const state = await tracker.getState('u1', 'Bayes Rule');

    state.retrievalAttempts = 10;
    state.retrievalSuccesses = 10;
    state.retrievalRate = 1;

    expect(selectExplanationLevel(state)).toBe('advanced');
  });
});

