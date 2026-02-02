/**
 * Spaced Repetition (SM-2)
 *
 * Implements the SuperMemo SM-2 algorithm to schedule reviews.
 * This is the core scheduling engine; UI/interaction lives in review-session.ts.
 *
 * Features:
 * - Mathematically correct SM-2 implementation
 * - Persistent storage via FileStorageAdapter
 * - Auto-persist on card creation and review
 */

import type { LearningStorageAdapter } from './storage-adapter.js';
import { getDefaultStorage } from './storage-adapter.js';

export interface SpacedRepetitionCard {
  id: string;
  concept: string;
  front: string;
  back: string;
  visual?: string;

  easeFactor: number; // 1.3 (hard) to ~2.5 (easy)
  interval: number; // days until next review
  repetitions: number; // successful reviews in a row
  nextReview: Date;
  lastReview: Date | null;
  createdAt: Date;
}

export interface SpacedRepetitionReview {
  cardId: string;
  reviewedAt: Date;
  quality: 0 | 1 | 2 | 3 | 4 | 5;
  intervalAfter: number;
  easeFactorAfter: number;
  repetitionsAfter: number;
  nextReview: Date;
}

export function calculateNextInterval(
  card: Pick<SpacedRepetitionCard, 'easeFactor' | 'interval' | 'repetitions'>,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): { interval: number; easeFactor: number; repetitions: number } {
  if (quality < 3) {
    return { interval: 1, easeFactor: card.easeFactor, repetitions: 0 };
  }

  const newEaseFactor = Math.max(
    1.3,
    card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  let newInterval: number;
  if (card.repetitions === 0) newInterval = 1;
  else if (card.repetitions === 1) newInterval = 6;
  else newInterval = Math.round(card.interval * newEaseFactor);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: card.repetitions + 1,
  };
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function makeId(prefix = 'card'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface SpacedRepetitionEngineOptions {
  storage?: LearningStorageAdapter;
  autoPersist?: boolean;
}

export class SpacedRepetitionEngine {
  private cards = new Map<string, SpacedRepetitionCard>();
  private reviews: SpacedRepetitionReview[] = [];
  private storage: LearningStorageAdapter;
  private autoPersist: boolean;
  private initialized = false;

  constructor(options?: SpacedRepetitionEngineOptions) {
    this.storage = options?.storage ?? getDefaultStorage();
    this.autoPersist = options?.autoPersist ?? true;
  }

  /**
   * Initialize engine by loading cards from storage
   * Call this before using the engine to restore persisted data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.storage.initialize();

    const cards = await this.storage.loadCards();
    for (const card of cards) {
      this.cards.set(card.id, card);
    }

    const reviews = await this.storage.loadReviews();
    this.reviews = reviews;

    this.initialized = true;
  }

  /**
   * Persist all cards and reviews to storage
   */
  async persist(): Promise<void> {
    await this.storage.saveCards([...this.cards.values()]);
  }

  /**
   * Get all cards (for inspection/export)
   */
  getAllCards(): SpacedRepetitionCard[] {
    return [...this.cards.values()];
  }

  /**
   * Get total card count
   */
  getCardCount(): number {
    return this.cards.size;
  }

  async createCard(input: {
    concept: string;
    front: string;
    back: string;
    visual?: string;
    now?: Date;
  }): Promise<SpacedRepetitionCard> {
    const now = input.now ?? new Date();
    const card: SpacedRepetitionCard = {
      id: makeId('sr'),
      concept: input.concept,
      front: input.front,
      back: input.back,
      visual: input.visual,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: addDays(now, 1),
      lastReview: null,
      createdAt: now,
    };

    this.cards.set(card.id, card);

    if (this.autoPersist) {
      await this.storage.appendCard(card);
    }

    return card;
  }

  getCard(cardId: string): SpacedRepetitionCard | undefined {
    return this.cards.get(cardId);
  }

  /**
   * Get card by concept name
   */
  getCardByConcept(concept: string): SpacedRepetitionCard | undefined {
    return [...this.cards.values()].find(c => c.concept === concept);
  }

  getReviewsDue(asOf: Date = new Date()): SpacedRepetitionCard[] {
    return [...this.cards.values()]
      .filter(c => c.nextReview.getTime() <= asOf.getTime())
      .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime());
  }

  /**
   * Get count of cards due for review
   */
  getDueCount(asOf: Date = new Date()): number {
    return this.getReviewsDue(asOf).length;
  }

  async reviewCard(cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5, at: Date = new Date()): Promise<SpacedRepetitionReview> {
    const card = this.cards.get(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    const next = calculateNextInterval(card, quality);
    card.easeFactor = next.easeFactor;
    card.interval = next.interval;
    card.repetitions = next.repetitions;
    card.lastReview = at;
    card.nextReview = addDays(at, next.interval);

    const review: SpacedRepetitionReview = {
      cardId,
      reviewedAt: at,
      quality,
      intervalAfter: next.interval,
      easeFactorAfter: next.easeFactor,
      repetitionsAfter: next.repetitions,
      nextReview: card.nextReview,
    };
    this.reviews.push(review);

    if (this.autoPersist) {
      await this.storage.updateCard(card);
      await this.storage.appendReview(review);
    }

    return review;
  }

  getReviewHistory(cardId?: string): SpacedRepetitionReview[] {
    return cardId ? this.reviews.filter(r => r.cardId === cardId) : [...this.reviews];
  }

  /**
   * Get review statistics
   */
  getStats(): {
    totalCards: number;
    dueNow: number;
    reviewedToday: number;
    averageEaseFactor: number;
  } {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const reviewedToday = this.reviews.filter(r => r.reviewedAt >= todayStart).length;
    const allCards = [...this.cards.values()];
    const avgEase = allCards.length > 0
      ? allCards.reduce((sum, c) => sum + c.easeFactor, 0) / allCards.length
      : 2.5;

    return {
      totalCards: this.cards.size,
      dueNow: this.getDueCount(now),
      reviewedToday,
      averageEaseFactor: Math.round(avgEase * 100) / 100,
    };
  }
}

// Singleton engine instance with storage persistence
let defaultEngine: SpacedRepetitionEngine | null = null;
let initPromise: Promise<SpacedRepetitionEngine> | null = null;

/**
 * Get the default spaced repetition engine (singleton)
 * Automatically initializes on first call
 */
export async function getSpacedRepetitionEngine(): Promise<SpacedRepetitionEngine> {
  if (defaultEngine) return defaultEngine;

  // Prevent race conditions during initialization
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const engine = new SpacedRepetitionEngine();
    await engine.initialize();
    defaultEngine = engine;
    return engine;
  })();

  return initPromise;
}

/**
 * Get engine synchronously (returns null if not initialized)
 * Use getSpacedRepetitionEngine() for async initialization
 */
export function getSpacedRepetitionEngineSync(): SpacedRepetitionEngine | null {
  return defaultEngine;
}

/**
 * Create a new engine with custom options
 */
export function createSpacedRepetitionEngine(options?: SpacedRepetitionEngineOptions): SpacedRepetitionEngine {
  return new SpacedRepetitionEngine(options);
}

