/**
 * Universal Normalizer — Convert any cognitive metric to 0-10 scale
 *
 * Makes every cognitive output instantly understandable with:
 * - 0-10 universal scores
 * - Category labels (CRITICAL → EXCELLENT)
 * - Traffic light indicators (STOP → PROCEED)
 * - Clear recommendations
 * - Contextual comparables
 */

export type ScoreCategory = 'CRITICAL' | 'HIGH_RISK' | 'MODERATE' | 'GOOD' | 'EXCELLENT';
export type NormalizerTrafficLight = 'STOP' | 'CAUTION' | 'PROCEED';
export type ActionType = 'DO' | 'DONT' | 'CAUTION';

export interface NormalizedMetric {
  /** Original metric name */
  name: string;
  /** 0-10 universal score */
  score: number;
  /** Semantic category */
  category: ScoreCategory;
  /** Traffic light indicator */
  trafficLight: NormalizerTrafficLight;
  /** Clear recommendation */
  recommendation: {
    action: ActionType;
    statement: string;
  };
  /** Why this score */
  reason: string;
  /** "This is like..." contextual comparison */
  comparable: string;
  /** Visual gauge rendering */
  visual: string;
  /** Original value for reference */
  originalValue: number;
  /** Scale information */
  scale: { min: number; max: number; unit?: string };
}

/**
 * Normalization rules for each metric type
 */
export interface NormalizationRules {
  metric: string;
  inputRange: { min: number; max: number };
  /** If true, higher input values = lower (worse) scores */
  invert?: boolean;
  unit?: string;
  comparables: Array<{
    score: number;
    label: string;
    category: 'excellent' | 'good' | 'moderate' | 'poor';
  }>;
}

/**
 * Predefined normalization rules for all cognitive metrics
 */
