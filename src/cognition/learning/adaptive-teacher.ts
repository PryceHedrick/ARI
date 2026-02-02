/**
 * Adaptive Teacher
 *
 * Produces a teaching plan that always includes dual coding (verbal + visual),
 * uses retrieval-first when appropriate, and respects prerequisites.
 */

import type { LearningPreferences } from './preferences-detector.js';
import type { UserKnowledgeState } from './user-knowledge.js';
import { selectExplanationLevel, type ExplanationLevel } from './adaptive-explanation.js';
import { generateRetrievalQuestion } from './retrieval-practice.js';
import { checkConceptPrerequisites } from './scaffolding.js';
import { assessCognitiveLoad, type CognitiveLoadEstimate } from './cognitive-load.js';

export interface Explanation {
  concept: string;
  level: ExplanationLevel;
  retrievalFirst: boolean;
  retrievalQuestion?: ReturnType<typeof generateRetrievalQuestion>;
  prerequisites?: { ready: boolean; missing: string[] };
  cognitiveLoad?: CognitiveLoadEstimate;

  verbal: string;
  visual: string;
  examples: string[];
  relevance?: string;
}

export function explainConcept(params: {
  concept: string;
  preferences: LearningPreferences;
  state: UserKnowledgeState;
  userKnowledgeMap?: Map<string, UserKnowledgeState>;
  goals?: string[];
  userLevel?: number; // 0..10
}): Explanation {
  const { concept, preferences, state, userKnowledgeMap, goals } = params;

  const level = selectExplanationLevel(state);
  const prerequisites = userKnowledgeMap ? checkConceptPrerequisites(concept, userKnowledgeMap) : undefined;
  const retrievalFirst = state.exposures > 0;

  let verbal = generateVerbal(concept, level, preferences);
  const visual = generateVisual(concept, level, preferences);
  let examples = generateExamples(concept, preferences.preferences.examples);

  const retrievalQuestion = retrievalFirst
    ? generateRetrievalQuestion({ concept, state, level })
    : undefined;

  const userLevel = params.userLevel ?? Math.round((state.confidence ?? 0.5) * 10);
  const cognitiveLoad = assessCognitiveLoad({
    explanation: { concept, retrievalFirst, verbal, visual, examples },
    userLevel,
    preferences,
  });

  // If too complex, simplify: fewer examples + shorter verbal
  if (cognitiveLoad.recommendation === 'TOO_COMPLEX') {
    examples = examples.slice(0, 1);
    verbal = verbal.replace(/\.\s*$/, '.') + ' (Simplified to reduce overload.)';
  }

  const relevance = goals && goals.length > 0
    ? `This matters for your goal: ${goals[0]}`
    : undefined;

  return {
    concept,
    level,
    retrievalFirst,
    retrievalQuestion,
    prerequisites,
    cognitiveLoad,
    verbal,
    visual,
    examples,
    relevance,
  };
}

function generateVerbal(concept: string, level: ExplanationLevel, prefs: LearningPreferences): string {
  const math = prefs.preferences.mathematics;

  if (level === 'beginner') {
    return math
      ? `Beginner: ${concept} (intuition first, then simple formula).`
      : `Beginner: ${concept} explained with plain language and a concrete analogy.`;
  }
  if (level === 'intermediate') {
    return math
      ? `Intermediate: define ${concept} formally, then show 1–2 worked examples.`
      : `Intermediate: define ${concept}, cover edge cases, then apply it to a realistic scenario.`;
  }
  return math
    ? `Advanced: derive ${concept}, discuss assumptions, and show failure modes.`
    : `Advanced: cover nuanced cases, counterexamples, and when NOT to use ${concept}.`;
}

function generateVisual(concept: string, level: ExplanationLevel, prefs: LearningPreferences): string {
  // Keep visuals text-first; Phase 7 expands this into diagrams/mermaid generators.
  const wantsVisual = prefs.visual >= 0.6;
  const depth = level === 'beginner' ? 'simple' : level === 'intermediate' ? 'structured' : 'detailed';
  if (!wantsVisual) {
    return `Visual (${depth}): [available on request]`;
  }
  return `Visual (${depth}): ${concept}\n┌───────────────┐\n│ key idea here  │\n└───────────────┘`;
}

function generateExamples(concept: string, howMany: 'many' | 'few'): string[] {
  const n = howMany === 'many' ? 3 : 1;
  return Array.from({ length: n }, (_, i) => `Example ${i + 1}: Apply ${concept} to a realistic scenario.`);
}

