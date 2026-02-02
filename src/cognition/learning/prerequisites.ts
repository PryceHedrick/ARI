/**
 * Concept Prerequisites Graph
 *
 * Minimal dependency map so teaching can scaffold concepts in the right order.
 */

export const CONCEPT_PREREQUISITES: Record<string, string[]> = {
  'Kelly Criterion': ['Expected Value', 'Probability Basics'],
  'Bayesian Updating': ['Conditional Probability', 'Bayes Rule'],
  'Systems Thinking': ['Feedback Loops', 'Stocks and Flows'],
};

export function getPrerequisites(concept: string): string[] {
  return CONCEPT_PREREQUISITES[concept] ?? [];
}

