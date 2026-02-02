/**
 * Learning Storage Adapter
 *
 * Provides persistence for learning data including:
 * - Spaced repetition cards and reviews
 * - Practice sessions and skill proficiency
 * - User knowledge state
 * - Calibration predictions
 *
 * Uses file-based storage in ~/.ari/learning/ by default.
 * Storage is designed to survive process restarts.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { homedir } from 'node:os';

import type { SpacedRepetitionCard, SpacedRepetitionReview } from './spaced-repetition.js';
import type { PracticeSession, SkillProficiency } from './practice-tracker.js';
import type { UserKnowledgeState } from './user-knowledge.js';
import type { CalibrationPrediction } from './calibration.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Extended skill proficiency with additional ZPD and milestone tracking
 */
export interface ExtendedSkillProficiency extends SkillProficiency {
  skillId: string;
  domain: 'LOGOS' | 'ETHOS' | 'PATHOS';
  masteryThreshold: number;
  zpd: {
    lowerBound: number;
    upperBound: number;
    current: 'BELOW' | 'IN_ZPD' | 'ABOVE';
  };
  milestones: Array<{
    level: number;
    reached: Date;
    celebration: string;
  }>;
}

/**
 * Monthly summary for self-assessment comparison
 */
export interface MonthlySummary {
  month: string; // YYYY-MM format
  decisionsCount: number;
  successRate: number;
  biasCount: number;
  insightsGenerated: number;
  timestamp: Date;
}

/**
 * Query/failure tracking for gap analysis
 */
export interface TrackedQuery {
  id: string;
  query: string;
  domain: string;
  answered: boolean;
  confidence?: number;
  timestamp: Date;
}

export interface TrackedFailure {
  id: string;
  description: string;
  domain: string;
  reason?: string;
  timestamp: Date;
}

// =============================================================================
// Storage Interface
// =============================================================================

/**
 * Abstract interface for learning data persistence
 */
export interface LearningStorageAdapter {
  // Lifecycle
  initialize(): Promise<void>;

  // Spaced Repetition Cards
  loadCards(): Promise<SpacedRepetitionCard[]>;
  saveCards(cards: SpacedRepetitionCard[]): Promise<void>;
  appendCard(card: SpacedRepetitionCard): Promise<void>;
  updateCard(card: SpacedRepetitionCard): Promise<void>;

  // Spaced Repetition Reviews
  loadReviews(): Promise<SpacedRepetitionReview[]>;
  appendReview(review: SpacedRepetitionReview): Promise<void>;

  // Practice Sessions
  loadPracticeSessions(): Promise<PracticeSession[]>;
  savePracticeSession(session: PracticeSession): Promise<void>;

  // Skill Proficiency
  loadSkillProficiencies(): Promise<ExtendedSkillProficiency[]>;
  saveSkillProficiency(skill: ExtendedSkillProficiency): Promise<void>;

  // User Knowledge State
  loadKnowledgeStates(userId: string): Promise<UserKnowledgeState[]>;
  saveKnowledgeState(userId: string, state: UserKnowledgeState): Promise<void>;

  // Calibration
  loadCalibrationPredictions(): Promise<CalibrationPrediction[]>;
  saveCalibrationPrediction(prediction: CalibrationPrediction): Promise<void>;

  // Monthly Summaries (for self-assessment)
  loadMonthlySummaries(): Promise<MonthlySummary[]>;
  saveMonthlySummary(summary: MonthlySummary): Promise<void>;

  // Query/Failure Tracking (for gap analysis)
  loadQueries(since: Date): Promise<TrackedQuery[]>;
  saveQuery(query: TrackedQuery): Promise<void>;
  loadFailures(since: Date): Promise<TrackedFailure[]>;
  saveFailure(failure: TrackedFailure): Promise<void>;
}

// =============================================================================
// Date Serialization Helpers
// =============================================================================

/**
 * JSON reviver for Date objects
 */
export function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    // ISO date string pattern
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    if (isoDatePattern.test(value)) {
      return new Date(value);
    }
  }
  return value;
}

/**
 * JSON replacer for Date objects (converts to ISO string)
 */
export function dateReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

// =============================================================================
// File Storage Implementation
// =============================================================================

/**
 * File-based implementation of LearningStorageAdapter
 *
 * Stores data in JSON files under ~/.ari/learning/
 */
export class FileStorageAdapter implements LearningStorageAdapter {
  private baseDir: string;
  private initialized = false;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? path.join(homedir(), '.ari', 'learning');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create directory structure
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.mkdir(path.join(this.baseDir, 'users'), { recursive: true });

    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private filePath(name: string): string {
    return path.join(this.baseDir, name);
  }

  private async readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
    await this.ensureInitialized();
    const filepath = this.filePath(filename);

