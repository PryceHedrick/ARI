/**
 * Recommendation Engine — Convert metrics to actionable DO/DON'T
 *
 * This is the decision layer that takes normalized metrics and produces
 * clear, unambiguous recommendations:
 *
 * - DO: Proceed with confidence
 * - CAUTION: Proceed with extra scrutiny
 * - DON'T: Do not proceed + alternatives
 *
 * Handles conflicting signals (e.g., positive EV but high emotional risk)
 * by applying safety-first logic.
 */

import type { NormalizedMetric, ActionType } from './normalizer.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Recommendation {
  /** Clear action directive */
  action: ActionType;
  /** Human-readable statement */
  statement: string;
  /** List of supporting reasons */
  reasons: string[];
  /** Alternative actions if DON'T */
  alternatives?: string[];
  /** Overall confidence in recommendation (0-10) */
  confidence: number;
  /** Metrics that were blockers */
  blockers: string[];
  /** Metrics that were supporters */
  supporters: string[];
}

export interface RecommendationInput {
  ev?: NormalizedMetric;
  kelly?: NormalizedMetric;
  confidence?: NormalizedMetric;
  biasRisk?: NormalizedMetric;
  emotionalRisk?: NormalizedMetric;
  discipline?: NormalizedMetric;
  virtue?: NormalizedMetric;
  control?: NormalizedMetric;
  [key: string]: NormalizedMetric | undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Thresholds for categorizing scores */
const THRESHOLDS = {
  EXCELLENT: 8,
  GOOD: 6,
  MODERATE: 4,
  CRITICAL: 2,
};

/** Metrics that can veto a positive recommendation (safety-first) */
const VETO_METRICS = ['biasRisk', 'emotionalRisk'];

/** Metrics that strongly support a positive recommendation */
const SUPPORT_METRICS = ['ev', 'kelly', 'confidence'];

/** Weights for different metric categories */
const WEIGHTS = {
  ev: 0.25,
  kelly: 0.15,
  confidence: 0.15,
  biasRisk: 0.15,
  emotionalRisk: 0.15,
  discipline: 0.05,
  virtue: 0.05,
  control: 0.05,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a comprehensive recommendation from multiple metrics
 */
export function generateRecommendation(input: RecommendationInput): Recommendation {
  const metrics = Object.entries(input).filter(([_, v]) => v !== undefined) as [string, NormalizedMetric][];

  if (metrics.length === 0) {
    return {
      action: 'CAUTION',
      statement: 'Insufficient data to make a recommendation',
      reasons: ['No metrics provided'],
      confidence: 0,
      blockers: [],
      supporters: [],
    };
  }

  // Identify blockers (low-scoring veto metrics)
  const blockers: string[] = [];
  for (const [key, metric] of metrics) {
    if (VETO_METRICS.includes(key) && metric.score <= THRESHOLDS.MODERATE) {
      blockers.push(metric.name);
    }
  }

  // Identify supporters (high-scoring support metrics)
  const supporters: string[] = [];
  for (const [key, metric] of metrics) {
    if (SUPPORT_METRICS.includes(key) && metric.score >= THRESHOLDS.GOOD) {
      supporters.push(metric.name);
    }
  }

  // Calculate weighted average score
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, metric] of metrics) {
    const weight = WEIGHTS[key as keyof typeof WEIGHTS] ?? 0.1;
    weightedSum += metric.score * weight;
    totalWeight += weight;
  }

  const avgScore = totalWeight > 0 ? weightedSum / totalWeight : 5;

  // Determine action
  let action: ActionType;
  let statement: string;

