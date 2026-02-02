/**
 * Learning Analytics
 *
 * Computes high-level learning metrics for metacognitive feedback.
 * Uses in-memory stores (practice tracker + spaced repetition engine).
 */

import { getSpacedRepetitionEngine, getSpacedRepetitionEngineSync } from './spaced-repetition.js';
import { getPracticeTracker, getPracticeTrackerSync } from './practice-tracker.js';

export interface LearningAnalytics {
  period: { start: Date; end: Date };

  retentionMetrics: {
    reviews: number;
    successfulReviews: number;
    retentionRate: number; // 0..1
    dueNow: number;
  };

  practiceQuality: {
    deliberateHours: number;
    distractedHours: number;
    focusRatio: number;
  };

  insights: Array<{
    pattern: string;
    recommendation: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Compute learning analytics (async version)
 */
export async function computeLearningAnalyticsAsync(userId: string, opts?: { days?: number; now?: Date }): Promise<LearningAnalytics> {
  const now = opts?.now ?? new Date();
  const days = opts?.days ?? 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const engine = await getSpacedRepetitionEngine();
  const reviews = engine.getReviewHistory();
  const inWindow = reviews.filter((r) => r.reviewedAt.getTime() >= start.getTime() && r.reviewedAt.getTime() <= now.getTime());
  const successful = inWindow.filter((r) => r.quality >= 3);

  const dueNow = engine.getReviewsDue(now).length;

  const practice = await getPracticeTracker();
  const practiceInWindow = practice.getSessions(userId);
  const filtered = practiceInWindow.filter((s) => s.endedAt.getTime() >= start.getTime() && s.endedAt.getTime() <= now.getTime());
  const focusedHours = filtered.reduce((sum, s) => sum + (s.focusedMinutes / 60), 0);
  const totalHours = filtered.reduce((sum, s) => sum + ((s.endedAt.getTime() - s.startedAt.getTime()) / 3600000), 0);
  const distractedHours = Math.max(0, totalHours - focusedHours);

  const focusRatio = totalHours > 0 ? clamp(focusedHours / totalHours, 0, 1) : 0;

  const insights: LearningAnalytics['insights'] = [];
  if (dueNow > 0) {
    insights.push({
      pattern: `${dueNow} concept review(s) are due`,
      recommendation: 'Do a 5–10 minute review session; consistent small reviews beat cramming.',
      impact: dueNow >= 10 ? 'HIGH' : 'MEDIUM',
    });
  }
  if (focusRatio < 0.6 && totalHours > 1) {
    insights.push({
      pattern: `Focus ratio is ${(focusRatio * 100).toFixed(0)}%`,
      recommendation: 'Reduce distractions: shorter sessions + clear drills + immediate feedback.',
      impact: 'HIGH',
    });
  }

  return {
    period: { start, end: now },
    retentionMetrics: {
      reviews: inWindow.length,
      successfulReviews: successful.length,
      retentionRate: inWindow.length > 0 ? successful.length / inWindow.length : 0,
      dueNow,
    },
    practiceQuality: {
      deliberateHours: focusedHours,
      distractedHours,
      focusRatio,
    },
    insights,
  };
}

/**
 * Compute learning analytics (sync version - requires initialized engines)
 */
export function computeLearningAnalytics(userId: string, opts?: { days?: number; now?: Date }): LearningAnalytics {
  const now = opts?.now ?? new Date();
  const days = opts?.days ?? 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const engine = getSpacedRepetitionEngineSync();
  const practiceTracker = getPracticeTrackerSync();

  // Default values if engines not initialized
  let reviews: { reviewedAt: Date; quality: number }[] = [];
  let dueNow = 0;
  let practiceInWindow: { endedAt: Date; startedAt: Date; focusedMinutes: number }[] = [];

  if (engine) {
    reviews = engine.getReviewHistory();
    dueNow = engine.getReviewsDue(now).length;
  }

  if (practiceTracker) {
    const sessions = practiceTracker.getSessions(userId);
    practiceInWindow = sessions.filter(s => s.endedAt.getTime() >= start.getTime() && s.endedAt.getTime() <= now.getTime());
  }

  const inWindow = reviews.filter(r => r.reviewedAt.getTime() >= start.getTime() && r.reviewedAt.getTime() <= now.getTime());
  const successful = inWindow.filter(r => r.quality >= 3);

  const focusedHours = practiceInWindow.reduce((sum, s) => sum + (s.focusedMinutes / 60), 0);
  const totalHours = practiceInWindow.reduce((sum, s) => sum + ((s.endedAt.getTime() - s.startedAt.getTime()) / 3600000), 0);
  const distractedHours = Math.max(0, totalHours - focusedHours);

  const focusRatio = totalHours > 0 ? clamp(focusedHours / totalHours, 0, 1) : 0;

  const insights: LearningAnalytics['insights'] = [];
  if (dueNow > 0) {
    insights.push({
      pattern: `${dueNow} concept review(s) are due`,
      recommendation: 'Do a 5–10 minute review session; consistent small reviews beat cramming.',
      impact: dueNow >= 10 ? 'HIGH' : 'MEDIUM',
    });
  }
  if (focusRatio < 0.6 && totalHours > 1) {
    insights.push({
      pattern: `Focus ratio is ${(focusRatio * 100).toFixed(0)}%`,
      recommendation: 'Reduce distractions: shorter sessions + clear drills + immediate feedback.',
      impact: 'HIGH',
    });
  }

  return {
    period: { start, end: now },
    retentionMetrics: {
      reviews: inWindow.length,
      successfulReviews: successful.length,
      retentionRate: inWindow.length > 0 ? successful.length / inWindow.length : 0,
      dueNow,
    },
    practiceQuality: {
      deliberateHours: focusedHours,
      distractedHours,
      focusRatio,
    },
    insights,
  };
}

