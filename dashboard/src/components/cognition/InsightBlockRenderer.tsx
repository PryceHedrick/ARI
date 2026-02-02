/**
 * InsightBlockRenderer — React component for cognitive insights
 *
 * Renders normalized metrics with:
 * - Visual gauges (0-10 scale)
 * - Pillar color coding (LOGOS blue, ETHOS orange, PATHOS green)
 * - Traffic light indicators (STOP/CAUTION/PROCEED)
 * - Contextual comparables ("This is like...")
 * - DO/DON'T/CAUTION recommendations
 * - Full accessibility support (WCAG 2.1 AA)
 * - Detail levels (minimal, standard, full)
 */

import { useMemo, useEffect, useState } from 'react';
import {
  PILLAR_CONFIG as PILLAR_CONFIG_CONST,
  TRAFFIC_LIGHT_CONFIG,
  SCORE_THRESHOLDS,
  ICONS,
} from '../../lib/cognition-constants.js';

// =============================================================================
// TYPES
// =============================================================================

export type Pillar = 'LOGOS' | 'ETHOS' | 'PATHOS' | 'MULTI';
export type ScoreCategory = 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'HIGH_RISK' | 'CRITICAL';
export type TrafficLight = 'PROCEED' | 'CAUTION' | 'STOP';
export type ActionType = 'DO' | 'DONT' | 'CAUTION';
export type DetailLevel = 'minimal' | 'standard' | 'full';

export interface NormalizedMetric {
  name: string;
  score: number;
  category: ScoreCategory;
  trafficLight: TrafficLight;
  comparable?: string;
  recommendation: {
    action: ActionType;
    statement: string;
  };
}

export interface InsightBlockProps {
  title: string;
  pillar: Pillar;
  metrics: NormalizedMetric[];
  recommendation?: {
    action: ActionType;
    statement: string;
    reasons: string[];
    alternatives?: string[];
    overallScore: number;
  };
  detail?: DetailLevel;
  className?: string;
}

// =============================================================================
// ACCESSIBILITY HOOKS
// =============================================================================

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// =============================================================================
// PILLAR CONFIGURATION WITH EXPLICIT CLASSES
// =============================================================================

const PILLAR_CONFIG = {
  LOGOS: {
    icon: ICONS.pillars.logos,
    name: PILLAR_CONFIG_CONST.LOGOS.name,
    colorVar: 'var(--pillar-logos)',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-400',
    hoverBorderClass: 'hover:border-blue-500/50',
  },
  ETHOS: {
    icon: ICONS.pillars.ethos,
    name: PILLAR_CONFIG_CONST.ETHOS.name,
    colorVar: 'var(--pillar-ethos)',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-400',
    hoverBorderClass: 'hover:border-orange-500/50',
  },
  PATHOS: {
    icon: ICONS.pillars.pathos,
    name: PILLAR_CONFIG_CONST.PATHOS.name,
    colorVar: 'var(--pillar-pathos)',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    textClass: 'text-green-400',
    hoverBorderClass: 'hover:border-green-500/50',
  },
  MULTI: {
    icon: ICONS.pillars.multi,
    name: PILLAR_CONFIG_CONST.MULTI.name,
    colorVar: 'var(--ari-purple)',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
    textClass: 'text-purple-400',
    hoverBorderClass: 'hover:border-purple-500/50',
  },
};

// Action badge configuration (not in constants, specific to this component)
const ACTION_CONFIG = {
  DO: {
    label: 'PROCEED',
    emoji: ICONS.status.success,
    ariaLabel: 'Success: proceed with action',
  },
  DONT: {
    label: 'DO NOT PROCEED',
    emoji: ICONS.status.error,
    ariaLabel: 'Error: do not proceed',
  },
  CAUTION: {
    label: 'PROCEED WITH CAUTION',
    emoji: ICONS.status.warning,
    ariaLabel: 'Warning: proceed with caution',
  },
};

// Score-based color mapping (explicit classes for JIT)
const SCORE_COLOR_MAPS = {
  text: {
    excellent: 'text-green-400',
    good: 'text-yellow-400',
    moderate: 'text-red-400',
  },
  bg: {
    excellent: 'bg-green-500',
    good: 'bg-yellow-500',
    moderate: 'bg-red-500',
  },
};

// Traffic light color mapping
const TRAFFIC_LIGHT_COLOR_MAP = {
  PROCEED: 'text-green-400',
  CAUTION: 'text-yellow-400',
  STOP: 'text-red-400',
};

// Action badge color mapping
const ACTION_COLOR_MAP = {
  DO: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/40',
    text: 'text-green-300',
  },
  DONT: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    text: 'text-red-300',
  },
  CAUTION: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/40',
    text: 'text-yellow-300',
  },
};

