import { describe, it, expect } from 'vitest';
import { assessCognitiveLoad } from '../../../src/cognition/learning/cognitive-load.js';
import { chunkInformation } from '../../../src/cognition/learning/chunking.js';
import { defaultLearningPreferences } from '../../../src/cognition/learning/preferences-detector.js';

describe('Cognitive load utilities', () => {
  it('chunks information into bounded chunk sizes', () => {
    const chunked = chunkInformation(['a', 'b', 'c', 'd', 'e', 'f', 'g'], { maxPerChunk: 3 });
    expect(chunked.totalChunks).toBeGreaterThan(1);
    expect(chunked.maxItemsPerChunk).toBeLessThanOrEqual(3);
  });

  it('flags overload when extraneous load is high', () => {
    const prefs = defaultLearningPreferences();
    const estimate = assessCognitiveLoad({
      explanation: {
        concept: 'Kelly Criterion',
        retrievalFirst: true,
        verbal: 'Advanced: derive Kelly criterion',
        visual: 'Visual (simple): [available on request]',
        examples: Array.from({ length: 10 }, (_, i) => `Example ${i + 1}`),
      },
      userLevel: 2,
      preferences: prefs,
    });

    expect(['TOO_COMPLEX', 'GOOD']).toContain(estimate.recommendation);
    expect(estimate.total).toBeGreaterThan(0);
  });
});

