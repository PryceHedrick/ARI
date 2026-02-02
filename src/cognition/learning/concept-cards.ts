/**
 * Concept Cards
 *
 * Helpers for turning "a learned concept" into a spaced-repetition card.
 * This is intentionally lightweight; content quality is handled by the teacher layer.
 */

import { getSpacedRepetitionEngine, type SpacedRepetitionCard } from './spaced-repetition.js';

export interface ConceptCardInput {
  concept: string;
  front: string;
  back: string;
  visual?: string;
  source?: string;
}

export async function createConceptCard(input: ConceptCardInput): Promise<SpacedRepetitionCard> {
  const engine = await getSpacedRepetitionEngine();
  return engine.createCard({
    concept: input.concept,
    front: input.front,
    back: input.back,
    visual: input.visual,
  });
}

