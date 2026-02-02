import { describe, it, expect } from 'vitest';
import { visualizeConcept } from '../../../src/cognition/ux/visualizer.js';
import { generateMermaidDiagram } from '../../../src/cognition/ux/diagrams.js';
import { buildStepThroughExplanation } from '../../../src/cognition/ux/interactive.js';

describe('Visual learning enhancements', () => {
  it('renders known concept visuals', () => {
    const v = visualizeConcept('Kelly Criterion');
    expect(v).toContain('Kelly');
    expect(v).toContain('Growth Rate');
  });

  it('generates mermaid diagrams', () => {
    const m = generateMermaidDiagram('cognitive-decision-flow');
    expect(m).toContain('```mermaid');
    expect(m).toContain('LOGOS');
  });

  it('builds step-through explanations', () => {
    const text = buildStepThroughExplanation('How it works', [
      { title: 'Step one', body: 'Do the first thing' },
      { title: 'Step two', body: ['Do next', 'Verify'] },
    ]);
    expect(text).toContain('1. Step one');
    expect(text).toContain('- Verify');
  });
});

