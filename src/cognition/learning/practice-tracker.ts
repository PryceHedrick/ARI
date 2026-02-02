/**
 * Deliberate Practice Tracker
 *
 * Captures practice sessions, skill progression, and performance signals.
 * This is the "measurement layer" for deliberate practice.
 *
 * Features:
 * - Track practice sessions with focused vs total time
 * - Skill proficiency modeling with ZPD detection
 * - Persistent storage via FileStorageAdapter
 */

import type { LearningStorageAdapter, ExtendedSkillProficiency } from './storage-adapter.js';
import { getDefaultStorage } from './storage-adapter.js';

export interface PracticeSession {
  id: string;
  skill: string;
  startedAt: Date;
  endedAt: Date;
  plannedMinutes: number;
  focusedMinutes: number;

  tasksPlanned: number;
  tasksCompleted: number;

  estimatedMinutes?: number;
  actualMinutes?: number;

  errorPatterns: string[];
}

export interface SkillProficiency {
  skill: string;
  currentLevel: number; // 0-100
  targetLevel: number; // 0-100

  practice: {
    totalHours: number;
    focusedHours: number;
    lastPractice: Date | null;
    consistency: number; // days practiced / days observed
  };

  performance: {
    successRate: number;
    timeEfficiency: number; // actual / estimated, 1.0 = on-target
    qualityScore: number; // placeholder
    errorPatterns: string[];
  };

