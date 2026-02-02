/**
 * Cognition UX — Mermaid Diagram Generator
 *
 * Outputs Mermaid diagrams as strings for rendering in compatible UIs.
 */

export type MermaidDiagramKind = 'cognitive-decision-flow';

export function generateMermaidDiagram(kind: MermaidDiagramKind): string {
  switch (kind) {
    case 'cognitive-decision-flow':
      return [
        '```mermaid',
        'graph LR',
        '    decision[Decision Needed]',
        '    decision --> logos[LOGOS Analysis]',
        '    decision --> ethos[ETHOS Check]',
        '    decision --> pathos[PATHOS Reflection]',
        '',
        '    logos --> ev[Expected Value]',
        '    logos --> kelly[Kelly Sizing]',
        '',
        '    ethos --> bias[Bias Detection]',
        '    ethos --> emotion[Emotional State]',
        '',
        '    pathos --> virtue[Virtue Alignment]',
        '    pathos --> wisdom[Wisdom Consultation]',
        '',
        '    ev --> synthesis[Synthesis]',
        '    kelly --> synthesis',
        '    bias --> synthesis',
        '    emotion --> synthesis',
        '    virtue --> synthesis',
        '    wisdom --> synthesis',
        '',
        '    synthesis --> recommendation[Recommendation + Confidence]',
        '```',
      ].join('\n');
    default:
      // exhaustive check
      return '';
  }
}

