/**
 * Review Session
 *
 * Represents a bounded set of due cards presented to the user.
 * The UI (CLI/dashboard/chat) can render these prompts and feed quality scores back.
 */

import { getSpacedRepetitionEngine, type SpacedRepetitionCard, type SpacedRepetitionReview } from './spaced-repetition.js';

export interface ReviewSession {
  id: string;
  userId: string;
  createdAt: Date;
  cards: SpacedRepetitionCard[];
  completed: boolean;
  reviews: SpacedRepetitionReview[];
}

function makeId(prefix = 'review'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createReviewSession(userId: string, asOf: Date = new Date()): Promise<ReviewSession> {
  const engine = await getSpacedRepetitionEngine();
  const cards = engine.getReviewsDue(asOf);
  return {
    id: makeId('sr-session'),
    userId,
    createdAt: asOf,
    cards,
    completed: false,
    reviews: [],
  };
}

export async function submitReview(
  session: ReviewSession,
  cardId: string,
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  at: Date = new Date()
): Promise<ReviewSession> {
  const engine = await getSpacedRepetitionEngine();
  const review = await engine.reviewCard(cardId, quality, at);

  session.reviews.push(review);
  const reviewed = new Set(session.reviews.map(r => r.cardId));
  session.completed = session.cards.every(c => reviewed.has(c.id));

  return session;
}