const NORMALIZATION_RULES: Record<string, NormalizationRules> = {
  // LOGOS: Expected Value (dollar/unit amount)
  ev: {
    metric: 'Expected Value',
    inputRange: { min: -100, max: 100 },
    comparables: [
      { score: 10, label: 'Starting a successful business', category: 'excellent' },
      { score: 8, label: 'Learning a high-value skill', category: 'excellent' },
      { score: 6, label: 'Optimizing your daily routine', category: 'good' },
      { score: 4, label: 'Reading a quality book', category: 'moderate' },
      { score: 2, label: 'Break-even activity', category: 'moderate' },
      { score: 0, label: 'Procrastinating on important work', category: 'poor' },
    ],
  },

  // LOGOS: Kelly Fraction (0-1)
  kelly: {
    metric: 'Kelly Fraction',
    inputRange: { min: 0, max: 0.5 },
    unit: '%',
    comparables: [
      { score: 10, label: 'Full Kelly (40%+) — Maximum growth bet', category: 'excellent' },
      { score: 8, label: 'Half Kelly (20-25%) — Large but managed position', category: 'excellent' },
      { score: 6, label: 'Quarter Kelly (10-15%) — Moderate position', category: 'good' },
      { score: 4, label: 'Eighth Kelly (5-7%) — Cautious bet', category: 'moderate' },
      { score: 2, label: 'Minimal edge (<5%) — Barely worth betting', category: 'moderate' },
      { score: 0, label: 'No edge — Gambling without advantage', category: 'poor' },
    ],
  },

  // LOGOS: Confidence (0-1)
  confidence: {
    metric: 'Confidence',
    inputRange: { min: 0, max: 1 },
    unit: '%',
    comparables: [
      { score: 10, label: '95%+ confidence — Like tomorrow\'s sunrise', category: 'excellent' },
      { score: 8, label: '80-90% confidence — Like weather tomorrow', category: 'good' },
      { score: 6, label: '60-75% confidence — Like weather in 3 days', category: 'moderate' },
      { score: 4, label: '40-55% confidence — Slight edge over coin flip', category: 'moderate' },
      { score: 2, label: '<40% confidence — High uncertainty', category: 'poor' },
    ],
  },

  // LOGOS: Bayesian Posterior Probability (0-1)
  posterior: {
    metric: 'Posterior Probability',
    inputRange: { min: 0, max: 1 },
    unit: '%',
    comparables: [
      { score: 10, label: '90%+ — Near certainty after evidence', category: 'excellent' },
      { score: 8, label: '75-90% — Strong evidence in favor', category: 'good' },
      { score: 6, label: '50-75% — Moderate evidence shift', category: 'moderate' },
      { score: 4, label: '25-50% — Weak evidence or neutral', category: 'moderate' },
      { score: 2, label: '<25% — Evidence against hypothesis', category: 'poor' },
    ],
  },

  // LOGOS: Antifragility Score (-1 to 1)
  antifragility: {
    metric: 'Antifragility',
    inputRange: { min: -1, max: 1 },
    comparables: [
      { score: 10, label: 'Highly antifragile — Gains from chaos', category: 'excellent' },
      { score: 8, label: 'Antifragile — Benefits from volatility', category: 'excellent' },
      { score: 6, label: 'Robust — Withstands stress unchanged', category: 'good' },
      { score: 4, label: 'Slightly fragile — Minor vulnerability', category: 'moderate' },
      { score: 2, label: 'Fragile — Damaged by disorder', category: 'poor' },
      { score: 0, label: 'Very fragile — Breaks under stress', category: 'poor' },
    ],
  },

  // ETHOS: Bias Risk (0-1, inverted — higher is worse)
  biasRisk: {
    metric: 'Bias Risk',
    inputRange: { min: 0, max: 1 },
    invert: true,
    comparables: [
      { score: 10, label: 'No bias detected — Clear thinking', category: 'excellent' },
      { score: 8, label: 'Minimal bias — Slightly colored view', category: 'good' },
      { score: 6, label: 'Moderate bias — Like reading only agreeable news', category: 'moderate' },
      { score: 4, label: 'High bias — Like confirmation bias on social media', category: 'moderate' },
      { score: 2, label: 'Severe bias — Like believing conspiracy theories', category: 'poor' },
    ],
  },

  // ETHOS: Emotional Risk (0-1, inverted — higher is worse)
  emotionalRisk: {
    metric: 'Emotional Risk',
    inputRange: { min: 0, max: 1 },
    invert: true,
    comparables: [
      { score: 10, label: 'Optimal state — Calm and focused', category: 'excellent' },
      { score: 8, label: 'Minor arousal — Slightly elevated but functional', category: 'good' },
      { score: 6, label: 'Moderate risk — Like trading after a win streak', category: 'moderate' },
      { score: 4, label: 'High risk — Like arguing while angry', category: 'moderate' },
      { score: 2, label: 'Critical risk — Like revenge trading after losses', category: 'poor' },
    ],
  },

  // ETHOS: Discipline Score (0-1)
  discipline: {
    metric: 'Discipline',
    inputRange: { min: 0, max: 1 },
    comparables: [
      { score: 10, label: 'Excellent discipline — Following all pre-commitments', category: 'excellent' },
      { score: 8, label: 'Good discipline — Minor deviations only', category: 'good' },
      { score: 6, label: 'Moderate discipline — Some emotional influence', category: 'moderate' },
      { score: 4, label: 'Poor discipline — Frequently breaking rules', category: 'moderate' },
      { score: 2, label: 'No discipline — Acting on pure emotion', category: 'poor' },
    ],
  },

  // PATHOS: Virtue Alignment (0-1)
  virtue: {
    metric: 'Virtue Alignment',
    inputRange: { min: 0, max: 1 },
    comparables: [
      { score: 10, label: 'Fully aligned — Decision honors all virtues', category: 'excellent' },
      { score: 8, label: 'Strong alignment — Minor virtue tensions', category: 'good' },
      { score: 6, label: 'Moderate alignment — Some virtue conflicts', category: 'moderate' },
      { score: 4, label: 'Weak alignment — Multiple virtue violations', category: 'moderate' },
      { score: 2, label: 'Misaligned — Decision conflicts with core values', category: 'poor' },
    ],
  },

  // PATHOS: CBT Reframe Effectiveness (0-1)
  reframe: {
    metric: 'Reframe Effectiveness',
    inputRange: { min: 0, max: 1 },
    comparables: [
      { score: 10, label: 'Transformative — Completely shifted perspective', category: 'excellent' },
      { score: 8, label: 'Very effective — Significant cognitive shift', category: 'good' },
      { score: 6, label: 'Moderately effective — Some perspective change', category: 'moderate' },
      { score: 4, label: 'Slightly effective — Minor shift', category: 'moderate' },
      { score: 2, label: 'Ineffective — No meaningful change', category: 'poor' },
    ],
  },

  // PATHOS: Control Ratio (proportion controllable)
  control: {
    metric: 'Control Ratio',
    inputRange: { min: 0, max: 1 },
    comparables: [
      { score: 10, label: 'Full control — Everything is within your influence', category: 'excellent' },
      { score: 8, label: 'High control — Most factors controllable', category: 'good' },
      { score: 6, label: 'Moderate control — Mix of controllable/uncontrollable', category: 'moderate' },
      { score: 4, label: 'Low control — Many external factors', category: 'moderate' },
      { score: 2, label: 'Minimal control — Mostly external forces', category: 'poor' },
    ],
  },

  // Learning: Skill Proficiency (0-100)
  skillLevel: {
    metric: 'Skill Level',
    inputRange: { min: 0, max: 100 },
    comparables: [
      { score: 10, label: 'Mastery — Expert level proficiency', category: 'excellent' },
      { score: 8, label: 'Advanced — High competence', category: 'good' },
      { score: 6, label: 'Intermediate — Solid foundation', category: 'moderate' },
      { score: 4, label: 'Beginner — Learning fundamentals', category: 'moderate' },
      { score: 2, label: 'Novice — Just starting out', category: 'poor' },
    ],
  },

  // Learning: Retrieval Rate (0-1)
  retrievalRate: {
    metric: 'Retrieval Rate',
    inputRange: { min: 0, max: 1 },
    unit: '%',
    comparables: [
      { score: 10, label: '90%+ — Excellent retention', category: 'excellent' },
      { score: 8, label: '75-90% — Strong recall', category: 'good' },
      { score: 6, label: '50-75% — Moderate retention', category: 'moderate' },
      { score: 4, label: '30-50% — Needs more practice', category: 'moderate' },
      { score: 2, label: '<30% — Poor retention', category: 'poor' },
    ],
  },
};

