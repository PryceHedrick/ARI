/**
 * Cognition UX - Engagement Formatter
 *
 * Formats skill updates, feature additions, and system events in an engaging,
 * educational, rewarding way. Implements Mayer's multimedia principles:
 * - Dual-coding (visual + verbal)
 * - Progressive disclosure (summary first, details on demand)
 * - Coherence (no extraneous content)
 * - Signaling (highlight key information)
 *
 * Design principles:
 * - Celebratory but not cringy
 * - Educational - always teach something
 * - Personal - acknowledge the user's journey
 * - Actionable - suggest what to do next
 *
 * @module cognition/ux/engagement
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Skill announcement input
 */
export const SkillAnnouncementInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  utility: z.array(z.string()).min(1),
});
export type SkillAnnouncementInput = z.infer<typeof SkillAnnouncementInputSchema>;

/**
 * Update types for daily digest
 */
export const UpdateTypeSchema = z.enum([
  'SKILL_ADDED',
  'INSIGHT_GENERATED',
  'DECISION_MADE',
  'LEARNING_COMPLETED',
  'MILESTONE_REACHED',
  'ERROR_RECOVERED',
  'PATTERN_DISCOVERED',
  'KNOWLEDGE_INTEGRATED',
]);
export type UpdateType = z.infer<typeof UpdateTypeSchema>;

/**
 * Single update for daily digest
 */
