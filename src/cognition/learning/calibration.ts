/**
 * Confidence Calibration
 *
 * Tracks "stated confidence" vs "actual accuracy" to train metacognitive calibration.
 * Uses persistent storage to maintain calibration data across sessions.
 */

import type { LearningStorageAdapter } from './storage-adapter.js';
import { getDefaultStorage } from './storage-adapter.js';

export interface CalibrationPrediction {
  id: string;
  statement: string;
  confidence: number; // 0..1
  outcome: boolean | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface CalibrationCurveBucket {
  confidenceBucket: string; // "60-70%"
  statedConfidence: number; // 0..1
  actualAccuracy: number; // 0..1
  delta: number; // actual - stated
  count: number;
}

export interface ConfidenceCalibrationReport {
  predictions: CalibrationPrediction[];
  overconfidenceBias: number;
  underconfidenceBias: number;
  calibrationCurve: CalibrationCurveBucket[];
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function makeId(prefix = 'cal'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface CalibrationTrackerOptions {
  storage?: LearningStorageAdapter;
  autoPersist?: boolean;
}

export class CalibrationTracker {
  private predictions: CalibrationPrediction[] = [];
  private storage: LearningStorageAdapter;
  private autoPersist: boolean;
  private initialized = false;

  constructor(options?: CalibrationTrackerOptions) {
    this.storage = options?.storage ?? getDefaultStorage();
    this.autoPersist = options?.autoPersist ?? true;
  }

  /**
   * Initialize tracker by loading data from storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.storage.initialize();
    this.predictions = await this.storage.loadCalibrationPredictions();
    this.initialized = true;
  }

  /**
   * Get all predictions
   */
  getAllPredictions(): CalibrationPrediction[] {
    return [...this.predictions];
  }

  async addPrediction(statement: string, confidence: number, at: Date = new Date()): Promise<CalibrationPrediction> {
    const p: CalibrationPrediction = {
      id: makeId('pred'),
      statement,
      confidence: clamp(confidence, 0, 1),
      outcome: null,
      createdAt: at,
      resolvedAt: null,
    };
    this.predictions.push(p);

    if (this.autoPersist) {
      await this.storage.saveCalibrationPrediction(p);
    }

    return p;
  }

  async resolvePrediction(id: string, outcome: boolean, at: Date = new Date()): Promise<CalibrationPrediction | undefined> {
    const p = this.predictions.find(x => x.id === id);
    if (!p) return undefined;
    p.outcome = outcome;
    p.resolvedAt = at;

    if (this.autoPersist) {
      await this.storage.saveCalibrationPrediction(p);
    }

    return p;
  }

  report(): ConfidenceCalibrationReport {
    const resolved = this.predictions.filter(p => p.outcome !== null);

    // Buckets: 50-60, 60-70, 70-80, 80-90, 90-100
    const bucketEdges = [0.5, 0.6, 0.7, 0.8, 0.9, 1.01];
    const buckets: CalibrationCurveBucket[] = [];

    for (let i = 0; i < bucketEdges.length - 1; i++) {
      const lo = bucketEdges[i];
      const hi = bucketEdges[i + 1];
      const inBucket = resolved.filter(p => p.confidence >= lo && p.confidence < hi);
      if (inBucket.length === 0) continue;

      const stated = inBucket.reduce((s, p) => s + p.confidence, 0) / inBucket.length;
      const actual = inBucket.reduce((s, p) => s + (p.outcome ? 1 : 0), 0) / inBucket.length;
      buckets.push({
        confidenceBucket: `${Math.round(lo * 100)}-${Math.round((hi - 0.01) * 100)}%`,
        statedConfidence: stated,
        actualAccuracy: actual,
        delta: actual - stated,
        count: inBucket.length,
      });
    }

    const deltas = buckets.flatMap(b => Array.from({ length: b.count }, () => b.delta));
    const avgDelta = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
    const overconfidenceBias = avgDelta < 0 ? Math.abs(avgDelta) : 0;
    const underconfidenceBias = avgDelta > 0 ? avgDelta : 0;

    return {
      predictions: [...this.predictions],
      overconfidenceBias,
      underconfidenceBias,
      calibrationCurve: buckets,
    };
  }
}

// Singleton tracker instance with storage persistence
let defaultTracker: CalibrationTracker | null = null;
let initPromise: Promise<CalibrationTracker> | null = null;

/**
 * Get the default calibration tracker (singleton)
 * Automatically initializes on first call
 */
export async function getCalibrationTracker(): Promise<CalibrationTracker> {
  if (defaultTracker) return defaultTracker;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const tracker = new CalibrationTracker();
    await tracker.initialize();
    defaultTracker = tracker;
    return tracker;
  })();

  return initPromise;
}

/**
 * Get tracker synchronously (returns null if not initialized)
 */
export function getCalibrationTrackerSync(): CalibrationTracker | null {
  return defaultTracker;
}

/**
 * Create a new tracker with custom options
 */
export function createCalibrationTracker(options?: CalibrationTrackerOptions): CalibrationTracker {
  return new CalibrationTracker(options);
}