/**
 * Clamp a number to a range
 */
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Categorize a 0-10 score
 */
function categorizeScore(score: number): ScoreCategory {
  if (score <= 2) return 'CRITICAL';
  if (score <= 4) return 'HIGH_RISK';
  if (score <= 6) return 'MODERATE';
  if (score <= 8) return 'GOOD';
  return 'EXCELLENT';
}

/**
 * Get traffic light for score
 */
function getTrafficLight(score: number): NormalizerTrafficLight {
  if (score <= 4) return 'STOP';
  if (score <= 6) return 'CAUTION';
  return 'PROCEED';
}

/**
 * Generate action recommendation
 */
function generateRecommendation(score: number, category: ScoreCategory, metricName: string): { action: ActionType; statement: string } {
  if (score >= 7) {
    return {
      action: 'DO',
      statement: `Proceed — ${metricName} is favorable (${score.toFixed(1)}/10)`,
    };
  }
  if (score >= 5) {
    return {
      action: 'CAUTION',
      statement: `Proceed with caution — ${metricName} is moderate (${score.toFixed(1)}/10)`,
    };
  }
  return {
    action: 'DONT',
    statement: `Do not proceed — ${metricName} is concerning (${score.toFixed(1)}/10)`,
  };
}

/**
 * Generate reason based on score
 */