export const UpdateSchema = z.object({
  type: UpdateTypeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  timestamp: z.date(),
  impact: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type Update = z.infer<typeof UpdateSchema>;

/**
 * Learning milestone types
 */
export const MilestoneTypeSchema = z.enum([
  'SKILL_MASTERY',
  'STREAK',
  'ACCURACY_IMPROVEMENT',
  'BIAS_REDUCTION',
  'KNOWLEDGE_EXPANSION',
  'PRACTICE_COMPLETION',
  'LEVEL_UP',
  'FIRST_USE',
]);
export type MilestoneType = z.infer<typeof MilestoneTypeSchema>;

/**
 * Learning milestone input
 */
export const LearningMilestoneInputSchema = z.object({
  type: MilestoneTypeSchema,
  achievement: z.string().min(1),
  nextGoal: z.string().min(1),
  progress: z.number().min(0).max(100).optional(),
  streak: z.number().int().positive().optional(),
  level: z.number().int().positive().optional(),
});
export type LearningMilestoneInput = z.infer<typeof LearningMilestoneInputSchema>;

/**
 * Insight discovery input
 */
export const InsightDiscoveryInputSchema = z.object({
  topic: z.string().min(1),
  explanation: z.string().min(1),
  application: z.string().min(1),
  source: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  relatedTopics: z.array(z.string()).optional(),
});
export type InsightDiscoveryInput = z.infer<typeof InsightDiscoveryInputSchema>;

/**
 * Formatted output options
 */
export const FormatterOptionsSchema = z.object({
  useEmoji: z.boolean().optional(),
  maxWidth: z.number().int().min(40).max(120).optional(),
  verbosity: z.enum(['compact', 'standard', 'detailed']).optional(),
});
export type FormatterOptions = z.infer<typeof FormatterOptionsSchema>;

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_WIDTH = 65;
const BORDER_CHAR = '=';
const SEPARATOR_CHAR = '-';

/**
 * Educational nuggets mapped to milestone types
 */
const MILESTONE_EDUCATION: Record<MilestoneType, string> = {
  SKILL_MASTERY:
    "Ericsson's research shows deliberate practice with feedback is what separates experts from amateurs.",
  STREAK:
    'Consistency compounds. Small daily improvements lead to remarkable results over time (Atomic Habits, Clear).',
  ACCURACY_IMPROVEMENT:
    'Calibration is the alignment between confidence and accuracy. Well-calibrated thinkers know what they know.',
  BIAS_REDUCTION:
    'Kahneman found that awareness of biases is the first step, but structured processes prevent them.',
  KNOWLEDGE_EXPANSION:
    "Munger's latticework of mental models: the more frameworks you have, the better your thinking.",
  PRACTICE_COMPLETION:
    "Deliberate practice isn't just repetition - it's targeted effort at the edge of your abilities.",
  LEVEL_UP:
    'Skill acquisition follows predictable stages: novice, competent, proficient, expert, master (Dreyfus model).',
  FIRST_USE:
    'The best way to learn is by doing. Theory without practice is sterile; practice without theory is blind.',
};

/**
 * Celebratory phrases for milestones (not cringy)
 */
const MILESTONE_CELEBRATIONS: Record<MilestoneType, string[]> = {
  SKILL_MASTERY: ['Skill unlocked.', 'New capability acquired.', 'Another tool in your arsenal.'],
  STREAK: ['Consistency pays off.', 'Momentum building.', 'The streak continues.'],
  ACCURACY_IMPROVEMENT: [
    'Getting sharper.',
    'Calibration improving.',
    'Better predictions ahead.',
  ],
  BIAS_REDUCTION: ['Clearer thinking.', 'Blind spots shrinking.', 'More rational decisions.'],
  KNOWLEDGE_EXPANSION: ['Mental model added.', 'Knowledge graph growing.', 'New connections formed.'],
  PRACTICE_COMPLETION: [
    'Practice complete.',
    'Session logged.',
    'Another rep in the bank.',
  ],
  LEVEL_UP: ['Level up.', 'New tier reached.', 'Skills advancing.'],
  FIRST_USE: ['First step taken.', 'Journey begun.', 'New path opened.'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a horizontal line of the specified character and width
 */
function makeLine(char: string, width: number): string {
  return char.repeat(width);
}

/**
 * Centers text within a given width
 */
function centerText(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  return ' '.repeat(leftPad) + text;
}

/**
 * Wraps text to fit within maxWidth, respecting word boundaries
 */
function wrapText(text: string, maxWidth: number, indent: number = 0): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const indentStr = ' '.repeat(indent);
  const effectiveWidth = maxWidth - indent;

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= effectiveWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(indentStr + currentLine);
      currentLine = word;
    }
  }

  if (currentLine.length > 0) {
    lines.push(indentStr + currentLine);
  }

  return lines;
}

/**
 * Renders a progress bar with percentage
 */
function renderProgress(progress: number, width: number = 10): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${progress}%`;
}

/**
 * Gets a random celebration phrase for a milestone type
 */
function getCelebration(type: MilestoneType): string {
  const phrases = MILESTONE_CELEBRATIONS[type];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Formats a timestamp in a human-friendly way
 */
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

/**
 * Groups updates by type for digest summary
 */
function groupUpdatesByType(updates: Update[]): Map<UpdateType, Update[]> {
  const grouped = new Map<UpdateType, Update[]>();
  for (const update of updates) {
    const existing = grouped.get(update.type) || [];
    existing.push(update);
    grouped.set(update.type, existing);
  }
  return grouped;
}

/**
 * Gets an icon for update type (text-based, no emoji)
 */
function getUpdateIcon(type: UpdateType, useEmoji: boolean): string {
  if (useEmoji) {
    const emojiMap: Record<UpdateType, string> = {
      SKILL_ADDED: '🎯',
      INSIGHT_GENERATED: '💡',
      DECISION_MADE: '⚖️',
      LEARNING_COMPLETED: '📚',
      MILESTONE_REACHED: '🏆',
      ERROR_RECOVERED: '🔧',
      PATTERN_DISCOVERED: '🔍',
      KNOWLEDGE_INTEGRATED: '🧠',
    };
    return emojiMap[type];
  }

  const textMap: Record<UpdateType, string> = {
    SKILL_ADDED: '[+]',
    INSIGHT_GENERATED: '[!]',
    DECISION_MADE: '[=]',
    LEARNING_COMPLETED: '[*]',
    MILESTONE_REACHED: '[^]',
    ERROR_RECOVERED: '[~]',
    PATTERN_DISCOVERED: '[?]',
    KNOWLEDGE_INTEGRATED: '[&]',
  };
  return textMap[type];
}

// =============================================================================
// MAIN FORMATTER CLASS
// =============================================================================

/**
 * EngagementFormatter - Formats system events in an engaging, educational way
 *
 * Implements Mayer's multimedia principles for effective learning:
 * 1. Coherence - Remove extraneous material
 * 2. Signaling - Highlight essential information
 * 3. Redundancy - Graphics + narration (not + on-screen text)
 * 4. Spatial contiguity - Place related items near each other
 * 5. Temporal contiguity - Present related items simultaneously
 */
export class EngagementFormatter {
  private options: Required<FormatterOptions>;

  constructor(options: FormatterOptions = {}) {
    this.options = {
      useEmoji: options.useEmoji ?? true,
      maxWidth: options.maxWidth ?? DEFAULT_WIDTH,
      verbosity: options.verbosity ?? 'standard',
    };
  }

  /**
   * Formats a skill announcement with educational context
   */
  formatSkillAnnouncement(skill: SkillAnnouncementInput): string {
    const validated = SkillAnnouncementInputSchema.parse(skill);
    const { maxWidth, useEmoji } = this.options;

    const lines: string[] = [];
    const border = makeLine(BORDER_CHAR, maxWidth);
    const separator = makeLine(SEPARATOR_CHAR, maxWidth);

    // Header
    lines.push(border);
    const icon = useEmoji ? '🎯 ' : '';
    const headerText = `${icon}NEW SKILL UNLOCKED: ${validated.name}`;
    lines.push(centerText(headerText, maxWidth));
    lines.push(border);
    lines.push('');

    // Description section
    lines.push('What it does:');
    lines.push(...wrapText(validated.description, maxWidth, 3));
    lines.push('');

    // Why it matters - educational nugget
    lines.push('Why it matters:');
    // Pick a relevant educational note based on skill content
    const educationalNote = this.getSkillEducation(validated);
    lines.push(...wrapText(educationalNote, maxWidth, 3));
    lines.push('');

    // Utility examples
    if (validated.utility.length > 0) {
      lines.push('What you can do:');
      for (const example of validated.utility) {
        lines.push(`   • ${example}`);
      }
      lines.push('');
    }

    // Progress indicator (placeholder - could be dynamic)
    const progressBar = renderProgress(40, 10);
    lines.push(`Progress: ${progressBar} to next level`);

    lines.push(separator);

    return lines.join('\n');
  }

  /**
   * Formats a daily digest summarizing ARI's activity
   */
  formatDailyDigest(updates: Update[]): string {
    if (updates.length === 0) {
      return this.formatEmptyDigest();
    }

    const { maxWidth, useEmoji } = this.options;
    const lines: string[] = [];
    const border = makeLine(BORDER_CHAR, maxWidth);
    const separator = makeLine(SEPARATOR_CHAR, maxWidth);

    // Header
    lines.push(border);
    const icon = useEmoji ? '📊 ' : '';
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    lines.push(centerText(`${icon}DAILY DIGEST — ${today}`, maxWidth));
    lines.push(border);
    lines.push('');

    // Summary statistics
    const grouped = groupUpdatesByType(updates);
    const highImpact = updates.filter((u) => u.impact === 'HIGH').length;

    lines.push('Summary:');
    lines.push(`   ${updates.length} activities logged`);
    if (highImpact > 0) {
      lines.push(`   ${highImpact} high-impact ${highImpact === 1 ? 'event' : 'events'}`);
    }
    lines.push('');

    // Grouped updates
    for (const [type, typeUpdates] of grouped) {
      const typeIcon = getUpdateIcon(type, useEmoji);
      const typeName = this.formatUpdateTypeName(type);
      lines.push(`${typeIcon} ${typeName} (${typeUpdates.length})`);

      // Show up to 3 updates per type in standard mode
      const limit = this.options.verbosity === 'detailed' ? typeUpdates.length : 3;
      const shown = typeUpdates.slice(0, limit);

      for (const update of shown) {
        const time = formatTime(update.timestamp);
        lines.push(`   • ${update.title} (${time})`);
        if (this.options.verbosity === 'detailed') {
          lines.push(...wrapText(update.description, maxWidth, 5));
        }
      }

      if (typeUpdates.length > limit) {
        lines.push(`   ... and ${typeUpdates.length - limit} more`);
      }
      lines.push('');
    }

    // Learning insight
    lines.push(separator);
    lines.push('');
    lines.push('What this means:');
    const insight = this.generateDigestInsight(updates);
    lines.push(...wrapText(insight, maxWidth, 3));
    lines.push('');

    // Next actions
    const nextActions = this.suggestNextActions(updates);
    if (nextActions.length > 0) {
      lines.push('Suggested next steps:');
      for (const action of nextActions) {
        lines.push(`   → ${action}`);
      }
    }

    lines.push(separator);

    return lines.join('\n');
  }

  /**
   * Formats a learning milestone celebration
   */
  formatLearningMilestone(milestone: LearningMilestoneInput): string {
    const validated = LearningMilestoneInputSchema.parse(milestone);
    const { maxWidth, useEmoji } = this.options;

    const lines: string[] = [];
    const border = makeLine(BORDER_CHAR, maxWidth);
    const separator = makeLine(SEPARATOR_CHAR, maxWidth);

    // Header with celebration
    lines.push(border);
    const icon = useEmoji ? '🏆 ' : '';
    const celebration = getCelebration(validated.type);
    lines.push(centerText(`${icon}MILESTONE: ${celebration}`, maxWidth));
    lines.push(border);
    lines.push('');

    // Achievement
    lines.push('Achievement:');
    lines.push(...wrapText(validated.achievement, maxWidth, 3));
    lines.push('');

    // Progress visualization if available
    if (validated.progress !== undefined) {
      const progressBar = renderProgress(validated.progress, 20);
      lines.push(`Progress: ${progressBar}`);
      lines.push('');
    }

    // Streak visualization if available
    if (validated.streak !== undefined) {
      const streakIcon = useEmoji ? '🔥' : '*';
      lines.push(`Streak: ${streakIcon} ${validated.streak} ${validated.streak === 1 ? 'day' : 'days'}`);
      lines.push('');
    }

    // Level if available
    if (validated.level !== undefined) {
      lines.push(`Level: ${validated.level}`);
      lines.push('');
    }

    // Educational note
    lines.push('The science:');
    const education = MILESTONE_EDUCATION[validated.type];
    lines.push(...wrapText(education, maxWidth, 3));
    lines.push('');

    // Next goal
    lines.push(separator);
    lines.push('');
    lines.push('Next goal:');
    lines.push(...wrapText(validated.nextGoal, maxWidth, 3));

    lines.push(separator);

    return lines.join('\n');
  }

  /**
   * Formats an insight discovery in an engaging way
   */
  formatInsightDiscovery(insight: InsightDiscoveryInput): string {
    const validated = InsightDiscoveryInputSchema.parse(insight);
    const { maxWidth, useEmoji } = this.options;

    const lines: string[] = [];
    const border = makeLine(BORDER_CHAR, maxWidth);
    const separator = makeLine(SEPARATOR_CHAR, maxWidth);

    // Header
    lines.push(border);
    const icon = useEmoji ? '💡 ' : '';
    lines.push(centerText(`${icon}INSIGHT DISCOVERED`, maxWidth));
    lines.push(border);
    lines.push('');

    // Topic
    lines.push(`Topic: ${validated.topic}`);
    lines.push('');

    // Explanation
    lines.push('What we learned:');
    lines.push(...wrapText(validated.explanation, maxWidth, 3));
    lines.push('');

    // Confidence if available
    if (validated.confidence !== undefined) {
      const confPercent = Math.round(validated.confidence * 100);
      const confBar = renderProgress(confPercent, 10);
      lines.push(`Confidence: ${confBar}`);
      lines.push('');
    }

    // Application
    lines.push(separator);
    lines.push('');
    lines.push('How to apply it:');
    lines.push(...wrapText(validated.application, maxWidth, 3));
    lines.push('');

    // Source if available
    if (validated.source) {
      lines.push(`Source: ${validated.source}`);
      lines.push('');
    }

    // Related topics if available
    if (validated.relatedTopics && validated.relatedTopics.length > 0) {
      lines.push('Related topics:');
      const topicsStr = validated.relatedTopics.join(', ');
      lines.push(...wrapText(topicsStr, maxWidth, 3));
    }

    lines.push(separator);

    return lines.join('\n');
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Gets educational content relevant to the skill
   */
  private getSkillEducation(skill: SkillAnnouncementInput): string {
    const desc = skill.description.toLowerCase();
    const name = skill.name.toLowerCase();

    // Match skill content to relevant educational nuggets
    if (desc.includes('practice') || name.includes('practice')) {
      return MILESTONE_EDUCATION.PRACTICE_COMPLETION;
    }
    if (desc.includes('bias') || desc.includes('cognitive')) {
      return MILESTONE_EDUCATION.BIAS_REDUCTION;
    }
    if (desc.includes('decision') || desc.includes('expected value')) {
      return "Expected value thinking is the foundation of rational decision-making. It combines probability and outcome to find the best choice (von Neumann & Morgenstern).";
    }
    if (desc.includes('bayesian') || desc.includes('belief')) {
      return 'Bayesian reasoning updates beliefs based on evidence. The key insight: how surprising the evidence is determines how much to update (Bayes, 1763).';
    }
    if (desc.includes('kelly') || desc.includes('position')) {
      return 'The Kelly Criterion maximizes long-term growth rate while managing risk of ruin. Most practitioners use half-Kelly for safety (Kelly, 1956).';
    }
    if (desc.includes('stoic') || desc.includes('control')) {
      return 'The Stoic dichotomy of control: focus energy only on what you can influence, accept what you cannot (Epictetus, ~125 AD).';
    }

    // Default educational content
    return 'New skills expand your cognitive toolkit. Like Munger says: "To the man with only a hammer, every problem looks like a nail."';
  }

  /**
   * Formats update type as human-readable name
   */
  private formatUpdateTypeName(type: UpdateType): string {
    const names: Record<UpdateType, string> = {
      SKILL_ADDED: 'Skills Added',
      INSIGHT_GENERATED: 'Insights Generated',
      DECISION_MADE: 'Decisions Made',
      LEARNING_COMPLETED: 'Learning Completed',
      MILESTONE_REACHED: 'Milestones Reached',
      ERROR_RECOVERED: 'Errors Recovered',
      PATTERN_DISCOVERED: 'Patterns Discovered',
      KNOWLEDGE_INTEGRATED: 'Knowledge Integrated',
    };
    return names[type];
  }

  /**
   * Generates an insight from the day's activities
   */
  private generateDigestInsight(updates: Update[]): string {
    const grouped = groupUpdatesByType(updates);

    // Analyze patterns
    const hasSkills = grouped.has('SKILL_ADDED');
    const hasInsights = grouped.has('INSIGHT_GENERATED');
    const hasDecisions = grouped.has('DECISION_MADE');
    const hasMilestones = grouped.has('MILESTONE_REACHED');

    if (hasMilestones && hasInsights) {
      return 'Your learning is translating into real progress. The combination of new insights and achieved milestones shows deep engagement with the material.';
    }

    if (hasSkills && hasDecisions) {
      return 'New skills are being put into practice immediately. This learn-by-doing approach accelerates mastery (Kolb Learning Cycle).';
    }

    if (hasInsights && updates.filter((u) => u.type === 'INSIGHT_GENERATED').length >= 3) {
      return "Multiple insights in one day suggests you're in a high-learning state. Consider capturing these while they're fresh.";
    }

    if (hasDecisions) {
      const decisions = grouped.get('DECISION_MADE') || [];
      const count = decisions.length;
      return `${count} ${count === 1 ? 'decision was' : 'decisions were'} supported by cognitive frameworks today. Each structured decision builds better thinking habits.`;
    }

    return 'Every interaction builds your cognitive capabilities. Consistency over intensity leads to lasting improvement.';
  }

  /**
   * Suggests next actions based on the day's activities
   */
  private suggestNextActions(updates: Update[]): string[] {
    const grouped = groupUpdatesByType(updates);
    const actions: string[] = [];

    // Suggest based on what happened
    if (grouped.has('INSIGHT_GENERATED')) {
      actions.push('Review today\'s insights before they fade');
    }

    if (grouped.has('SKILL_ADDED')) {
      actions.push('Try the new skill with a real problem');
    }

    if (grouped.has('DECISION_MADE')) {
      actions.push('Set a reminder to review decision outcomes');
    }

    if (!grouped.has('MILESTONE_REACHED')) {
      actions.push('Check your progress toward current goals');
    }

    // Always suggest at least one action
    if (actions.length === 0) {
      actions.push('Continue building momentum tomorrow');
    }

    return actions.slice(0, 3); // Max 3 suggestions
  }

  /**
   * Formats an empty digest when no updates occurred
   */
  private formatEmptyDigest(): string {
    const { maxWidth, useEmoji } = this.options;
    const lines: string[] = [];
    const border = makeLine(BORDER_CHAR, maxWidth);

    lines.push(border);
    const icon = useEmoji ? '📊 ' : '';
    lines.push(centerText(`${icon}DAILY DIGEST`, maxWidth));
    lines.push(border);
    lines.push('');
    lines.push('No activities logged today.');
    lines.push('');
    lines.push('This is fine. Rest is part of the process.');
    lines.push('');
    lines.push('Suggested:');
    lines.push('   → Run a quick practice session');
    lines.push('   → Review a past insight');
    lines.push('   → Explore a new framework');
    lines.push(makeLine(SEPARATOR_CHAR, maxWidth));

    return lines.join('\n');
  }
}

// =============================================================================
// STANDALONE FUNCTIONS
// =============================================================================

/**
 * Default formatter instance
 */
const defaultFormatter = new EngagementFormatter();

/**
 * Formats a skill announcement with educational context
 *
 * @param skill - Skill information including name, description, and utility examples
 * @param options - Optional formatting options
 * @returns Formatted skill announcement string
 *
 * @example
 * ```typescript
 * const output = formatSkillAnnouncement({
 *   name: '/ari-practice',
 *   description: 'Run deliberate practice sessions with real-time feedback',
 *   utility: [
 *     '/ari-practice kelly-criterion — Practice position sizing',
 *     '/ari-practice bayesian — Practice belief updates',
 *   ]
 * });
 * ```
 */
export function formatSkillAnnouncement(
  skill: SkillAnnouncementInput,
  options?: FormatterOptions
): string {
  const formatter = options ? new EngagementFormatter(options) : defaultFormatter;
  return formatter.formatSkillAnnouncement(skill);
}

/**
 * Formats a daily digest summarizing ARI's activities
 *
 * @param updates - Array of updates to include in the digest
 * @param options - Optional formatting options
 * @returns Formatted daily digest string
 *
 * @example
 * ```typescript
 * const output = formatDailyDigest([
 *   { type: 'INSIGHT_GENERATED', title: 'Pattern found', description: '...', timestamp: new Date() },
 *   { type: 'DECISION_MADE', title: 'Investment analysis', description: '...', timestamp: new Date() },
 * ]);
 * ```
 */
export function formatDailyDigest(updates: Update[], options?: FormatterOptions): string {
  const formatter = options ? new EngagementFormatter(options) : defaultFormatter;
  return formatter.formatDailyDigest(updates);
}

/**
 * Formats a learning milestone celebration
 *
 * @param milestone - Milestone information including type, achievement, and next goal
 * @param options - Optional formatting options
 * @returns Formatted milestone celebration string
 *
 * @example
 * ```typescript
 * const output = formatLearningMilestone({
 *   type: 'STREAK',
 *   achievement: '7 consecutive days of practice',
 *   nextGoal: 'Reach 14-day streak for silver badge',
 *   streak: 7,
 *   progress: 50
 * });
 * ```
 */
export function formatLearningMilestone(
  milestone: LearningMilestoneInput,
  options?: FormatterOptions
): string {
  const formatter = options ? new EngagementFormatter(options) : defaultFormatter;
  return formatter.formatLearningMilestone(milestone);
}

/**
 * Formats an insight discovery in an engaging way
 *
 * @param insight - Insight information including topic, explanation, and application
 * @param options - Optional formatting options
 * @returns Formatted insight discovery string
 *
 * @example
 * ```typescript
 * const output = formatInsightDiscovery({
 *   topic: 'Confirmation Bias Pattern',
 *   explanation: 'You tend to seek confirming evidence more often on Mondays',
 *   application: 'Add a devil\'s advocate step to Monday decisions',
 *   confidence: 0.85
 * });
 * ```
 */
export function formatInsightDiscovery(
  insight: InsightDiscoveryInput,
  options?: FormatterOptions
): string {
  const formatter = options ? new EngagementFormatter(options) : defaultFormatter;
  return formatter.formatInsightDiscovery(insight);
}
