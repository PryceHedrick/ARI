import { describe, it, expect } from 'vitest';
import { defaultLearningPreferences, updatePreferencesFromUtterance } from '../../../src/cognition/learning/preferences-detector.js';
import { checkConceptPrerequisites } from '../../../src/cognition/learning/scaffolding.js';
import { explainConcept } from '../../../src/cognition/learning/adaptive-teacher.js';
import type { UserKnowledgeState } from '../../../src/cognition/learning/user-knowledge.js';

describe('Adaptive teaching system', () => {
  it('detects math preference from utterance', () => {
    const base = defaultLearningPreferences();
    const next = updatePreferencesFromUtterance(base, 'Show me the math and derive the formula');
    expect(next.preferences.mathematics).toBe(true);
    expect(next.depth).toBe('deep');
  });

  it('flags missing prerequisites for Kelly Criterion when absent', () => {
    const m = new Map<string, UserKnowledgeState>();
    const prereq = checkConceptPrerequisites('Kelly Criterion', m, 0.7);
    expect(prereq.ready).toBe(false);
    expect(prereq.missing.length).toBeGreaterThan(0);
  });

  it('builds an explanation plan with retrieval-first when previously exposed', () => {
    const prefs = defaultLearningPreferences();
    const state: UserKnowledgeState = {
      concept: 'Expected Value',
      exposures: 1,
      lastExposure: new Date(),
      retrievalAttempts: 0,
      retrievalSuccesses: 0,
      retrievalRate: 0,
      confidence: 0.5,
      nextReview: null,
    };

    const plan = explainConcept({ concept: 'Expected Value', preferences: prefs, state });
    expect(plan.retrievalFirst).toBe(true);
    expect(plan.retrievalQuestion?.prompt).toMatch(/Before I explain more/i);
    expect(plan.verbal).toBeTruthy();
    expect(plan.visual).toBeTruthy();
  });
});