function generateReason(score: number, category: ScoreCategory, rules: NormalizationRules): string {
  const categoryDescriptions: Record<ScoreCategory, string> = {
    CRITICAL: 'Critically low',
    HIGH_RISK: 'High risk level',
    MODERATE: 'Moderate level',
    GOOD: 'Good level',
    EXCELLENT: 'Excellent level',
  };

  return `${categoryDescriptions[category]} for ${rules.metric}. Score: ${score.toFixed(1)}/10`;
}

/**
 * Find nearest comparable for the score
 */
function findComparable(score: number, comparables: NormalizationRules['comparables']): string {
  if (comparables.length === 0) return '';

  // Find the closest comparable by score
  let closest = comparables[0];
  let minDist = Math.abs(score - closest.score);

  for (const c of comparables) {
    const dist = Math.abs(score - c.score);
    if (dist < minDist) {
      closest = c;
      minDist = dist;
    }
  }

  return closest.label;
}

/**
 * Render a visual gauge
 */
export function renderGauge(score: number, opts?: { width?: number; showLabel?: boolean }): string {
  const width = opts?.width ?? 20;
  const clampedScore = clamp(score, 0, 10);
  const position = Math.round((clampedScore / 10) * width);

  // Build the gauge: ◯━━━━━━━━━━◉━━━━━━━━━◯
  const filled = '━'.repeat(position);
  const marker = '◉';
  const empty = '━'.repeat(width - position);

  const gauge = `◯${filled}${marker}${empty}◯`;

  // Add emoji based on score
  const emoji = clampedScore >= 7 ? '🟢' : clampedScore >= 5 ? '🟡' : '🔴';

  if (opts?.showLabel !== false) {
    return `${emoji} ${gauge} ${clampedScore.toFixed(1)}/10`;
  }
  return gauge;
}

/**
 * Render a mini gauge (compact)
 */
export function renderMiniGauge(score: number): string {
  const clampedScore = clamp(score, 0, 10);
  const filled = Math.round(clampedScore);
  const empty = 10 - filled;

  const emoji = clampedScore >= 7 ? '🟢' : clampedScore >= 5 ? '🟡' : '🔴';
  return `${emoji} ${'█'.repeat(filled)}${'░'.repeat(empty)} ${clampedScore.toFixed(0)}/10`;
}

/**
 * Normalize a value to 0-10 scale
 */
export function normalize(value: number, metricType: string): NormalizedMetric {
  const rules = NORMALIZATION_RULES[metricType];
  if (!rules) {
    throw new Error(`Unknown metric type: ${metricType}. Available: ${Object.keys(NORMALIZATION_RULES).join(', ')}`);
  }

  const { min, max } = rules.inputRange;

  // Clamp to valid range
  const clamped = clamp(value, min, max);

  // Normalize to 0-10
  let score = ((clamped - min) / (max - min)) * 10;

  // Invert if needed (for risk metrics where higher = worse)
  if (rules.invert) {
    score = 10 - score;
  }

  score = clamp(score, 0, 10);

  const category = categorizeScore(score);
  const trafficLight = getTrafficLight(score);
  const recommendation = generateRecommendation(score, category, rules.metric);
  const reason = generateReason(score, category, rules);
  const comparable = findComparable(score, rules.comparables);
  const visual = renderGauge(score);

  return {
    name: rules.metric,
    score,
    category,
    trafficLight,
    recommendation,
    reason,
    comparable,
    visual,
    originalValue: value,
    scale: { min, max, unit: rules.unit },
  };
}

/**
 * Normalize multiple metrics at once
 */
export function normalizeMultiple(metrics: Array<{ value: number; type: string }>): NormalizedMetric[] {
  return metrics.map(m => normalize(m.value, m.type));
}

/**
 * Get available metric types
 */
export function getAvailableMetricTypes(): string[] {
  return Object.keys(NORMALIZATION_RULES);
}

/**
 * Check if a metric type is valid
 */
export function isValidMetricType(type: string): boolean {
  return type in NORMALIZATION_RULES;
}

/**
 * Get normalization rules for a metric type
 */
export function getNormalizationRules(type: string): NormalizationRules | undefined {
  return NORMALIZATION_RULES[type];
}
