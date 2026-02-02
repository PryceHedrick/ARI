/**
 * Interleaving
 *
 * Mixes concepts rather than blocking one topic at a time.
 * Interleaving improves discrimination between similar ideas.
 */

export interface InterleavedTask {
  concept: string;
  type: 'RETRIEVAL' | 'APPLICATION';
  timeLimitMinutes: number;
}

export interface InterleavedReviewSession {
  concepts: string[];
  tasks: InterleavedTask[];
  rationale: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateInterleavedReviewSession(concepts: string[]): InterleavedReviewSession {
  const shuffled = shuffle(concepts.filter(Boolean));
  return {
    concepts: shuffled,
    tasks: shuffled.map((concept) => ({
      concept,
      type: 'RETRIEVAL',
      timeLimitMinutes: 5,
    })),
    rationale: 'Interleaving improves discrimination between similar concepts and strengthens retention.',
  };
}

