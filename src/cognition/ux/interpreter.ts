/**
 * Cognition UX — Interpreter
 *
 * Converts raw numeric results into:
 * - a clear scale (min/max + units),
 * - a label (LOW/MODERATE/HIGH),
 * - a plain-English meaning,
 * - a compact visual encoding.
 */

import { comparablesAround, EV_COMPARABLES } from './comparables.js';
import { renderHeatBar, renderProgressBar, renderRangeBar, type TrafficLight } from './visual-encoder.js';

export interface InterpretedMetric {
  name: string;
  value: number;
  display: string;
  scale: { min: number; max: number; unit?: string };
  label: string;
  meaning: string;
  visual: string;
  trafficLight?: TrafficLight;
  comparables?: {
    similar?: string;
    betterThan?: string;
    worseThan?: string;
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function pct(n01: number): number {
  return clamp(n01, 0, 1) * 100;
}

function oddsPhrase(percent: number): string {
  if (percent >= 95) return 'About 19 in 20 chance';
  if (percent >= 90) return 'About 9 in 10 chance';
  if (percent >= 80) return 'About 4 in 5 chance';
  if (percent >= 75) return 'About 3 in 4 chance';
  if (percent >= 67) return 'About 2 in 3 chance';
  if (percent >= 60) return 'About 3 in 5 chance';
  if (percent >= 50) return 'About a coin-flip';
  if (percent >= 40) return 'About 2 in 5 chance';
  if (percent >= 33) return 'About 1 in 3 chance';
  if (percent >= 25) return 'About 1 in 4 chance';
  return 'Low likelihood';
}

export function interpretConfidence(confidence01: number): InterpretedMetric {
  const c = clamp(confidence01, 0, 1);
  const percent = pct(c);

  const label = percent >= 85 ? 'HIGH' : percent >= 65 ? 'MODERATE' : 'LOW';
  const meaning =
    label === 'HIGH'
      ? `${oddsPhrase(percent)} this is correct`
      : label === 'MODERATE'
        ? `${oddsPhrase(percent)} this is correct; expect uncertainty`
        : `${oddsPhrase(percent)}; consider gathering more evidence`;

  return {
    name: 'Confidence',
    value: c,
    display: `${percent.toFixed(0)}%`,
    scale: { min: 0, max: 1, unit: '%' },
    label,
    meaning,
    visual: renderProgressBar(percent, { min: 0, max: 100, width: 20 }),
    trafficLight: percent >= 80 ? 'PROCEED' : percent >= 60 ? 'CAUTION' : 'STOP',
  };
}

export function interpretSeverity(severity01: number, name = 'Severity'): InterpretedMetric {
  const s = clamp(severity01, 0, 1);
  const label = s >= 0.85 ? 'CRITICAL' : s >= 0.6 ? 'HIGH' : s >= 0.3 ? 'MODERATE' : 'LOW';
  const meaning =
    label === 'CRITICAL'
      ? 'Very likely to meaningfully impair decision quality'
      : label === 'HIGH'
        ? 'Noticeable impairment risk; apply mitigations'
        : label === 'MODERATE'
          ? 'Manageable but worth addressing'
          : 'Minor impact';

  return {
    name,
    value: s,
    display: `${s.toFixed(2)} / 1.00`,
    scale: { min: 0, max: 1 },
    label,
    meaning,
    visual: renderHeatBar(s, { width: 20, showBounds: true }),
    trafficLight: s >= 0.6 ? 'STOP' : s >= 0.3 ? 'CAUTION' : 'PROCEED',
  };
}

export function interpretExpectedValueScore(ev: number, opts?: { min?: number; max?: number }): InterpretedMetric {
  const min = opts?.min ?? -10;
  const max = opts?.max ?? 10;
  const clamped = clamp(ev, min, max);

  const label =
    clamped >= 6 ? 'STRONG POSITIVE' :
    clamped >= 2 ? 'MODERATE POSITIVE' :
    clamped > 0 ? 'SLIGHT POSITIVE' :
    clamped === 0 ? 'NEUTRAL' :
    clamped <= -6 ? 'STRONG NEGATIVE' :
    clamped <= -2 ? 'MODERATE NEGATIVE' : 'SLIGHT NEGATIVE';

  const meaning =
    clamped >= 6 ? 'Worth doing; unusually high ROI relative to effort' :
    clamped >= 2 ? 'Worth doing; solid ROI' :
    clamped > 0 ? 'Probably worth doing; small but positive ROI' :
    clamped === 0 ? 'Break-even on average' :
    clamped <= -6 ? 'Not worth doing; large expected downside' :
    clamped <= -2 ? 'Probably avoid; downside likely outweighs upside' :
    'Use caution; small expected downside';

  const { similar, betterThan, worseThan } = comparablesAround(clamped, EV_COMPARABLES);

  return {
    name: 'Expected Value',
    value: ev,
    display: `${clamped.toFixed(1)} / ${max}`,
    scale: { min, max },
    label,
    meaning,
    visual: renderRangeBar(clamped, { min, max, width: 20, showBounds: true }),
    trafficLight: clamped >= 2 ? 'PROCEED' : clamped >= 0 ? 'CAUTION' : 'STOP',
    comparables: {
      similar: similar ? `${similar.label} (EV: ${similar.value})` : undefined,
      betterThan: betterThan ? `${betterThan.label} (EV: ${betterThan.value})` : undefined,
      worseThan: worseThan ? `${worseThan.label} (EV: ${worseThan.value})` : undefined,
    },
  };
}

