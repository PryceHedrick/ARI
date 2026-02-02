/**
 * Cognitive Load Theory (CLT)
 *
 * Estimates:
 * - intrinsic load (concept difficulty)
 * - extraneous load (presentation complexity)
 * - germane load (productive effort)
 */

import type { LearningPreferences } from './preferences-detector.js';

export interface CognitiveLoadEstimate {
  intrinsic: number; // 0-10
  extraneous: number; // 0-10
  germane: number; // 0-10
  total: number;
  recommendation: 'GOOD' | 'TOO_COMPLEX' | 'TOO_SIMPLE';
  adjustments: string[];
}

export interface LoadExplanation {
  concept: string;
  retrievalFirst: boolean;
  verbal: string;
  visual: string;
  examples: string[];
}

const CONCEPT_DIFFICULTY: Record<string, number> = {
  'Kelly Criterion': 8,
  'Bayesian Updating': 7,
  'Expected Value': 5,
  default: 6,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function assessCognitiveLoad(params: {
  explanation: LoadExplanation;
  userLevel: number; // 0..10 (higher = more capable)
  preferences: LearningPreferences;
}): CognitiveLoadEstimate {
  const { explanation, userLevel, preferences } = params;

  const baseDifficulty = CONCEPT_DIFFICULTY[explanation.concept] ?? CONCEPT_DIFFICULTY.default;
  const intrinsic = clamp((baseDifficulty * (10 - clamp(userLevel, 0, 10))) / 10, 0, 10);

  let extraneous = 0;
  // Too many examples adds noise
  if (explanation.examples.length > 5) extraneous += 2;
  // Math when user doesn't want it increases load
  if (explanation.verbal.toLowerCase().includes('derive') && !preferences.preferences.mathematics) extraneous += 3;
  // Missing visuals for visual learners can create split attention (indirectly)
  if (preferences.visual >= 0.7 && explanation.visual.toLowerCase().includes('available on request')) extraneous += 2;
  extraneous = clamp(extraneous, 0, 10);

  // Germane load: retrieval practice is productive effort
  const germane = clamp(explanation.retrievalFirst ? 4 : 2, 0, 10);

  const total = intrinsic + extraneous + germane;
  const recommendation = total > 15 ? 'TOO_COMPLEX' : total < 5 ? 'TOO_SIMPLE' : 'GOOD';

  const adjustments: string[] = [];
  if (recommendation === 'TOO_COMPLEX') {
    adjustments.push('Reduce examples to 1–2');
    adjustments.push('Chunk the explanation into 3–5 steps');
    adjustments.push('Add a worked example before asking for transfer');
  }
  if (recommendation === 'TOO_SIMPLE') {
    adjustments.push('Increase desirable difficulty: add a retrieval question or application prompt');
  }

  return { intrinsic, extraneous, germane, total, recommendation, adjustments };
}

