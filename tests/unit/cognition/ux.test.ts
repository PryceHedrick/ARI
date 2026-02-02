import { describe, it, expect } from 'vitest';
import {
  renderProgressBar,
  renderRangeBar,
  renderHeatBar,
  renderTrafficLight,
  renderTrend,
} from '../../../src/cognition/ux/visual-encoder.js';
import {
  interpretConfidence,
  interpretSeverity,
  interpretExpectedValueScore,
} from '../../../src/cognition/ux/interpreter.js';

describe('Cognition UX', () => {
  describe('visual encoder', () => {
    it('renders a progress bar with bounds', () => {
      const bar = renderProgressBar(50, { min: 0, max: 100, width: 10, showBounds: true });
      expect(bar).toContain('[0]');
      expect(bar).toContain('[100]');
      expect(bar).toContain('█');
    });

    it('renders a range bar with a marker line', () => {
      const bar = renderRangeBar(0, { min: -10, max: 10, width: 11, showBounds: true });
      expect(bar.split('\n').length).toBe(2);
      expect(bar).toContain('↑');
    });

    it('renders a heat bar', () => {
      const bar = renderHeatBar(0.4, { width: 10 });
      expect(bar).toContain('[0]');
      expect(bar).toContain('[1]');
    });

    it('renders traffic lights', () => {
      expect(renderTrafficLight('PROCEED', { useEmoji: false })).toContain('PROCEED');
      expect(renderTrafficLight('STOP', { useEmoji: false })).toContain('STOP');
    });

    it('renders trends', () => {
      const t = renderTrend([1, 2, 3]);
      expect(t).toContain('IMPROVING');
      expect(t).toContain('→');
    });
  });

  describe('interpreter', () => {
    it('interprets confidence with label and visual', () => {
      const m = interpretConfidence(0.65);
      expect(m.label).toBe('MODERATE');
      expect(m.visual).toContain('[');
    });

    it('interprets severity with traffic light', () => {
      const m = interpretSeverity(0.7, 'Bias Severity');
      expect(m.label).toBe('HIGH');
      expect(m.trafficLight).toBe('STOP');
    });

    it('interprets EV score with comparables', () => {
      const m = interpretExpectedValueScore(3.2);
      expect(m.label).toContain('POSITIVE');
      expect(m.comparables?.similar).toBeTruthy();
      expect(m.visual).toContain('[-10]');
    });
  });
});

