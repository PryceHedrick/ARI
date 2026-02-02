/**
 * Skill Registry with Zone of Proximal Development (ZPD)
 *
 * Implements Ericsson's deliberate practice framework with:
 * - Skill proficiency tracking with levels 0-100
 * - Zone of Proximal Development calculation (Vygotsky)
 * - Plateau detection (3-week sliding window)
 * - Milestone system (25%, 50%, 75%, 100%)
 * - Integration with practice tracker
 *
 * Research: Ericsson (2016) Peak, Vygotsky (1978) ZPD
 */

import type { LearningStorageAdapter, ExtendedSkillProficiency } from './storage-adapter.js';
import { getDefaultStorage } from './storage-adapter.js';
import type { PracticeSession } from './practice-tracker.js';

// =============================================================================
// Types
// =============================================================================

export type SkillDomain = 'LOGOS' | 'ETHOS' | 'PATHOS';

export type ZPDPosition = 'BELOW' | 'IN_ZPD' | 'ABOVE';

export interface ZPDAnalysis {
  skillId: string;
  lowerBound: number;      // Below this = too easy (>90% success)
  upperBound: number;      // Above this = too hard (<60% success)
  currentLevel: number;
  position: ZPDPosition;
  recommendation: string;
  optimalChallengeLevel: number;
}

export interface SkillMilestone {
  level: number;
  name: string;
  celebration: string;
  reached: Date;
}

export interface PlateauAnalysis {
  skillId: string;
  isPlateaued: boolean;
  weeklyGainHistory: number[];
  averageGain: number;
  weeksStagnant: number;
  recommendation: string;
}

export interface SkillRegistrationParams {
  skillId: string;
  skillName: string;
  domain: SkillDomain;
  targetLevel?: number;
  masteryThreshold?: number;
  initialLevel?: number;
}

// =============================================================================
// Constants
// =============================================================================

const MILESTONES: Array<{ level: number; name: string; celebration: string }> = [
  { level: 25, name: 'Foundation Laid', celebration: 'You have established the basics!' },
  { level: 50, name: 'Halfway There', celebration: 'Great progress! You are halfway to mastery.' },
  { level: 75, name: 'Advanced Practitioner', celebration: 'Impressive! You demonstrate advanced understanding.' },
  { level: 100, name: 'Mastery Achieved', celebration: 'Congratulations! You have mastered this skill.' },
];

const ZPD_SUCCESS_THRESHOLD_EASY = 0.90;  // >90% success = too easy
const ZPD_SUCCESS_THRESHOLD_HARD = 0.60;  // <60% success = too hard
const PLATEAU_WEEKS_THRESHOLD = 2;        // 2+ weeks with <2 points gain = plateau
const PLATEAU_MIN_GAIN = 2;               // Minimum weekly gain to not be considered plateau

// =============================================================================
// Skill Registry
// =============================================================================

export interface SkillRegistryOptions {
  storage?: LearningStorageAdapter;
  autoPersist?: boolean;
}

export class SkillRegistry {
  private skills = new Map<string, ExtendedSkillProficiency>();
  private practiceHistory = new Map<string, PracticeSession[]>();
  private storage: LearningStorageAdapter;
  private autoPersist: boolean;
  private initialized = false;

  constructor(options?: SkillRegistryOptions) {
    this.storage = options?.storage ?? getDefaultStorage();
    this.autoPersist = options?.autoPersist ?? true;
  }

  /**
   * Initialize registry by loading from storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.storage.initialize();
    const skills = await this.storage.loadSkillProficiencies();

    for (const skill of skills) {
      this.skills.set(skill.skillId, skill);
    }

    // Load practice sessions
    const sessions = await this.storage.loadPracticeSessions();
    for (const session of sessions) {
      const existing = this.practiceHistory.get(session.skill) ?? [];
      existing.push(session);
      this.practiceHistory.set(session.skill, existing);
    }

    this.initialized = true;
  }

  /**
   * Register a new skill or get existing one
   */
  async registerSkill(params: SkillRegistrationParams): Promise<ExtendedSkillProficiency> {
    await this.initialize();

    const existing = this.skills.get(params.skillId);
    if (existing) return existing;

    const skill: ExtendedSkillProficiency = {
      skillId: params.skillId,
      skill: params.skillName,
      domain: params.domain,
      currentLevel: params.initialLevel ?? 0,
      targetLevel: params.targetLevel ?? 80,
      masteryThreshold: params.masteryThreshold ?? 80,
      practice: {
        totalHours: 0,
        focusedHours: 0,
        lastPractice: null,
        consistency: 0,
      },
      performance: {
        successRate: 0,
        timeEfficiency: 1,
        qualityScore: 0,
        errorPatterns: [],
      },
      progression: {
        weeklyGain: 0,
        plateau: false,
        estimatedToTarget: 0,
      },
      zpd: {
        lowerBound: 0,
        upperBound: 20,
        current: 'IN_ZPD',
      },
      milestones: [],
    };

    this.skills.set(params.skillId, skill);

    if (this.autoPersist) {
      await this.storage.saveSkillProficiency(skill);
    }

    return skill;
  }

