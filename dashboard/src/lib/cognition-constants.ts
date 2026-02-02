/**
 * Cognition Constants for Dashboard
 *
 * Subset of constants from src/cognition/ux/constants.ts
 * optimized for React/Dashboard use.
 */

// =============================================================================
// PILLAR DEFINITIONS
// =============================================================================

export const PILLAR_CONFIG = {
  LOGOS: {
    name: 'Logos',
    description: 'Rational, logical, and analytical thinking',
    icon: '🧠',
  },
  ETHOS: {
    name: 'Ethos',
    description: 'Character & Discipline — value-based reasoning',
    icon: '❤️',
  },
  PATHOS: {
    name: 'Pathos',
    description: 'Growth & Wisdom — emotional and intuitive intelligence',
    icon: '🌱',
  },
  MULTI: {
    name: 'Multi-Pillar',
    description: 'Balanced integration of logical, ethical, and emotional reasoning',
    icon: '🌟',
  },
} as const;

// =============================================================================
// TRAFFIC LIGHT INDICATORS
// =============================================================================

export const TRAFFIC_LIGHT_CONFIG = {
  PROCEED: {
    emoji: '🟢',
    text: '[PROCEED]',
    ariaLabel: 'Proceed - High confidence',
    meaning: 'High confidence, proceed with action',
  },
  CAUTION: {
    emoji: '🟡',
    text: '[CAUTION]',
    ariaLabel: 'Caution - Medium confidence',
    meaning: 'Medium confidence, review recommended',
  },
  STOP: {
    emoji: '🔴',
    text: '[STOP]',
    ariaLabel: 'Stop - Low confidence',
    meaning: 'Low confidence, intervention required',
  },
} as const;

// =============================================================================
// SCORE THRESHOLDS
// =============================================================================

export const SCORE_THRESHOLDS = {
  /** Scores >= 7 are excellent (green) */
  EXCELLENT: 7,
  /** Scores >= 5 are good (yellow) */
  GOOD: 5,
  /** Scores < 5 are concerning (red) */
  MODERATE: 0,
} as const;

// =============================================================================
// ANIMATION DURATIONS
// =============================================================================

export const ANIMATION_DURATIONS = {
  fast: {
    normal: 150,
    reduced: 0,
  },
  standard: {
    normal: 300,
    reduced: 50,
  },
  slow: {
    normal: 500,
    reduced: 100,
  },
} as const;

// =============================================================================
// ICONS
// =============================================================================

export const ICONS = {
  status: {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  },
  pillars: {
    logos: '🧠',
    ethos: '❤️',
    pathos: '🌱',
    multi: '🌟',
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type PillarName = keyof typeof PILLAR_CONFIG;
export type TrafficLight = keyof typeof TRAFFIC_LIGHT_CONFIG;
