import { describe, it, expect } from 'vitest';
import {
  normalize,
  normalizeMultiple,
  getAvailableMetricTypes,
  isValidMetricType,
  renderGauge,
  renderMiniGauge,
} from '../../../src/cognition/ux/normalizer.js';
import {
  renderComparison,
  renderSparkline,
  renderPillarComparison,
  renderRecommendation,
} from '../../../src/cognition/ux/charts.js';
import {
  generateRecommendation,
  shouldProceed,
  hasBlockers,
} from '../../../src/cognition/ux/recommender.js';

describe('Universal Normalizer', () => {
  describe('normalize()', () => {
    it('should normalize EV to 0-10 scale', () => {
      // Positive EV should score high
      const highEv = normalize(50, 'ev');
      expect(highEv.score).toBeGreaterThan(7);
      expect(highEv.category).toBe('GOOD');
      expect(highEv.trafficLight).toBe('PROCEED');

      // Negative EV should score low
      const lowEv = normalize(-50, 'ev');
      expect(lowEv.score).toBeLessThan(4);
      expect(['CRITICAL', 'HIGH_RISK']).toContain(lowEv.category);
      expect(lowEv.trafficLight).toBe('STOP');

      // Zero EV should be moderate
      const zeroEv = normalize(0, 'ev');
      expect(zeroEv.score).toBeCloseTo(5, 0);
    });

    it('should invert risk metrics (higher input = lower score)', () => {
      // High bias risk should give LOW score
      const highBias = normalize(0.9, 'biasRisk');
      expect(highBias.score).toBeLessThan(2);
      expect(highBias.recommendation.action).toBe('DONT');

      // Low bias risk should give HIGH score
      const lowBias = normalize(0.1, 'biasRisk');
      expect(lowBias.score).toBeGreaterThan(8);
      expect(lowBias.recommendation.action).toBe('DO');
    });

    it('should normalize confidence correctly', () => {
      const highConf = normalize(0.9, 'confidence');
      expect(highConf.score).toBeGreaterThan(8);

      const lowConf = normalize(0.3, 'confidence');
      expect(lowConf.score).toBeLessThan(4);
    });

    it('should include comparable phrase', () => {
      const ev = normalize(50, 'ev');
      expect(ev.comparable).toBeDefined();
      expect(ev.comparable.length).toBeGreaterThan(0);
    });

    it('should throw on unknown metric type', () => {
      expect(() => normalize(0.5, 'unknownMetric')).toThrow('Unknown metric type');
    });
  });

  describe('normalizeMultiple()', () => {
    it('should normalize multiple metrics at once', () => {
      const metrics = normalizeMultiple([
        { value: 50, type: 'ev' },
        { value: 0.8, type: 'confidence' },
        { value: 0.2, type: 'biasRisk' },
      ]);

      expect(metrics).toHaveLength(3);
      expect(metrics[0].name).toBe('Expected Value');
      expect(metrics[1].name).toBe('Confidence');
      expect(metrics[2].name).toBe('Bias Risk');
    });
  });

  describe('getAvailableMetricTypes()', () => {
    it('should return all available metric types', () => {
      const types = getAvailableMetricTypes();
      expect(types).toContain('ev');
      expect(types).toContain('kelly');
      expect(types).toContain('biasRisk');
      expect(types).toContain('emotionalRisk');
      expect(types).toContain('confidence');
    });
  });

  describe('isValidMetricType()', () => {
    it('should validate metric types', () => {
      expect(isValidMetricType('ev')).toBe(true);
      expect(isValidMetricType('unknown')).toBe(false);
    });
  });
});