  /**
   * Get skill by ID
   */
  getSkill(skillId: string): ExtendedSkillProficiency | undefined {
    return this.skills.get(skillId);
  }

  /**
   * Get all skills
   */
  getAllSkills(): ExtendedSkillProficiency[] {
    return [...this.skills.values()];
  }

  /**
   * Get skills by domain
   */
  getSkillsByDomain(domain: SkillDomain): ExtendedSkillProficiency[] {
    return [...this.skills.values()].filter(s => s.domain === domain);
  }

  /**
   * Update skill after a practice session
   */
  async updateFromPractice(
    skillId: string,
    session: PracticeSession
  ): Promise<{ skill: ExtendedSkillProficiency; milestone: SkillMilestone | null }> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    // Store practice session
    const history = this.practiceHistory.get(skillId) ?? [];
    history.push(session);
    this.practiceHistory.set(skillId, history);

    // Update practice metrics
    const durationHours = (session.endedAt.getTime() - session.startedAt.getTime()) / (1000 * 60 * 60);
    skill.practice.totalHours += durationHours;
    skill.practice.focusedHours += session.focusedMinutes / 60;
    skill.practice.lastPractice = session.endedAt;

    // Update performance
    if (session.tasksPlanned > 0) {
      skill.performance.successRate = session.tasksCompleted / session.tasksPlanned;
    }
    if (session.estimatedMinutes && session.actualMinutes) {
      skill.performance.timeEfficiency = session.actualMinutes / session.estimatedMinutes;
    }

    // Add error patterns
    skill.performance.errorPatterns = [
      ...session.errorPatterns,
      ...skill.performance.errorPatterns,
    ].slice(0, 20);

    // Calculate level gain based on focused practice
    const levelGain = this.calculateLevelGain(skill, session);
    const previousLevel = skill.currentLevel;
    skill.currentLevel = Math.min(100, skill.currentLevel + levelGain);

    // Update ZPD
    this.updateZPD(skill);

    // Update progression
    this.updateProgression(skill, history);

    // Check for plateau
    const plateau = this.detectPlateau(skillId);
    skill.progression.plateau = plateau.isPlateaued;

    // Check for milestone
    const milestone = this.checkMilestone(skill, previousLevel);

    // Calculate ETA to target
    skill.progression.estimatedToTarget = this.calculateETA(skill);

    if (this.autoPersist) {
      await this.storage.saveSkillProficiency(skill);
    }

