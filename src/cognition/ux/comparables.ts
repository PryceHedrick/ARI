/**
 * Cognition UX — Comparables
 *
 * Human-friendly reference points so users can interpret a number by comparison.
 * "This is like..." makes any metric instantly understandable.
 */

export type ComparableCategory = 'excellent' | 'good' | 'moderate' | 'poor';

export interface ComparableReference {
  value: number;
  label: string;
  category: ComparableCategory;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGOS COMPARABLES
// ═══════════════════════════════════════════════════════════════════════════════

/** Expected Value comparables (decision EV in abstract units) */
export const EV_COMPARABLES: ComparableReference[] = [
  { value: 9, label: 'Starting a successful business', category: 'excellent' },
  { value: 6, label: 'Learning a high-value skill', category: 'excellent' },
  { value: 3, label: 'Optimizing a daily routine', category: 'good' },
  { value: 1, label: 'Reading a quality book', category: 'moderate' },
  { value: 0, label: 'Neutral / maintenance activity', category: 'moderate' },
  { value: -2, label: 'Procrastinating on important work', category: 'poor' },
  { value: -5, label: 'Staying in a clearly bad situation', category: 'poor' },
];

/** Kelly Criterion comparables (fraction of capital) */
export const KELLY_COMPARABLES: ComparableReference[] = [
  { value: 0.40, label: 'Full Kelly — Maximum growth, high volatility', category: 'excellent' },
  { value: 0.25, label: 'Half Kelly — Balanced growth and safety', category: 'excellent' },
  { value: 0.15, label: 'Quarter Kelly — Conservative position', category: 'good' },
  { value: 0.08, label: 'Eighth Kelly — Very cautious bet', category: 'moderate' },
  { value: 0.03, label: 'Minimal edge — Barely worth betting', category: 'moderate' },
  { value: 0.00, label: 'No edge — Gambling without advantage', category: 'poor' },
];

/** Confidence level comparables (probability 0-1) */
export const CONFIDENCE_COMPARABLES: ComparableReference[] = [
  { value: 0.95, label: 'Like tomorrow\'s sunrise — near certainty', category: 'excellent' },
  { value: 0.85, label: 'Like weather tomorrow — high confidence', category: 'excellent' },
  { value: 0.70, label: 'Like weather in 3 days — moderate uncertainty', category: 'good' },
  { value: 0.55, label: 'Like a coin flip with slight edge', category: 'moderate' },
  { value: 0.40, label: 'High uncertainty — many unknowns', category: 'moderate' },
  { value: 0.25, label: 'Very uncertain — close to guessing', category: 'poor' },
];

/** Antifragility comparables (-1 to 1 scale) */
export const ANTIFRAGILITY_COMPARABLES: ComparableReference[] = [
  { value: 0.8, label: 'Highly antifragile — gains from chaos like a hydra', category: 'excellent' },
  { value: 0.5, label: 'Antifragile — benefits from volatility', category: 'excellent' },
  { value: 0.2, label: 'Robust — withstands stress unchanged', category: 'good' },
  { value: 0.0, label: 'Neutral — neither helped nor hurt by stress', category: 'moderate' },
  { value: -0.3, label: 'Fragile — damaged by disorder', category: 'moderate' },
  { value: -0.7, label: 'Very fragile — breaks under stress like glass', category: 'poor' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ETHOS COMPARABLES
// ═══════════════════════════════════════════════════════════════════════════════

/** Cognitive Bias Risk comparables (0-1, higher is worse) */
export const BIAS_RISK_COMPARABLES: ComparableReference[] = [
  { value: 0.10, label: 'Clear thinking — minimal bias detected', category: 'excellent' },
  { value: 0.25, label: 'Slight coloring — minor bias present', category: 'good' },
  { value: 0.45, label: 'Like only reading news you agree with', category: 'moderate' },
  { value: 0.65, label: 'Like confirmation bias on social media', category: 'moderate' },
  { value: 0.80, label: 'Like believing conspiracy theories', category: 'poor' },
  { value: 0.95, label: 'Severely distorted thinking', category: 'poor' },
];

/** Emotional Risk comparables (0-1, higher is worse) */
export const EMOTIONAL_RISK_COMPARABLES: ComparableReference[] = [
  { value: 0.10, label: 'Calm and focused — optimal decision state', category: 'excellent' },
  { value: 0.25, label: 'Slightly elevated — functional but alert', category: 'good' },
  { value: 0.45, label: 'Like trading after a win streak — elevated', category: 'moderate' },
  { value: 0.65, label: 'Like arguing while angry — impaired judgment', category: 'moderate' },
  { value: 0.80, label: 'Like revenge trading after losses', category: 'poor' },
  { value: 0.95, label: 'Emotional hijack — do not decide now', category: 'poor' },
];

/** Discipline Score comparables (0-1) */
export const DISCIPLINE_COMPARABLES: ComparableReference[] = [
  { value: 0.95, label: 'Iron discipline — following all pre-commitments', category: 'excellent' },
  { value: 0.80, label: 'Strong discipline — minor deviations only', category: 'excellent' },
  { value: 0.60, label: 'Moderate discipline — some emotional influence', category: 'good' },
  { value: 0.40, label: 'Wavering — frequently breaking rules', category: 'moderate' },
  { value: 0.20, label: 'Poor discipline — acting on impulse', category: 'poor' },
  { value: 0.05, label: 'No discipline — pure emotional action', category: 'poor' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PATHOS COMPARABLES
// ═══════════════════════════════════════════════════════════════════════════════

/** Virtue Alignment comparables (0-1) */
export const VIRTUE_COMPARABLES: ComparableReference[] = [
  { value: 0.95, label: 'Fully aligned — decision honors all virtues', category: 'excellent' },
  { value: 0.80, label: 'Strong alignment — minor tensions only', category: 'excellent' },
  { value: 0.60, label: 'Moderate alignment — some virtue conflicts', category: 'good' },
  { value: 0.40, label: 'Weak alignment — multiple virtue tensions', category: 'moderate' },
  { value: 0.20, label: 'Misaligned — conflicts with core values', category: 'poor' },
  { value: 0.05, label: 'Severely misaligned — violates principles', category: 'poor' },
];

/** Control Ratio comparables (0-1, proportion controllable) */
export const CONTROL_COMPARABLES: ComparableReference[] = [
  { value: 0.90, label: 'Full control — all factors within your influence', category: 'excellent' },
  { value: 0.70, label: 'High control — most factors controllable', category: 'good' },
  { value: 0.50, label: 'Mixed — half controllable, half external', category: 'moderate' },
  { value: 0.30, label: 'Low control — mostly external factors', category: 'moderate' },
  { value: 0.10, label: 'Minimal control — fate-dependent outcome', category: 'poor' },
];

/** CBT Reframe Effectiveness comparables (0-1) */
export const REFRAME_COMPARABLES: ComparableReference[] = [
  { value: 0.90, label: 'Transformative — completely shifted perspective', category: 'excellent' },
  { value: 0.70, label: 'Very effective — significant cognitive shift', category: 'good' },
  { value: 0.50, label: 'Moderately effective — some perspective change', category: 'moderate' },
  { value: 0.30, label: 'Slightly effective — minor shift', category: 'moderate' },
  { value: 0.10, label: 'Ineffective — no meaningful change', category: 'poor' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNING COMPARABLES
// ═══════════════════════════════════════════════════════════════════════════════

/** Skill Level comparables (0-100) */
export const SKILL_LEVEL_COMPARABLES: ComparableReference[] = [
  { value: 95, label: 'Mastery — expert level proficiency', category: 'excellent' },
  { value: 80, label: 'Advanced — high competence', category: 'excellent' },
  { value: 60, label: 'Intermediate — solid foundation', category: 'good' },
  { value: 40, label: 'Beginner — learning fundamentals', category: 'moderate' },
  { value: 20, label: 'Novice — just starting out', category: 'moderate' },
  { value: 5, label: 'Awareness — know it exists', category: 'poor' },
];

/** Retrieval Rate comparables (0-1) */
export const RETRIEVAL_COMPARABLES: ComparableReference[] = [
  { value: 0.95, label: 'Excellent retention — nearly perfect recall', category: 'excellent' },
  { value: 0.80, label: 'Strong recall — most concepts retained', category: 'good' },
  { value: 0.60, label: 'Moderate retention — some forgetting', category: 'moderate' },
  { value: 0.40, label: 'Needs practice — significant gaps', category: 'moderate' },
  { value: 0.20, label: 'Poor retention — review urgently needed', category: 'poor' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LOOKUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** All comparables by metric type */
export const COMPARABLES_BY_METRIC: Record<string, ComparableReference[]> = {
  ev: EV_COMPARABLES,
  kelly: KELLY_COMPARABLES,
  confidence: CONFIDENCE_COMPARABLES,
  antifragility: ANTIFRAGILITY_COMPARABLES,
  biasRisk: BIAS_RISK_COMPARABLES,
  emotionalRisk: EMOTIONAL_RISK_COMPARABLES,
  discipline: DISCIPLINE_COMPARABLES,
  virtue: VIRTUE_COMPARABLES,
  control: CONTROL_COMPARABLES,
  reframe: REFRAME_COMPARABLES,
  skillLevel: SKILL_LEVEL_COMPARABLES,
  retrievalRate: RETRIEVAL_COMPARABLES,
};

export function nearestComparable(
  value: number,
  comparables: ComparableReference[]
): ComparableReference | undefined {
  if (comparables.length === 0) return undefined;
  let best = comparables[0];
  let bestDist = Math.abs(value - best.value);
  for (const c of comparables) {
    const dist = Math.abs(value - c.value);
    if (dist < bestDist) {
      best = c;
      bestDist = dist;
    }
  }
  return best;
}

export function comparablesAround(
  value: number,
  comparables: ComparableReference[]
): { similar?: ComparableReference; betterThan?: ComparableReference; worseThan?: ComparableReference } {
  const sorted = [...comparables].sort((a, b) => a.value - b.value);
  const similar = nearestComparable(value, sorted);
  const worseThan = [...sorted].reverse().find(c => c.value < value);
  const betterThan = sorted.find(c => c.value > value);
  return { similar, betterThan, worseThan };
}

/**
 * Get comparable for a specific metric type
 */
export function getComparableForMetric(
  metricType: string,
  value: number
): ComparableReference | undefined {
  const comparables = COMPARABLES_BY_METRIC[metricType];
  if (!comparables) return undefined;
  return nearestComparable(value, comparables);
}

/**
 * Get "This is like..." string for any metric
 */
export function getComparablePhrase(metricType: string, value: number): string {
  const comparable = getComparableForMetric(metricType, value);
  if (!comparable) return '';
  return `This is like: ${comparable.label}`;
}

