/**
 * ARI Time-Block Scheduling System
 *
 * Divides the 24-hour day into 5 operational blocks, each with different
 * model routing preferences, budget allocation weights, and task behaviors.
 *
 * Based on research:
 * - FrugalGPT cascade routing (Stanford 2023) — cheapest-first with quality gates
 * - RouteLLM (ICLR 2025) — routing as first-class architectural concern
 * - Provider-specific strengths: Google free tier for bulk, xAI for cheap reasoning
 *
 * Time blocks reflect Pryce's daily schedule:
 * - Overnight: ARI works autonomously using free/cheap models
 * - Morning: Deliver briefings and prepare for the day
 * - Active: Full support during working hours
 * - Family: Minimal operation, essential tasks only
 * - Wind-down: Evening reports and cognitive review
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIME BLOCK DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type TimeBlockId = 'overnight' | 'morning' | 'active' | 'family' | 'winddown';

export interface TimeBlock {
  id: TimeBlockId;
  name: string;
  startHour: number; // 0-23 (inclusive)
  endHour: number;   // 0-23 (exclusive, wraps at midnight)
  budgetWeight: number; // Percentage of daily budget (0.0–1.0, all blocks sum to 1.0)
  preferredChains: string[]; // Preferred cascade chain IDs (in priority order)
  maxChainTier: 'frugal' | 'balanced' | 'quality' | 'unrestricted';
  essentialOnly: boolean; // If true, only essential scheduled tasks run
  description: string;
}

/**
 * Model tier preferences per time block.
 * Maps block → ordered list of preferred model IDs for non-cascade routing.
 * CascadeRouter uses preferredChains instead; this is for direct model selection.
 */
export interface TimeBlockModelPreferences {
  preferred: string[];  // Models to prefer during this block
  avoid: string[];      // Models to avoid (too expensive for this block)
}

// ── Default Time Block Definitions ────────────────────────────────────

const TIME_BLOCKS: TimeBlock[] = [
  {
    id: 'overnight',
    name: 'Overnight Deep Work',
    startHour: 23,
    endHour: 5,
    budgetWeight: 0.15,
    preferredChains: ['bulk', 'frugal', 'creative'],
    maxChainTier: 'balanced',
    essentialOnly: false, // Overnight runs batch tasks, not user-facing
    description: 'Autonomous batch processing using free/cheap models (Google free tier, xAI fast)',
  },
  {
    id: 'morning',
    name: 'Morning Delivery',
    startHour: 6,
    endHour: 8,
    budgetWeight: 0.10,
    preferredChains: ['frugal', 'balanced', 'creative'],
    maxChainTier: 'balanced',
    essentialOnly: false,
    description: 'Deliver briefings, summaries, and prepare for the day',
  },
  {
    id: 'active',
    name: 'Active Support',
    startHour: 8,
    endHour: 17,
    budgetWeight: 0.40,
    preferredChains: ['frugal', 'code', 'reasoning', 'agentic', 'quality'],
    maxChainTier: 'unrestricted',
    essentialOnly: false,
    description: 'Full capability during work hours — all chains and models available',
  },
  {
    id: 'family',
    name: 'Family Time',
    startHour: 17,
    endHour: 21,
    budgetWeight: 0.15,
    preferredChains: ['bulk', 'frugal'],
    maxChainTier: 'frugal',
    essentialOnly: true, // Only essential tasks during family time
    description: 'Minimal operation — essential tasks only, cheapest models',
  },
  {
    id: 'winddown',
    name: 'Wind-Down',
    startHour: 21,
    endHour: 23,
    budgetWeight: 0.20,
    preferredChains: ['frugal', 'balanced', 'creative'],
    maxChainTier: 'balanced',
    essentialOnly: false,
    description: 'Evening reports, cognitive review, day-end processing',
  },
];

// ── Model Preferences per Block ────────────────────────────────────────

