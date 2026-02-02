/**
 * Cognition UX — Concept Visualizer
 *
 * Generates text-first visuals for abstract concepts (ASCII diagrams).
 * Phase 7: maximize dual coding beyond simple bars.
 */

export type KnownConceptVisual =
  | 'Bayesian Updating'
  | 'Kelly Criterion'
  | 'Cognitive Bias Detector'
  | 'Cognitive Decision Flow';

export function visualizeConcept(concept: string): string {
  switch (concept) {
    case 'Bayesian Updating':
      return [
        'Bayesian Updating',
        '',
        'Prior Belief: 60% ────┐',
        '                  ┌───┴───────────┐',
        'Evidence (LR) ───►│ Update via LR │──► Posterior: 72%',
        '                  └───┬───────────┘',
        '  [██████░░░░] 60%    [███████░░] 72%',
      ].join('\n');

    case 'Kelly Criterion':
      return [
        'Kelly Criterion',
        '',
        'Growth Rate vs Bet Size',
        '',
        '  g│    ╱╲    ← Optimal (Kelly)',
        '  r│   ╱  ╲',
        '  o│  ╱    ╲',
        '  w│ ╱      ╲___',
        '  t│╱           ╲_____ ← Ruin region',
        '  h└─────────────────────→ Bet size (%)',
      ].join('\n');

    case 'Cognitive Bias Detector':
      return [
        'Cognitive Bias Detector',
        '',
        'Your reasoning ───→ [Bias Detector] ───→ Result',
        '',
        '            ┌─────────────────────┐',
        '    Input   │ Pattern matching:   │  Output',
        '   ─────→   │ • Confirmation (✓)  │  ─────→',
        '            │ • Anchoring (✗)     │',
        '            │ • Recency (✓)       │',
        '            └─────────────────────┘',
      ].join('\n');

    case 'Cognitive Decision Flow':
      return [
        'How ARI makes a decision',
        '',
        '┌───────────────────────────────────────────────────────────┐',
        '│ 1) USER REQUEST                                            │',
        '└────────────────────┬──────────────────────────────────────┘',
        '                     ↓',
        '┌───────────────────────────────────────────────────────────┐',
        '│ 2) COGNITIVE ANALYSIS (Parallel)                           │',
        '│   ┌──────────┐  ┌───────────┐  ┌───────────┐              │',
        '│   │  LOGOS   │  │   ETHOS   │  │  PATHOS   │              │',
        '│   └──────────┘  └───────────┘  └───────────┘              │',
        '└────────────────────┬──────────────────────────────────────┘',
        '                     ↓',
        '┌───────────────────────────────────────────────────────────┐',
        '│ 3) SYNTHESIS → Recommendation + Confidence                 │',
        '└───────────────────────────────────────────────────────────┘',
      ].join('\n');

    default:
      return `No built-in visual for "${concept}".`;
  }
}

