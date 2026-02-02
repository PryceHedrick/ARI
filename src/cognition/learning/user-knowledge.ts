/**
 * User Knowledge Tracking
 *
 * Tracks what a specific user has seen, recalled, and mastered over time.
 * Phase 2 (Retrieval Practice) uses this to decide: test first vs teach first.
 *
 * Now includes persistent storage via FileStorageAdapter.
 */

import type { LearningStorageAdapter } from './storage-adapter.js';
import { getDefaultStorage } from './storage-adapter.js';

export interface UserKnowledgeState {
  concept: string;
  exposures: number;
  lastExposure: Date | null;

  retrievalAttempts: number;
  retrievalSuccesses: number;
  retrievalRate: number; // successes / attempts

  confidence: number; // 0..1 estimate of mastery (smoothed)
  nextReview: Date | null;
}

export interface UserKnowledgeUpdate {
  state: UserKnowledgeState;
  changed: Array<keyof UserKnowledgeState>;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function computeSmoothedMastery(successes: number, attempts: number): number {
  // Beta(1,1) prior: mean = (s+1)/(n+2)
  return clamp((successes + 1) / (attempts + 2), 0, 1);
}

function defaultNextReview(at: Date, success: boolean): Date {
  const days = success ? 3 : 1; // Phase 3 will replace this with SM-2 scheduling
  return new Date(at.getTime() + days * 24 * 60 * 60 * 1000);
}

export interface UserKnowledgeTrackerOptions {
  storage?: LearningStorageAdapter;
  autoPersist?: boolean;
  computeNextReview?: (at: Date, success: boolean, state: UserKnowledgeState) => Date;
}

export class UserKnowledgeTracker {
  private byUser = new Map<string, Map<string, UserKnowledgeState>>();
  private storage: LearningStorageAdapter;
  private autoPersist: boolean;
  private computeNextReview: (at: Date, success: boolean, state: UserKnowledgeState) => Date;
  private initialized = false;
  private loadedUsers = new Set<string>();

  constructor(options?: UserKnowledgeTrackerOptions) {
    this.storage = options?.storage ?? getDefaultStorage();
    this.autoPersist = options?.autoPersist ?? true;
    this.computeNextReview = options?.computeNextReview ?? ((at, success) => defaultNextReview(at, success));
  }

  /**
   * Initialize tracker
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.storage.initialize();
    this.initialized = true;
  }

  /**
   * Load user data from storage (lazy loading per user)
   */
  private async ensureUserLoaded(userId: string): Promise<void> {
    if (this.loadedUsers.has(userId)) return;

    await this.initialize();

    const states = await this.storage.loadKnowledgeStates(userId);
    const perUser = new Map<string, UserKnowledgeState>();

    for (const state of states) {
      perUser.set(state.concept, state);
    }

    this.byUser.set(userId, perUser);
    this.loadedUsers.add(userId);
  }

  async getState(userId: string, concept: string): Promise<UserKnowledgeState> {
    await this.ensureUserLoaded(userId);

    const perUser = this.byUser.get(userId) ?? new Map<string, UserKnowledgeState>();
    if (!this.byUser.has(userId)) this.byUser.set(userId, perUser);

    const existing = perUser.get(concept);
    if (existing) return existing;

    const fresh: UserKnowledgeState = {
      concept,
      exposures: 0,
      lastExposure: null,
      retrievalAttempts: 0,
      retrievalSuccesses: 0,
      retrievalRate: 0,
      confidence: 0.5,
      nextReview: null,
    };
    perUser.set(concept, fresh);
    return fresh;
  }

  /**
   * Get state synchronously (returns undefined if not loaded)
   */
  getStateSync(userId: string, concept: string): UserKnowledgeState | undefined {
    const perUser = this.byUser.get(userId);
    return perUser?.get(concept);
  }

  async recordExposure(userId: string, concept: string, at: Date = new Date()): Promise<UserKnowledgeUpdate> {
    const state = await this.getState(userId, concept);
    const changed: Array<keyof UserKnowledgeState> = [];

    state.exposures += 1;
    state.lastExposure = at;
    changed.push('exposures', 'lastExposure');

    // If there's no next review set yet, schedule a near-term review.
    if (!state.nextReview) {
      state.nextReview = defaultNextReview(at, true);
      changed.push('nextReview');
    }

    if (this.autoPersist) {
      await this.storage.saveKnowledgeState(userId, state);
    }

    return { state, changed };
  }

  async recordRetrievalAttempt(
    userId: string,
    concept: string,
    quality: 0 | 1 | 2 | 3 | 4 | 5,
    at: Date = new Date()
  ): Promise<UserKnowledgeUpdate> {
    const state = await this.getState(userId, concept);
    const changed: Array<keyof UserKnowledgeState> = [];

    const success = quality >= 3;
    state.retrievalAttempts += 1;
    if (success) state.retrievalSuccesses += 1;
    state.retrievalRate = state.retrievalAttempts > 0 ? state.retrievalSuccesses / state.retrievalAttempts : 0;
    state.confidence = computeSmoothedMastery(state.retrievalSuccesses, state.retrievalAttempts);
    state.nextReview = this.computeNextReview(at, success, state);

    changed.push('retrievalAttempts', 'retrievalSuccesses', 'retrievalRate', 'confidence', 'nextReview');

    if (this.autoPersist) {
      await this.storage.saveKnowledgeState(userId, state);
    }

    return { state, changed };
  }

  async getDueConcepts(userId: string, asOf: Date = new Date()): Promise<UserKnowledgeState[]> {
    await this.ensureUserLoaded(userId);

    const perUser = this.byUser.get(userId);
    if (!perUser) return [];
    return [...perUser.values()]
      .filter(s => s.nextReview && s.nextReview.getTime() <= asOf.getTime())
      .sort((a, b) => (a.nextReview?.getTime() ?? 0) - (b.nextReview?.getTime() ?? 0));
  }

  /**
   * Get all concepts for a user
   */
  async getAllConcepts(userId: string): Promise<UserKnowledgeState[]> {
    await this.ensureUserLoaded(userId);
    const perUser = this.byUser.get(userId);
    return perUser ? [...perUser.values()] : [];
  }
}

// Singleton tracker instance
let defaultTracker: UserKnowledgeTracker | null = null;

/**
 * Get the default user knowledge tracker (singleton)
 */
export function getUserKnowledgeTracker(): UserKnowledgeTracker {
  if (!defaultTracker) {
    defaultTracker = new UserKnowledgeTracker();
  }
  return defaultTracker;
}

/**
 * Create a new tracker with custom options
 */
export function createUserKnowledgeTracker(options?: UserKnowledgeTrackerOptions): UserKnowledgeTracker {
  return new UserKnowledgeTracker(options);
}