const BLOCK_MODEL_PREFERENCES: Record<TimeBlockId, TimeBlockModelPreferences> = {
  overnight: {
    preferred: [
      'gemini-2.5-flash-lite', // FREE tier — primary overnight model
      'gemini-2.5-flash',      // FREE tier — for higher quality needs
      'grok-4-fast',           // $0.20/M — cheapest non-free
      'grok-4.1-fast',         // $0.20/M — with reasoning if needed
    ],
    avoid: [
      'claude-opus-4.6',       // $5/M — too expensive for batch work
      'claude-opus-4.5',       // $5/M
      'claude-sonnet-4.5',     // $3/M
      'gpt-5.2',              // $1.75/M
      'o3',                    // $2/M
    ],
  },
  morning: {
    preferred: [
      'claude-haiku-4.5',     // Fast, good quality for briefings
      'gemini-2.5-flash',     // FREE tier backup
      'grok-4-fast',          // Cheap for simple tasks
    ],
    avoid: [
      'claude-opus-4.6',      // Save for active hours
      'claude-opus-4.5',
      'o3',
    ],
  },
  active: {
    preferred: [], // All models available — cascade router decides
    avoid: [],     // No restrictions during active hours
  },
  family: {
    preferred: [
      'gemini-2.5-flash-lite', // Cheapest possible
      'grok-4-fast',           // Fast and cheap
      'claude-haiku-3',        // Absolute minimum Claude
    ],
    avoid: [
      'claude-opus-4.6',
      'claude-opus-4.5',
      'claude-sonnet-4.5',
      'claude-sonnet-4',
      'gpt-5.2',
      'o3',
      'gemini-2.5-pro',
      'grok-4',
    ],
  },
  winddown: {
    preferred: [
      'claude-haiku-4.5',     // Good quality for reports
      'gemini-2.5-flash',     // FREE tier
      'grok-4-fast',          // Cheap fallback
    ],
    avoid: [
      'claude-opus-4.6',
      'claude-opus-4.5',
      'o3',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the current time block based on the current hour.
 *
 * @param now - Optional date for testing (defaults to current time)
 * @param timezone - IANA timezone string (defaults to America/Indiana/Indianapolis)
 * @returns The current TimeBlock
 */
export function getCurrentTimeBlock(
  now?: Date,
  timezone: string = 'America/Indiana/Indianapolis',
): TimeBlock {
  const hour = getHourInTimezone(now ?? new Date(), timezone);
  return getTimeBlockForHour(hour);
}

/**
 * Get the time block for a specific hour.
 *
 * @param hour - Hour of the day (0-23)
 * @returns The TimeBlock that contains this hour
 */
export function getTimeBlockForHour(hour: number): TimeBlock {
  for (const block of TIME_BLOCKS) {
    if (isHourInBlock(hour, block)) {
      return block;
    }
  }
  // Fallback to overnight (should not happen with complete blocks)
  return TIME_BLOCKS[0];
}

/**
 * Get model preferences for the current time block.
 */
export function getCurrentModelPreferences(
  now?: Date,
  timezone?: string,
): TimeBlockModelPreferences {
  const block = getCurrentTimeBlock(now, timezone);
  return getModelPreferencesForBlock(block.id);
}

/**
 * Get model preferences for a specific block.
 */
export function getModelPreferencesForBlock(
  blockId: TimeBlockId,
): TimeBlockModelPreferences {
  return BLOCK_MODEL_PREFERENCES[blockId];
}

/**
 * Check if a cascade chain is allowed during the current time block.
 *
 * Chain tier hierarchy: frugal < balanced < quality < unrestricted
 * Each block has a maxChainTier — chains above that tier are blocked.
 */
export function isChainAllowedInBlock(
  chainId: string,
  block: TimeBlock,
): boolean {
  const chainTierMap: Record<string, number> = {
    bulk: 0,
    frugal: 0,
    creative: 1,
    agentic: 1,
    code: 1,
    long_context: 1,
    'long-context': 1,
    balanced: 2,
    reasoning: 2,
    quality: 3,
    security: 4, // Security always allowed (never compromised)
  };

  const maxTierMap: Record<string, number> = {
    frugal: 0,
    balanced: 2,
    quality: 3,
    unrestricted: 4,
  };

  const chainTier = chainTierMap[chainId] ?? 1;
  const maxTier = maxTierMap[block.maxChainTier] ?? 4;

  // Security chain always allowed regardless of block restrictions
  if (chainId === 'security') return true;

  return chainTier <= maxTier;
}

/**
 * Check if a model should be avoided in the current time block.
 */
export function shouldAvoidModel(
  modelId: string,
  now?: Date,
  timezone?: string,
): boolean {
  const prefs = getCurrentModelPreferences(now, timezone);
  return prefs.avoid.includes(modelId);
}

/**
 * Get the recommended chain downgrade for a given chain when it's not
 * allowed in the current time block.
 *
 * Returns the original chain if allowed, or the best alternative.
 */
export function getBlockAdjustedChain(
  requestedChain: string,
  block: TimeBlock,
): string {
  if (isChainAllowedInBlock(requestedChain, block)) {
    return requestedChain;
  }

  // Downgrade map: what to use when the requested chain is too expensive
  const downgrades: Record<string, string> = {
    quality: 'balanced',
    reasoning: 'code',
    balanced: 'frugal',
    code: 'frugal',
    agentic: 'frugal',
    creative: 'frugal',
    'long-context': 'frugal',
  };

  const downgraded = downgrades[requestedChain];
  if (downgraded && isChainAllowedInBlock(downgraded, block)) {
    return downgraded;
  }

  // Final fallback
  return 'frugal';
}

/**
 * Get the daily budget allocation for a specific time block.
 *
 * @param dailyBudgetDollars - Total daily budget in dollars
 * @param blockId - The time block to get allocation for
 * @returns Budget in dollars allocated to this block
 */
export function getBlockBudgetAllocation(
  dailyBudgetDollars: number,
  blockId: TimeBlockId,
): number {
  const block = TIME_BLOCKS.find(b => b.id === blockId);
  if (!block) return 0;
  return dailyBudgetDollars * block.budgetWeight;
}

/**
 * Get all time blocks (for display, configuration, etc.).
 */
export function getAllTimeBlocks(): TimeBlock[] {
  return [...TIME_BLOCKS];
}

/**
 * Get a summary of the current time block suitable for logging/display.
 */
export function getTimeBlockSummary(
  now?: Date,
  timezone?: string,
): {
  block: TimeBlockId;
  name: string;
  essentialOnly: boolean;
  maxChainTier: string;
  budgetWeight: number;
  preferredChains: string[];
  preferredModels: string[];
  avoidModels: string[];
} {
  const block = getCurrentTimeBlock(now, timezone);
  const prefs = getModelPreferencesForBlock(block.id);

  return {
    block: block.id,
    name: block.name,
    essentialOnly: block.essentialOnly,
    maxChainTier: block.maxChainTier,
    budgetWeight: block.budgetWeight,
    preferredChains: block.preferredChains,
    preferredModels: prefs.preferred,
    avoidModels: prefs.avoid,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if an hour falls within a time block.
 * Handles midnight wrapping (e.g., overnight: 23→5 means 23,0,1,2,3,4).
 */
function isHourInBlock(hour: number, block: TimeBlock): boolean {
  if (block.startHour <= block.endHour) {
    // Normal range (e.g., 8-17)
    return hour >= block.startHour && hour < block.endHour;
  } else {
    // Wraps midnight (e.g., 23-5 means 23,0,1,2,3,4)
    return hour >= block.startHour || hour < block.endHour;
  }
}

/**
 * Get the current hour in a specific timezone.
 * Uses Intl.DateTimeFormat for timezone-aware hour extraction.
 */
function getHourInTimezone(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  });

  const parts = formatter.formatToParts(date);
  const hourPart = parts.find(p => p.type === 'hour');
  return parseInt(hourPart?.value ?? '0', 10);
}

/**
 * Get the number of hours in a block (for budget calculations).
 */
export function getBlockDurationHours(blockId: TimeBlockId): number {
  const block = TIME_BLOCKS.find(b => b.id === blockId);
  if (!block) return 0;

  if (block.startHour <= block.endHour) {
    return block.endHour - block.startHour;
  } else {
    // Wraps midnight
    return (24 - block.startHour) + block.endHour;
  }
}

/**
 * Get the next block transition time from a given date.
 * Useful for scheduling wake-up timers.
 */
export function getNextBlockTransition(
  now?: Date,
  timezone?: string,
): { nextBlock: TimeBlockId; transitionAt: Date; hoursUntil: number } {
  const date = now ?? new Date();
  const tz = timezone ?? 'America/Indiana/Indianapolis';
  const currentHour = getHourInTimezone(date, tz);
  const currentBlock = getTimeBlockForHour(currentHour);

  // Find which block comes next
  const blockOrder: TimeBlockId[] = ['overnight', 'morning', 'active', 'family', 'winddown'];
  const currentIndex = blockOrder.indexOf(currentBlock.id);
  const nextIndex = (currentIndex + 1) % blockOrder.length;
  const nextBlockId = blockOrder[nextIndex];
  const nextBlock = TIME_BLOCKS.find(b => b.id === nextBlockId)!;

  // Calculate hours until next block starts
  let hoursUntil = nextBlock.startHour - currentHour;
  if (hoursUntil <= 0) hoursUntil += 24;

  // Create the transition Date
  const transitionAt = new Date(date);
  transitionAt.setHours(transitionAt.getHours() + hoursUntil);
  transitionAt.setMinutes(0, 0, 0);

  return { nextBlock: nextBlockId, transitionAt, hoursUntil };
}
