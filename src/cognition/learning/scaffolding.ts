/**
 * Scaffolding / Zone of Proximal Development checks
 *
 * Ensures we don't teach too far above the user's current mastery.
 */

import type { UserKnowledgeState } from './user-knowledge.js';
import { getPrerequisites } from './prerequisites.js';

export function checkConceptPrerequisites(
  concept: string,
  userKnowledge: Map<string, UserKnowledgeState>,
  threshold: number = 0.7
): { ready: boolean; missing: string[] } {
  const prereqs = getPrerequisites(concept);
  const missing: string[] = [];

  for (const prereq of prereqs) {
    const state = userKnowledge.get(prereq);
    if (!state || state.confidence < threshold) {
      missing.push(prereq);
    }
  }

  return { ready: missing.length === 0, missing };
}