describe('Chart Generator', () => {
  describe('renderGauge()', () => {
    it('should render gauge with score', () => {
      const gauge = renderGauge(7.5);
      expect(gauge).toContain('7.5');
      expect(gauge).toContain('◉');
      expect(gauge).toContain('🟢');
    });

    it('should show yellow for moderate scores', () => {
      const gauge = renderGauge(5.5);
      expect(gauge).toContain('🟡');
    });

    it('should show red for low scores', () => {
      const gauge = renderGauge(2.0);
      expect(gauge).toContain('🔴');
    });
  });

  describe('renderMiniGauge()', () => {
    it('should render compact gauge', () => {
      const mini = renderMiniGauge(8);
      expect(mini).toContain('█');
      expect(mini).toContain('░');
      expect(mini).toContain('8');
    });
  });

  describe('renderComparison()', () => {
    it('should render side-by-side comparison', () => {
      const comparison = renderComparison([
        { name: 'EV', score: 8 },
        { name: 'Kelly', score: 6 },
        { name: 'Bias', score: 9 },
      ]);

      expect(comparison).toContain('EV');
      expect(comparison).toContain('Kelly');
      expect(comparison).toContain('Bias');
      expect(comparison).toContain('█');
    });
  });

  describe('renderSparkline()', () => {
    it('should render sparkline with trend', () => {
      const sparkline = renderSparkline([1, 2, 3, 4, 5]);
      expect(sparkline).toContain('↗');
      expect(sparkline.match(/[▁▂▃▄▅▆▇█]/g)?.length).toBeGreaterThan(0);
    });

    it('should show declining trend', () => {
      const sparkline = renderSparkline([5, 4, 3, 2, 1]);
      expect(sparkline).toContain('↘');
    });
  });

  describe('renderPillarComparison()', () => {
    it('should render LOGOS/ETHOS/PATHOS comparison', () => {
      const pillars = renderPillarComparison(8, 7, 6);
      expect(pillars).toContain('LOGOS');
      expect(pillars).toContain('ETHOS');
      expect(pillars).toContain('PATHOS');
      expect(pillars).toContain('🧠');
      expect(pillars).toContain('❤️');
      expect(pillars).toContain('🌱');
    });
  });

  describe('renderRecommendation()', () => {
    it('should render DO recommendation', () => {
      const rec = renderRecommendation({
        action: 'DO',
        statement: 'Proceed with confidence',
        reasons: ['Positive EV', 'Low bias'],
        overallScore: 8.5,
      });

      expect(rec).toContain('PROCEED');
      expect(rec).toContain('✅');
      expect(rec).toContain('🟢');
    });

    it('should render DONT recommendation with alternatives', () => {
      const rec = renderRecommendation({
        action: 'DONT',
        statement: 'Do not proceed',
        reasons: ['High emotional risk'],
        alternatives: ['Wait 24 hours', 'Consult advisor'],
        overallScore: 3.2,
      });

      expect(rec).toContain('DO NOT PROCEED');
      expect(rec).toContain('❌');
      expect(rec).toContain('Wait 24 hours');
    });
  });
});

describe('Recommendation Engine', () => {
  describe('generateRecommendation()', () => {
    it('should recommend DO for all high scores', () => {
      const rec = generateRecommendation({
        ev: normalize(50, 'ev'),
        confidence: normalize(0.8, 'confidence'),
        biasRisk: normalize(0.1, 'biasRisk'),
      });

      expect(rec.action).toBe('DO');
      expect(rec.confidence).toBeGreaterThan(7);
      expect(rec.blockers).toHaveLength(0);
    });

    it('should recommend DONT when blockers present', () => {
      const rec = generateRecommendation({
        ev: normalize(50, 'ev'),
        emotionalRisk: normalize(0.9, 'emotionalRisk'), // High emotional risk = blocker
      });

      expect(rec.action).toBe('DONT');
      expect(rec.blockers.length).toBeGreaterThan(0);
      expect(rec.alternatives).toBeDefined();
    });

    it('should recommend CAUTION for moderate scores', () => {
      const rec = generateRecommendation({
        ev: normalize(0, 'ev'),
        confidence: normalize(0.5, 'confidence'),
      });

      expect(['CAUTION', 'DONT']).toContain(rec.action);
    });

    it('should generate reasons for each metric', () => {
      const rec = generateRecommendation({
        ev: normalize(50, 'ev'),
        kelly: normalize(0.25, 'kelly'),
      });

      expect(rec.reasons.length).toBeGreaterThan(0);
      expect(rec.reasons.some(r => r.includes('Expected Value'))).toBe(true);
    });
  });

  describe('shouldProceed()', () => {
    it('should return proceed=true for high scores', () => {
      const result = shouldProceed({
        ev: normalize(50, 'ev'),
        confidence: normalize(0.8, 'confidence'),
      });

      expect(result.proceed).toBe(true);
      expect(result.score).toBeGreaterThan(7);
    });

    it('should return proceed=false for blockers', () => {
      const result = shouldProceed({
        biasRisk: normalize(0.9, 'biasRisk'),
      });

      expect(result.proceed).toBe(false);
    });
  });

  describe('hasBlockers()', () => {
    it('should detect blockers', () => {
      const result = hasBlockers({
        emotionalRisk: normalize(0.85, 'emotionalRisk'),
      });

      expect(result.blocked).toBe(true);
      expect(result.blockers.length).toBeGreaterThan(0);
    });

    it('should return no blockers for good scores', () => {
      const result = hasBlockers({
        ev: normalize(50, 'ev'),
        biasRisk: normalize(0.1, 'biasRisk'),
      });

      expect(result.blocked).toBe(false);
    });
  });
});
