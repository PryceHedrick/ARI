/**
 * Meta-Feedback
 *
 * Turns analytics + calibration into user-facing, actionable feedback.
 */

import type { LearningAnalytics } from './analytics.js';
import type { ConfidenceCalibrationReport } from './calibration.js';
import { renderProgressBar } from '../ux/visual-encoder.js';

export function formatLearningAnalytics(analytics: LearningAnalytics): string {
  const retentionPct = analytics.retentionMetrics.retentionRate * 100;
  const focusPct = analytics.practiceQuality.focusRatio * 100;

  const retentionBar = renderProgressBar(retentionPct, { min: 0, max: 100, width: 20 });
  const focusBar = renderProgressBar(focusPct, { min: 0, max: 100, width: 20 });

  const lines: string[] = [];
  lines.push('📊 Your Learning Patterns');
  lines.push('');
  lines.push(`Retention rate: ${(retentionPct).toFixed(0)}%`);
  lines.push(`${retentionBar} ${(retentionPct).toFixed(0)}/100`);
  lines.push('');
  lines.push(`Focus ratio: ${(focusPct).toFixed(0)}% (focused / total time)`);
  lines.push(`${focusBar} ${(focusPct).toFixed(0)}/100`);
  lines.push('');
  for (const insight of analytics.insights) {
    lines.push(`- ${insight.pattern} → ${insight.recommendation} (${insight.impact})`);
  }
  return lines.join('\n');
}

export function formatCalibrationReport(report: ConfidenceCalibrationReport): string {
  const lines: string[] = [];
  lines.push('🧭 Confidence Calibration');
  lines.push('');

  if (report.calibrationCurve.length === 0) {
    lines.push('No resolved predictions yet. Record a few predictions + outcomes to calibrate.');
    return lines.join('\n');
  }

  lines.push(`Overconfidence bias: ${(report.overconfidenceBias * 100).toFixed(0)}%`);
  lines.push(`Underconfidence bias: ${(report.underconfidenceBias * 100).toFixed(0)}%`);
  lines.push('');
  lines.push('Calibration Curve (stated vs actual):');
  for (const b of report.calibrationCurve) {
    lines.push(
      `- ${b.confidenceBucket}: stated ${(b.statedConfidence * 100).toFixed(0)}% vs actual ${(b.actualAccuracy * 100).toFixed(0)}% (Δ ${(b.delta * 100).toFixed(0)}%, n=${b.count})`
    );
  }
  return lines.join('\n');
}

