/**
 * Adaptive Explanation Selection
 *
 * Chooses the depth of explanation based on the user's demonstrated recall.
 */

import type { UserKnowledgeState } from './user-knowledge.js';
import type { ExplanationLevel } from './retrieval-practice.js';

// Re-export for backwards compatibility
export type { ExplanationLevel } from './retrieval-practice.js';

export function selectExplanationLevel(state: UserKnowledgeState): ExplanationLevel {
  if (state.retrievalRate > 0.9) return 'advanced';
  if (state.retrievalRate > 0.6) return 'intermediate';
  return 'beginner';
}