// Recommendation box color mapping
const RECOMMENDATION_BG_MAP = {
  DO: 'bg-green-500/10 border-green-500/30',
  DONT: 'bg-red-500/10 border-red-500/30',
  CAUTION: 'bg-yellow-500/10 border-yellow-500/30',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getScoreColorCategory(score: number): 'excellent' | 'good' | 'moderate' {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'excellent';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'good';
  return 'moderate';
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface GaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function Gauge({ score, size = 'md', showLabel = true }: GaugeProps) {
  const percentage = (score / 10) * 100;
  const category = getScoreColorCategory(score);
  const colorClass = SCORE_COLOR_MAPS.text[category];
  const bgColorClass = SCORE_COLOR_MAPS.bg[category];
  const prefersReducedMotion = usePrefersReducedMotion();

  const widths = { sm: 'w-24', md: 'w-32', lg: 'w-48' };
  const heights = { sm: 'h-2', md: 'h-3', lg: 'h-4' };

  const transitionClass = prefersReducedMotion
    ? ''
    : 'transition-all duration-500';

  return (
    <div className={`flex items-center gap-2 ${widths[size]}`}>
      <div
        className={`flex-1 ${heights[size]} bg-slate-700 rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-label={`Score: ${score.toFixed(1)} out of 10`}
      >
        <div
          className={`${heights[size]} ${bgColorClass} rounded-full ${transitionClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-sm font-mono ${colorClass}`} aria-hidden="true">
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface TrafficLightIndicatorProps {
  light: TrafficLight;
  size?: 'sm' | 'md';
}

export function TrafficLightIndicator({ light, size = 'md' }: TrafficLightIndicatorProps) {
  const config = TRAFFIC_LIGHT_CONFIG[light];
  const colorClass = TRAFFIC_LIGHT_COLOR_MAP[light];
  const label = light === 'PROCEED' ? 'Proceed' : light === 'CAUTION' ? 'Caution' : 'Stop';

  return (
    <span
      className={`flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      role="status"
      aria-label={config.ariaLabel}
    >
      <span role="img" aria-label={config.ariaLabel}>
        {config.emoji}
      </span>
      <span className={colorClass}>{label}</span>
    </span>
  );
}

interface ActionBadgeProps {
  action: ActionType;
}

export function ActionBadge({ action }: ActionBadgeProps) {
  const config = ACTION_CONFIG[action];
  const colors = ACTION_COLOR_MAP[action];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors.bg} ${colors.border} ${colors.text}`}
      role="status"
      aria-label={`${config.label}: ${config.ariaLabel}`}
    >
      <span role="img" aria-label={config.ariaLabel}>
        {config.emoji}
      </span>
      <span className="font-semibold text-sm">{config.label}</span>
    </div>
  );
}

interface MetricRowProps {
  metric: NormalizedMetric;
}

export function MetricRow({ metric }: MetricRowProps) {
  return (
    <div
      className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
      role="listitem"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-200">{metric.name}</span>
        {metric.comparable && (
          <span className="text-xs text-slate-400" aria-label={`Comparable: ${metric.comparable}`}>
            ≈ {metric.comparable}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Gauge score={metric.score} size="sm" />
        <TrafficLightIndicator light={metric.trafficLight} size="sm" />
      </div>
    </div>
  );
}

interface RecommendationBoxProps {
  recommendation: NonNullable<InsightBlockProps['recommendation']>;
  detailLevel: DetailLevel;
}

export function RecommendationBox({ recommendation, detailLevel }: RecommendationBoxProps) {
  const bgConfig = RECOMMENDATION_BG_MAP[recommendation.action];
  const showReasons = detailLevel === 'standard' || detailLevel === 'full';
  const showAlternatives = detailLevel === 'full';

  return (
    <div className={`rounded-xl border p-4 ${bgConfig}`} role="region" aria-label="Recommendation">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <ActionBadge action={recommendation.action} />
        <Gauge score={recommendation.overallScore} size="md" />
      </div>

      {/* Statement */}
      <p className="text-sm text-slate-200 mb-3">{recommendation.statement}</p>

      {/* Reasons */}
      {showReasons && recommendation.reasons.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-400 mb-1">Reasoning:</p>
          <ul className="space-y-1" role="list" aria-label="Reasoning items">
            {recommendation.reasons.slice(0, 4).map((reason, i) => {
              const marker = reason.startsWith('✓') ? '✓' : reason.startsWith('✗') ? '✗' : '○';
              const cleanReason = reason.replace(/^[✓✗○]\s*/, '');
              return (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-1">
                  <span aria-hidden="true">{marker}</span>
                  <span>{cleanReason}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Alternatives (for DONT recommendations) */}
      {showAlternatives &&
        recommendation.action === 'DONT' &&
        recommendation.alternatives &&
        recommendation.alternatives.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Instead, consider:</p>
            <ul className="space-y-1" role="list" aria-label="Alternative actions">
              {recommendation.alternatives.slice(0, 3).map((alt, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-1">
                  <span aria-hidden="true">•</span>
                  <span>{alt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function InsightBlockRenderer({
  title,
  pillar,
  metrics,
  recommendation,
  detail = 'standard',
  className = '',
}: InsightBlockProps) {
  const config = PILLAR_CONFIG[pillar];
  const prefersReducedMotion = usePrefersReducedMotion();

  const averageScore = useMemo(() => {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;
  }, [metrics]);

  const transitionClass = prefersReducedMotion
    ? ''
    : 'transition-all duration-300 hover:shadow-lg';

  const showMetrics = detail === 'standard' || detail === 'full';
  const showRecommendation = detail === 'standard' || detail === 'full';

  return (
    <div
      className={`
        rounded-2xl border backdrop-blur-md
        ${config.bgClass} ${config.borderClass}
        overflow-hidden ${transitionClass}
        ${config.hoverBorderClass}
        ${className}
      `}
      role="article"
      aria-label={`${pillar} insight: ${title}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label={config.name}>
            {config.icon}
          </span>
          <div>
            <h3 className={`font-semibold ${config.textClass}`}>{pillar}</h3>
            <p className="text-xs text-slate-400">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Gauge score={averageScore} size="sm" />
        </div>
      </div>

      {/* Metrics */}
      {showMetrics && (
        <div className="px-4 py-2" role="list" aria-label="Metrics">
          {metrics.map((metric, i) => (
            <MetricRow key={i} metric={metric} />
          ))}
        </div>
      )}

      {/* Recommendation */}
      {showRecommendation && recommendation && (
        <div className="px-4 pb-4">
          <RecommendationBox recommendation={recommendation} detailLevel={detail} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PILLAR COMPARISON COMPONENT
// =============================================================================

interface PillarComparisonProps {
  logos: number;
  ethos: number;
  pathos: number;
}

export function PillarComparison({ logos, ethos, pathos }: PillarComparisonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const pillars = [
    { name: 'LOGOS', icon: ICONS.pillars.logos, score: logos, colorClass: 'bg-blue-500' },
    { name: 'ETHOS', icon: ICONS.pillars.ethos, score: ethos, colorClass: 'bg-orange-500' },
    { name: 'PATHOS', icon: ICONS.pillars.pathos, score: pathos, colorClass: 'bg-green-500' },
  ];

  const transitionClass = prefersReducedMotion
    ? ''
    : 'transition-all duration-500';

  return (
    <div className="card-ari p-4" role="region" aria-label="Pillar comparison">
      <h4 className="text-sm font-semibold text-slate-300 mb-3">Pillar Comparison</h4>
      <div className="space-y-3" role="list">
        {pillars.map(({ name, icon, score, colorClass }) => (
          <div key={name} className="flex items-center gap-3" role="listitem">
            <span className="w-8 text-center" role="img" aria-label={name}>
              {icon}
            </span>
            <span className="w-16 text-xs text-slate-400">{name}</span>
            <div
              className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-label={`${name} score: ${score.toFixed(1)} out of 10`}
            >
              <div
                className={`h-full ${colorClass} rounded-full ${transitionClass}`}
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-sm font-mono text-slate-300" aria-hidden="true">
              {score.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// QUICK STATUS COMPONENT
// =============================================================================

interface QuickStatusProps {
  metrics: NormalizedMetric[];
}

export function QuickStatus({ metrics }: QuickStatusProps) {
  return (
    <div className="flex flex-wrap gap-3" role="list" aria-label="Quick status metrics">
      {metrics.map((metric, i) => {
        const category = getScoreColorCategory(metric.score);
        const colorClass = SCORE_COLOR_MAPS.text[category];
        return (
          <div
            key={i}
            className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg"
            role="listitem"
          >
            <span className="text-xs text-slate-400">{metric.name}:</span>
            <span className={`text-sm font-mono ${colorClass}`}>{metric.score.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// SPARKLINE COMPONENT
// =============================================================================

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ values, width = 100, height = 24 }: SparklineProps) {
  if (values.length === 0) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const trend =
    values.length > 1
      ? values[values.length - 1] > values[0]
        ? '↗'
        : values[values.length - 1] < values[0]
          ? '↘'
          : '→'
      : '';
  const trendColor =
    trend === '↗' ? 'text-green-400' : trend === '↘' ? 'text-red-400' : 'text-slate-400';
  const trendLabel =
    trend === '↗' ? 'Upward trend' : trend === '↘' ? 'Downward trend' : 'Stable trend';

  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Sparkline: ${trendLabel}`}>
      <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
        <polyline
          points={points}
          fill="none"
          stroke="var(--ari-purple)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`text-sm ${trendColor}`} aria-label={trendLabel}>
        {trend}
      </span>
    </div>
  );
}

export default InsightBlockRenderer;