    try {
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data, dateReviver) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return defaultValue;
      }
      throw error;
    }
  }

  private async writeJsonFile<T>(filename: string, data: T): Promise<void> {
    await this.ensureInitialized();
    const filepath = this.filePath(filename);
    await fs.writeFile(filepath, JSON.stringify(data, dateReplacer, 2));
  }

  private async appendToJsonArray<T extends { id: string }>(filename: string, item: T): Promise<void> {
    const items = await this.readJsonFile<T[]>(filename, []);
    const existingIndex = items.findIndex(i => i.id === item.id);

    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }

    await this.writeJsonFile(filename, items);
  }

  // ---------------------------------------------------------------------------
  // Spaced Repetition Cards
  // ---------------------------------------------------------------------------

  async loadCards(): Promise<SpacedRepetitionCard[]> {
    return this.readJsonFile<SpacedRepetitionCard[]>('cards.json', []);
  }

  async saveCards(cards: SpacedRepetitionCard[]): Promise<void> {
    await this.writeJsonFile('cards.json', cards);
  }

  async appendCard(card: SpacedRepetitionCard): Promise<void> {
    await this.appendToJsonArray('cards.json', card);
  }

  async updateCard(card: SpacedRepetitionCard): Promise<void> {
    await this.appendToJsonArray('cards.json', card);
  }

  // ---------------------------------------------------------------------------
  // Spaced Repetition Reviews
  // ---------------------------------------------------------------------------

  async loadReviews(): Promise<SpacedRepetitionReview[]> {
    return this.readJsonFile<SpacedRepetitionReview[]>('reviews.json', []);
  }

  async appendReview(review: SpacedRepetitionReview): Promise<void> {
    const reviews = await this.loadReviews();
    reviews.push(review);
    await this.writeJsonFile('reviews.json', reviews);
  }

  // ---------------------------------------------------------------------------
  // Practice Sessions
  // ---------------------------------------------------------------------------

  async loadPracticeSessions(): Promise<PracticeSession[]> {
    return this.readJsonFile<PracticeSession[]>('practice-sessions.json', []);
  }

  async savePracticeSession(session: PracticeSession): Promise<void> {
    await this.appendToJsonArray('practice-sessions.json', session);
  }

  // ---------------------------------------------------------------------------
  // Skill Proficiency
  // ---------------------------------------------------------------------------

  async loadSkillProficiencies(): Promise<ExtendedSkillProficiency[]> {
    return this.readJsonFile<ExtendedSkillProficiency[]>('skill-proficiency.json', []);
  }

  async saveSkillProficiency(skill: ExtendedSkillProficiency): Promise<void> {
    const skills = await this.loadSkillProficiencies();
    const existingIndex = skills.findIndex(s => s.skillId === skill.skillId);

    if (existingIndex >= 0) {
      skills[existingIndex] = skill;
    } else {
      skills.push(skill);
    }

    await this.writeJsonFile('skill-proficiency.json', skills);
  }

  // ---------------------------------------------------------------------------
  // User Knowledge State
  // ---------------------------------------------------------------------------

  async loadKnowledgeStates(userId: string): Promise<UserKnowledgeState[]> {
    const userDir = path.join(this.baseDir, 'users', userId);
    await fs.mkdir(userDir, { recursive: true });

    const filepath = path.join(userDir, 'knowledge-state.json');
    try {
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data, dateReviver) as UserKnowledgeState[];
    } catch {
      return [];
    }
  }

  async saveKnowledgeState(userId: string, state: UserKnowledgeState): Promise<void> {
    const states = await this.loadKnowledgeStates(userId);
    const existingIndex = states.findIndex(s => s.concept === state.concept);

    if (existingIndex >= 0) {
      states[existingIndex] = state;
    } else {
      states.push(state);
    }

    const userDir = path.join(this.baseDir, 'users', userId);
    await fs.mkdir(userDir, { recursive: true });
    await fs.writeFile(
      path.join(userDir, 'knowledge-state.json'),
      JSON.stringify(states, dateReplacer, 2)
    );
  }

  // ---------------------------------------------------------------------------
  // Calibration
  // ---------------------------------------------------------------------------

  async loadCalibrationPredictions(): Promise<CalibrationPrediction[]> {
    return this.readJsonFile<CalibrationPrediction[]>('calibration.json', []);
  }

  async saveCalibrationPrediction(prediction: CalibrationPrediction): Promise<void> {
    await this.appendToJsonArray('calibration.json', prediction);
  }

  // ---------------------------------------------------------------------------
  // Monthly Summaries
  // ---------------------------------------------------------------------------

  async loadMonthlySummaries(): Promise<MonthlySummary[]> {
    return this.readJsonFile<MonthlySummary[]>('monthly-summaries.json', []);
  }

  async saveMonthlySummary(summary: MonthlySummary): Promise<void> {
    const summaries = await this.loadMonthlySummaries();
    const existingIndex = summaries.findIndex(s => s.month === summary.month);

    if (existingIndex >= 0) {
      summaries[existingIndex] = summary;
    } else {
      summaries.push(summary);
    }

    await this.writeJsonFile('monthly-summaries.json', summaries);
  }

  // ---------------------------------------------------------------------------
  // Query/Failure Tracking
  // ---------------------------------------------------------------------------

  async loadQueries(since: Date): Promise<TrackedQuery[]> {
    const all = await this.readJsonFile<TrackedQuery[]>('queries.json', []);
    return all.filter(q => q.timestamp >= since);
  }

  async saveQuery(query: TrackedQuery): Promise<void> {
    await this.appendToJsonArray('queries.json', query);
  }

  async loadFailures(since: Date): Promise<TrackedFailure[]> {
    const all = await this.readJsonFile<TrackedFailure[]>('failures.json', []);
    return all.filter(f => f.timestamp >= since);
  }

  async saveFailure(failure: TrackedFailure): Promise<void> {
    await this.appendToJsonArray('failures.json', failure);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let defaultStorage: FileStorageAdapter | null = null;

/**
 * Get the default file storage adapter (singleton)
 */
export function getDefaultStorage(): FileStorageAdapter {
  if (!defaultStorage) {
    defaultStorage = new FileStorageAdapter();
  }
  return defaultStorage;
}

/**
 * Create a new storage adapter with custom base directory
 */
export function createStorage(baseDir: string): FileStorageAdapter {
  return new FileStorageAdapter(baseDir);
}