  progression: {
    weeklyGain: number;
    plateau: boolean;
    estimatedToTarget: number;
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hoursFromMinutes(mins: number): number {
  return mins / 60;
}

function makeId(prefix = 'practice'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface PracticeTrackerOptions {
  storage?: LearningStorageAdapter;
  autoPersist?: boolean;
}

export class PracticeTracker {
  private sessionsByUser = new Map<string, PracticeSession[]>();
  private skillByUser = new Map<string, Map<string, SkillProficiency>>();
  private extendedSkills = new Map<string, ExtendedSkillProficiency>();
  private storage: LearningStorageAdapter;
  private autoPersist: boolean;
  private initialized = false;

  constructor(options?: PracticeTrackerOptions) {
    this.storage = options?.storage ?? getDefaultStorage();
    this.autoPersist = options?.autoPersist ?? true;
  }

  /**
   * Initialize tracker by loading data from storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.storage.initialize();

    // Load practice sessions
    const sessions = await this.storage.loadPracticeSessions();
    for (const session of sessions) {
      // Group by userId (extract from session id or use default)
      const userId = 'default'; // TODO: Add userId to PracticeSession
      const userSessions = this.sessionsByUser.get(userId) ?? [];
      userSessions.push(session);
      this.sessionsByUser.set(userId, userSessions);
    }

    // Load extended skill proficiencies
    const skills = await this.storage.loadSkillProficiencies();
    for (const skill of skills) {
      this.extendedSkills.set(skill.skillId, skill);
    }

    this.initialized = true;
  }

  /**
   * Persist all data to storage
   */
  async persist(): Promise<void> {
    const allSessions = [...this.sessionsByUser.values()].flat();
    for (const session of allSessions) {
      await this.storage.savePracticeSession(session);
    }

    for (const skill of this.extendedSkills.values()) {
      await this.storage.saveSkillProficiency(skill);
    }
  }

  getSkill(userId: string, skill: string): SkillProficiency {
    const perUser = this.skillByUser.get(userId) ?? new Map<string, SkillProficiency>();
    if (!this.skillByUser.has(userId)) this.skillByUser.set(userId, perUser);

    const existing = perUser.get(skill);
    if (existing) return existing;

    const fresh: SkillProficiency = {
      skill,
      currentLevel: 50,
      targetLevel: 80,
      practice: {
        totalHours: 0,
        focusedHours: 0,
        lastPractice: null,
        consistency: 0,
      },
      performance: {
        successRate: 1,
        timeEfficiency: 1,
        qualityScore: 0.8,
        errorPatterns: [],
      },
      progression: {
        weeklyGain: 0,
        plateau: false,
        estimatedToTarget: 0,
      },
    };

    perUser.set(skill, fresh);
    return fresh;
  }

  /**
   * Get extended skill proficiency with ZPD and milestones
   */
  getExtendedSkill(skillId: string): ExtendedSkillProficiency | undefined {
    return this.extendedSkills.get(skillId);
  }

  /**
   * Register or update an extended skill
   */
  async registerExtendedSkill(skill: ExtendedSkillProficiency): Promise<void> {
    this.extendedSkills.set(skill.skillId, skill);
    if (this.autoPersist) {
      await this.storage.saveSkillProficiency(skill);
    }
  }

  /**
   * Get all extended skills
   */
  getAllExtendedSkills(): ExtendedSkillProficiency[] {
    return [...this.extendedSkills.values()];
  }

  startSession(params: {
    userId: string;
    skill: string;
    plannedMinutes: number;
    tasksPlanned: number;
    startedAt?: Date;
  }): { session: PracticeSession; skill: SkillProficiency } {
    const startedAt = params.startedAt ?? new Date();
    const session: PracticeSession = {
      id: makeId('practice-session'),
      skill: params.skill,
      startedAt,
      endedAt: startedAt,
      plannedMinutes: params.plannedMinutes,
      focusedMinutes: 0,
      tasksPlanned: params.tasksPlanned,
      tasksCompleted: 0,
      errorPatterns: [],
    };

    const skill = this.getSkill(params.userId, params.skill);
    return { session, skill };
  }

  async recordSession(params: {
    userId: string;
    skill: string;
    session: Omit<PracticeSession, 'id'> & { id?: string };
  }): Promise<{ session: PracticeSession; skill: SkillProficiency }> {
    const existingSessions = this.sessionsByUser.get(params.userId) ?? [];
    if (!this.sessionsByUser.has(params.userId)) this.sessionsByUser.set(params.userId, existingSessions);

    const session: PracticeSession = {
      id: params.session.id ?? makeId('practice-session'),
      ...params.session,
    };
    existingSessions.push(session);

    const skill = this.getSkill(params.userId, params.skill);
    this.updateSkillFromSession(skill, session, existingSessions);

    if (this.autoPersist) {
      await this.storage.savePracticeSession(session);
    }

    return { session, skill };
  }

  getSessions(userId: string, skill?: string): PracticeSession[] {
    const sessions = this.sessionsByUser.get(userId) ?? [];
    if (!skill) return [...sessions];
    return sessions.filter(s => s.skill === skill);
  }

  private updateSkillFromSession(skill: SkillProficiency, session: PracticeSession, sessions: PracticeSession[]): void {
    const durationMinutes = Math.max(0, (session.endedAt.getTime() - session.startedAt.getTime()) / 60000);

    skill.practice.totalHours += hoursFromMinutes(durationMinutes);
    skill.practice.focusedHours += hoursFromMinutes(session.focusedMinutes);
    skill.practice.lastPractice = session.endedAt;

    // Success rate
    skill.performance.successRate = session.tasksPlanned > 0 ? session.tasksCompleted / session.tasksPlanned : 1;

    // Time efficiency
    if (session.estimatedMinutes && session.actualMinutes) {
      skill.performance.timeEfficiency = session.actualMinutes / Math.max(1, session.estimatedMinutes);
    } else {
      skill.performance.timeEfficiency = session.plannedMinutes > 0 ? durationMinutes / session.plannedMinutes : 1;
    }

    // Error patterns
    skill.performance.errorPatterns = [...session.errorPatterns, ...skill.performance.errorPatterns].slice(0, 50);

    // Update level: simplistic learning gain based on focused effort and completion
    const effortGain = clamp(hoursFromMinutes(session.focusedMinutes) * 2, 0, 5);
    const completionGain = clamp(skill.performance.successRate * 2, 0, 2);
    const gain = effortGain + completionGain;
    skill.currentLevel = clamp(skill.currentLevel + gain, 0, 100);

    // Progression heuristics
    const last7Days = sessions.filter(s => (session.endedAt.getTime() - s.endedAt.getTime()) <= 7 * 24 * 60 * 60 * 1000);
    const previous7Days = sessions.filter(s => {
      const age = session.endedAt.getTime() - s.endedAt.getTime();
      return age > 7 * 24 * 60 * 60 * 1000 && age <= 14 * 24 * 60 * 60 * 1000;
    });
    const weeklyFocusedHours = last7Days.reduce((sum, s) => sum + hoursFromMinutes(s.focusedMinutes), 0);
    const prevWeeklyFocusedHours = previous7Days.reduce((sum, s) => sum + hoursFromMinutes(s.focusedMinutes), 0);
    skill.progression.weeklyGain = clamp((weeklyFocusedHours - prevWeeklyFocusedHours) * 2, -10, 10);

    // Plateau: 3 weeks low gain
    skill.progression.plateau = skill.progression.weeklyGain < 0.5 && sessions.length >= 6;

    // Consistency: days practiced / days observed (approx)
    const first = sessions[0]?.startedAt ?? session.startedAt;
    const daysObserved = Math.max(1, Math.ceil((session.endedAt.getTime() - first.getTime()) / (24 * 60 * 60 * 1000)));
    const daysPracticed = new Set(sessions.map(s => s.startedAt.toISOString().slice(0, 10))).size;
    skill.practice.consistency = clamp(daysPracticed / daysObserved, 0, 1);

    // ETA to target (very rough)
    const remaining = Math.max(0, skill.targetLevel - skill.currentLevel);
    const weeklyLevelGain = Math.max(0.5, gain); // avoid divide by zero
    skill.progression.estimatedToTarget = Math.ceil(remaining / weeklyLevelGain);
  }
}

// Singleton tracker instance with storage persistence
let defaultTracker: PracticeTracker | null = null;
let initPromise: Promise<PracticeTracker> | null = null;

/**
 * Get the default practice tracker (singleton)
 * Automatically initializes on first call
 */
export async function getPracticeTracker(): Promise<PracticeTracker> {
  if (defaultTracker) return defaultTracker;

  // Prevent race conditions during initialization
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const tracker = new PracticeTracker();
    await tracker.initialize();
    defaultTracker = tracker;
    return tracker;
  })();

  return initPromise;
}

/**
 * Get tracker synchronously (returns null if not initialized)
 */
export function getPracticeTrackerSync(): PracticeTracker | null {
  return defaultTracker;
}

/**
 * Create a new tracker with custom options
 */
export function createPracticeTracker(options?: PracticeTrackerOptions): PracticeTracker {
  return new PracticeTracker(options);
}