  // Safety-first: blockers override positive signals
  if (blockers.length > 0) {
    action = 'DONT';
    statement = `Do not proceed — ${blockers.join(' and ')} ${blockers.length > 1 ? 'are' : 'is'} concerning`;
  } else if (avgScore >= THRESHOLDS.GOOD) {
    action = 'DO';
    statement = `Proceed with confidence (Score: ${avgScore.toFixed(1)}/10)`;
  } else if (avgScore >= THRESHOLDS.MODERATE) {
    action = 'CAUTION';
    statement = `Proceed with extra scrutiny (Score: ${avgScore.toFixed(1)}/10)`;
  } else {
    action = 'DONT';
    statement = `Do not proceed — overall assessment is unfavorable (Score: ${avgScore.toFixed(1)}/10)`;
  }

  // Generate detailed reasons
  const reasons = generateReasons(metrics, action);

  // Generate alternatives if DON'T
  const alternatives = action === 'DONT' ? generateAlternatives(metrics, blockers) : undefined;

  return {
    action,
    statement,
    reasons,
    alternatives,
    confidence: avgScore,
    blockers,
    supporters,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate detailed reasons for the recommendation
 */
function generateReasons(metrics: [string, NormalizedMetric][], action: ActionType): string[] {
  const reasons: string[] = [];

  for (const [, metric] of metrics) {
    const emoji = metric.score >= THRESHOLDS.GOOD ? '✓' :
                  metric.score <= THRESHOLDS.MODERATE ? '✗' : '○';

    const scoreStr = `${metric.score.toFixed(1)}/10`;

    if (metric.score >= THRESHOLDS.EXCELLENT) {
      reasons.push(`${emoji} ${metric.name}: Excellent (${scoreStr})`);
    } else if (metric.score >= THRESHOLDS.GOOD) {
      reasons.push(`${emoji} ${metric.name}: Good (${scoreStr})`);
    } else if (metric.score >= THRESHOLDS.MODERATE) {
      reasons.push(`${emoji} ${metric.name}: Moderate (${scoreStr})`);
    } else if (metric.score >= THRESHOLDS.CRITICAL) {
      reasons.push(`${emoji} ${metric.name}: High Risk (${scoreStr})`);
    } else {
      reasons.push(`${emoji} ${metric.name}: Critical (${scoreStr})`);
    }
  }

  // Sort: negative reasons first for DON'T, positive first for DO
  if (action === 'DONT') {
    reasons.sort((a, b) => (a.startsWith('✗') ? -1 : 1) - (b.startsWith('✗') ? -1 : 1));
  } else if (action === 'DO') {
    reasons.sort((a, b) => (a.startsWith('✓') ? -1 : 1) - (b.startsWith('✓') ? -1 : 1));
  }

  return reasons;
}

/**
 * Generate alternative actions when recommendation is DON'T
 */
function generateAlternatives(metrics: [string, NormalizedMetric][], blockers: string[]): string[] {
  const alternatives: string[] = [];

  // Check each blocker and suggest specific alternatives
  for (const [key, metric] of metrics) {
    if (blockers.includes(metric.name)) {
      switch (key) {
        case 'biasRisk':
          alternatives.push('Challenge your assumptions — what evidence contradicts this view?');
          alternatives.push('Consider the opposite: what if you\'re completely wrong?');
          alternatives.push('Seek a dissenting opinion from someone you trust');
          break;

        case 'emotionalRisk':
          alternatives.push('Wait 24 hours and reassess with a calm mind');
          alternatives.push('Discuss with a trusted advisor before deciding');
          alternatives.push('Try physical exercise or meditation first');
          alternatives.push('Write down your reasoning — does it still make sense?');
          break;

        case 'discipline':
          alternatives.push('Review your pre-commitment rules');
          alternatives.push('Ask: would I approve this if a friend proposed it?');
          break;

        case 'virtue':
          alternatives.push('Reflect: how would your best self handle this?');
          alternatives.push('Consider the long-term character implications');
          break;

        case 'ev':
        case 'kelly':
          alternatives.push('Explore alternative approaches with better expected value');
          alternatives.push('Reduce position size or split into smaller parts');
          alternatives.push('Look for asymmetric risk/reward opportunities instead');
          break;

        case 'confidence':
          alternatives.push('Gather more information before deciding');
          alternatives.push('Identify what evidence would change your view');
          alternatives.push('Start with a smaller commitment to test your hypothesis');
          break;
      }
    }
  }

  // Deduplicate and limit
  const uniqueAlternatives = [...new Set(alternatives)];
  return uniqueAlternatives.slice(0, 5);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a decision-specific recommendation
 */
export function generateDecisionRecommendation(
  decision: string,
  input: RecommendationInput
): { decision: string; recommendation: Recommendation } {
  const recommendation = generateRecommendation(input);
  return { decision, recommendation };
}

/**
 * Compare multiple decisions and rank them
 */
export function rankDecisions(
  decisions: Array<{ decision: string; metrics: RecommendationInput }>
): Array<{ decision: string; recommendation: Recommendation; rank: number }> {
  const results = decisions.map(d => ({
    decision: d.decision,
    recommendation: generateRecommendation(d.metrics),
  }));

  // Sort by confidence descending
  results.sort((a, b) => b.recommendation.confidence - a.recommendation.confidence);

  // Add ranks
  return results.map((r, i) => ({ ...r, rank: i + 1 }));
}

/**
 * Generate a quick yes/no recommendation
 */
export function shouldProceed(input: RecommendationInput): {
  proceed: boolean;
  reason: string;
  score: number;
} {
  const rec = generateRecommendation(input);
  return {
    proceed: rec.action === 'DO' || rec.action === 'CAUTION',
    reason: rec.statement,
    score: rec.confidence,
  };
}

/**
 * Check if any metric is a hard blocker
 */
export function hasBlockers(input: RecommendationInput): {
  blocked: boolean;
  blockers: string[];
} {
  const rec = generateRecommendation(input);
  return {
    blocked: rec.blockers.length > 0,
    blockers: rec.blockers,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT-AWARE RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface DecisionContext {
  /** Time pressure (0=none, 1=extreme) */
  timePressure?: number;
  /** Reversibility (0=irreversible, 1=easily reversible) */
  reversibility?: number;
  /** Stakes (0=low, 1=life-changing) */
  stakes?: number;
  /** Historical success with similar decisions */
  historicalSuccess?: number;
}

/**
 * Generate a context-aware recommendation
 */
export function generateContextualRecommendation(
  input: RecommendationInput,
  context: DecisionContext
): Recommendation {
  const baseRec = generateRecommendation(input);

  // Adjust based on context
  let adjustedConfidence = baseRec.confidence;
  const additionalReasons: string[] = [];

  // High stakes require more confidence
  if (context.stakes !== undefined && context.stakes > 0.7) {
    if (baseRec.action === 'CAUTION' && baseRec.confidence < 7) {
      baseRec.action = 'DONT';
      baseRec.statement = 'Do not proceed — stakes are too high for current confidence level';
      additionalReasons.push('High-stakes decision requires higher confidence');
    }
  }

  // Time pressure may accept slightly lower confidence
  if (context.timePressure !== undefined && context.timePressure > 0.7) {
    additionalReasons.push('Time pressure noted — consider if delay is truly impossible');
  }

  // Reversibility allows more risk-taking
  if (context.reversibility !== undefined && context.reversibility > 0.7) {
    if (baseRec.action === 'CAUTION') {
      additionalReasons.push('Decision is reversible — lower risk of permanent harm');
    }
  }

  // Historical success provides confidence boost
  if (context.historicalSuccess !== undefined && context.historicalSuccess > 0.7) {
    adjustedConfidence = Math.min(10, adjustedConfidence * 1.1);
    additionalReasons.push('Historical success with similar decisions');
  }

  return {
    ...baseRec,
    confidence: adjustedConfidence,
    reasons: [...baseRec.reasons, ...additionalReasons],
  };
}