    return { skill, milestone };
  }

  /**
   * Calculate level gain from a practice session
   */
  private calculateLevelGain(skill: ExtendedSkillProficiency, session: PracticeSession): number {
    // Base gain from focused practice (Ericsson: deliberate practice hours matter most)
    const focusedHours = session.focusedMinutes / 60;
    const baseGain = focusedHours * 2; // ~2 points per hour of focused practice

    // Multiplier based on success rate
    const successMultiplier = session.tasksPlanned > 0
      ? 0.5 + (session.tasksCompleted / session.tasksPlanned) * 0.5
      : 1;

    // ZPD multiplier (learning is maximized in ZPD)
    let zpdMultiplier = 1;
    if (skill.zpd.current === 'IN_ZPD') {
      zpdMultiplier = 1.5; // 50% bonus for optimal challenge
    } else if (skill.zpd.current === 'BELOW') {
      zpdMultiplier = 0.5; // Diminished returns for too-easy practice
    } else {
      zpdMultiplier = 0.75; // Some penalty for too-hard practice (frustration)
    }

    // Diminishing returns at higher levels
    const levelFactor = 1 - (skill.currentLevel / 200); // 50% at level 100

    return Math.max(0.1, baseGain * successMultiplier * zpdMultiplier * levelFactor);
  }

  /**
   * Update Zone of Proximal Development
   */
  private updateZPD(skill: ExtendedSkillProficiency): void {
    const level = skill.currentLevel;

    // ZPD is roughly ±10-15 points around current level
    const range = 10 + Math.floor(level / 10); // Wider range at higher levels
    skill.zpd.lowerBound = Math.max(0, level - range);
    skill.zpd.upperBound = Math.min(100, level + range);

    // Determine current position based on recent success rate
    if (skill.performance.successRate > ZPD_SUCCESS_THRESHOLD_EASY) {
      skill.zpd.current = 'BELOW';
    } else if (skill.performance.successRate < ZPD_SUCCESS_THRESHOLD_HARD) {
      skill.zpd.current = 'ABOVE';
    } else {
      skill.zpd.current = 'IN_ZPD';
    }
  }

  /**
   * Update progression metrics
   */
  private updateProgression(skill: ExtendedSkillProficiency, history: PracticeSession[]): void {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Calculate this week's focused hours
    const thisWeekSessions = history.filter(s => s.endedAt >= weekAgo);
    const lastWeekSessions = history.filter(s => s.endedAt >= twoWeeksAgo && s.endedAt < weekAgo);

    const thisWeekHours = thisWeekSessions.reduce((sum, s) => sum + s.focusedMinutes / 60, 0);
    const lastWeekHours = lastWeekSessions.reduce((sum, s) => sum + s.focusedMinutes / 60, 0);

    // Weekly gain approximation (2 points per focused hour)
    skill.progression.weeklyGain = (thisWeekHours - lastWeekHours) * 2;

    // Update consistency
    const daysObserved = history.length > 0
      ? Math.max(1, (now.getTime() - history[0].startedAt.getTime()) / (24 * 60 * 60 * 1000))
      : 1;
    const uniqueDays = new Set(history.map(s => s.startedAt.toISOString().slice(0, 10))).size;
    skill.practice.consistency = Math.min(1, uniqueDays / daysObserved);
  }

  /**
   * Calculate Zone of Proximal Development analysis
   */
  calculateZPD(skillId: string): ZPDAnalysis {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    const optimalLevel = (skill.zpd.lowerBound + skill.zpd.upperBound) / 2;

    let recommendation: string;
    switch (skill.zpd.current) {
      case 'BELOW':
        recommendation = `Increase challenge level. Practice problems in the ${skill.zpd.lowerBound}-${skill.zpd.upperBound} range.`;
        break;
      case 'ABOVE':
        recommendation = `Reduce challenge level. Build more foundation before tackling harder problems.`;
        break;
      case 'IN_ZPD':
        recommendation = `Optimal challenge level! Continue with current difficulty.`;
        break;
    }

    return {
      skillId,
      lowerBound: skill.zpd.lowerBound,
      upperBound: skill.zpd.upperBound,
      currentLevel: skill.currentLevel,
      position: skill.zpd.current,
      recommendation,
      optimalChallengeLevel: optimalLevel,
    };
  }

  /**
   * Detect if skill is plateaued
   */
  detectPlateau(skillId: string): PlateauAnalysis {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    const history = this.practiceHistory.get(skillId) ?? [];

    // Calculate weekly gains over last 4 weeks
    const weeklyGains: number[] = [];
    const now = new Date();

    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(now.getTime() - (week + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - week * 7 * 24 * 60 * 60 * 1000);

      const weekSessions = history.filter(
        s => s.endedAt >= weekStart && s.endedAt < weekEnd
      );

      const weekHours = weekSessions.reduce((sum, s) => sum + s.focusedMinutes / 60, 0);
      weeklyGains.push(weekHours * 2); // Approximate points gained
    }

    const averageGain = weeklyGains.length > 0
      ? weeklyGains.reduce((a, b) => a + b, 0) / weeklyGains.length
      : 0;

    const weeksStagnant = weeklyGains.filter(g => g < PLATEAU_MIN_GAIN).length;
    const isPlateaued = weeksStagnant >= PLATEAU_WEEKS_THRESHOLD;

    let recommendation: string;
    if (isPlateaued) {
      recommendation = 'Plateau detected! Try: (1) varying practice methods, (2) taking a short break, (3) seeking feedback, or (4) adjusting difficulty.';
    } else if (weeksStagnant >= 1) {
      recommendation = 'Progress slowing. Consider increasing focused practice time or varying your approach.';
    } else {
      recommendation = 'Good progress! Keep up the consistent practice.';
    }

    return {
      skillId,
      isPlateaued,
      weeklyGainHistory: weeklyGains,
      averageGain,
      weeksStagnant,
      recommendation,
    };
  }

  /**
   * Check if a milestone was reached
   */
  private checkMilestone(skill: ExtendedSkillProficiency, previousLevel: number): SkillMilestone | null {
    for (const milestone of MILESTONES) {
      if (previousLevel < milestone.level && skill.currentLevel >= milestone.level) {
        // Check if not already reached
        const alreadyReached = skill.milestones.some(m => m.level === milestone.level);
        if (!alreadyReached) {
          const reached: SkillMilestone = {
            level: milestone.level,
            name: milestone.name,
            celebration: milestone.celebration,
            reached: new Date(),
          };
          skill.milestones.push(reached);
          return reached;
        }
      }
    }
    return null;
  }

  /**
   * Calculate estimated time to target level
   */
  private calculateETA(skill: ExtendedSkillProficiency): number {
    const remaining = skill.targetLevel - skill.currentLevel;
    if (remaining <= 0) return 0;

    // Based on weekly gain (points per week)
    const weeklyGain = Math.max(0.5, skill.progression.weeklyGain);
    return Math.ceil(remaining / weeklyGain);
  }

  /**
   * Format skill progress for display
   */
  formatSkillProgress(skillId: string): string {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return `Skill not found: ${skillId}`;
    }

    const levelBar = '█'.repeat(Math.floor(skill.currentLevel / 5)) +
                     '░'.repeat(20 - Math.floor(skill.currentLevel / 5));
    const targetMarker = Math.floor(skill.targetLevel / 5);

    const lines = [
      '┌────────────────────────────────────────────────────────────┐',
      `│ SKILL: ${skill.skill.slice(0, 48).padEnd(48)} │`,
      `│ Domain: ${skill.domain.padEnd(10)} Level: ${skill.currentLevel.toFixed(0).padStart(3)}/100              │`,
      '├────────────────────────────────────────────────────────────┤',
      '│                                                            │',
      '│ Zone of Proximal Development:                              │',
      '│                                                            │',
      `│ [0]═══════════[${skill.zpd.lowerBound.toString().padStart(2)}]═══════════[${skill.zpd.upperBound.toString().padStart(2)}]═══════════[100]      │`,
      `│       TOO EASY   │    ZPD     │   TOO HARD                 │`,
      `│                  ${skill.zpd.current === 'IN_ZPD' ? '↑ You are here' : '              '}             │`,
      '│                                                            │',
      `│ Progress: [${levelBar}] ${skill.currentLevel.toFixed(0).padStart(3)}%                │`,
      `│ Target:   ${'─'.repeat(targetMarker)}▼${'─'.repeat(20 - targetMarker)}  ${skill.targetLevel}%                │`,
      '│                                                            │',
      `│ Practice: ${skill.practice.focusedHours.toFixed(1)}h focused / ${skill.practice.totalHours.toFixed(1)}h total              │`,
      `│ Success Rate: ${(skill.performance.successRate * 100).toFixed(0)}%                                       │`,
      `│ Weekly Gain: ${skill.progression.weeklyGain > 0 ? '+' : ''}${skill.progression.weeklyGain.toFixed(1)} points                              │`,
      `│ ETA to Target: ${skill.progression.estimatedToTarget} weeks                               │`,
      skill.progression.plateau
        ? '│ ⚠️  PLATEAU DETECTED - Consider varying practice methods   │'
        : '│                                                            │',
      '│                                                            │',
      '└────────────────────────────────────────────────────────────┘',
    ];

    return lines.join('\n');
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultRegistry: SkillRegistry | null = null;
let initPromise: Promise<SkillRegistry> | null = null;

/**
 * Get the default skill registry (singleton)
 */
export async function getSkillRegistry(): Promise<SkillRegistry> {
  if (defaultRegistry) return defaultRegistry;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const registry = new SkillRegistry();
    await registry.initialize();
    defaultRegistry = registry;
    return registry;
  })();

  return initPromise;
}

/**
 * Create a new registry with custom options
 */
export function createSkillRegistry(options?: SkillRegistryOptions): SkillRegistry {
  return new SkillRegistry(options);
}
