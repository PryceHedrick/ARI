import { describe, it, expect } from 'vitest';
import { CalibrationTracker } from '../../../src/cognition/learning/calibration.js';
import { formatCalibrationReport } from '../../../src/cognition/learning/meta-feedback.js';

describe('Metacognitive feedback', () => {
  it('computes a calibration curve from resolved predictions', async () => {
    const tracker = new CalibrationTracker();
    const p1 = await tracker.addPrediction('Statement A', 0.8, new Date('2026-01-01T00:00:00.000Z'));
    const p2 = await tracker.addPrediction('Statement B', 0.8, new Date('2026-01-01T00:00:00.000Z'));
    await tracker.resolvePrediction(p1.id, true, new Date('2026-01-02T00:00:00.000Z'));
    await tracker.resolvePrediction(p2.id, false, new Date('2026-01-02T00:00:00.000Z'));

    const report = tracker.report();
    expect(report.calibrationCurve.length).toBeGreaterThan(0);

    const text = formatCalibrationReport(report);
    expect(text).toContain('Confidence Calibration');
    expect(text).toContain('Calibration Curve');
  });
});

