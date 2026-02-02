/**
 * Weakness Analyzer
 *
 * Turns error-pattern strings into prioritized weaknesses and suggested drills.
 * In later phases, this can be upgraded with richer telemetry and embeddings.
 */

export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Weakness {
  pattern: string;
  frequency: number;
  recommendation: string;
  impact: ImpactLevel;
}

function getImpactLevel(frequency: number): ImpactLevel {
  if (frequency >= 5) return 'HIGH';
  if (frequency >= 2) return 'MEDIUM';
  return 'LOW';
}

export function analyzeWeaknesses(errorPatterns: string[]): Weakness[] {
  const counts = new Map<string, number>();
  for (const p of errorPatterns.map(s => s.trim()).filter(Boolean)) {
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }

  const weaknesses: Weakness[] = [...counts.entries()]
    .map(([pattern, frequency]) => ({
      pattern,
      frequency,
      impact: getImpactLevel(frequency),
      recommendation: recommendationFor(pattern),
    }))
    .sort((a, b) => b.frequency - a.frequency);

  return weaknesses;
}

function recommendationFor(pattern: string): string {
  const p = pattern.toLowerCase();
  if (p.includes('generic') || p.includes('typescript')) {
    return 'Drill: write 5 small utilities using generics; focus on constraints and inference.';
  }
  if (p.includes('test') || p.includes('vitest')) {
    return 'Drill: write 3 tests for one module; focus on edge cases and failure modes.';
  }
  if (p.includes('async') || p.includes('promise')) {
    return 'Drill: refactor one async flow; add explicit await/return types; verify error propagation.';
  }
  if (p.includes('naming') || p.includes('readability')) {
    return 'Drill: rewrite one function focusing only on naming + structure; keep behavior identical.';
  }
  return 'Drill: isolate the smallest failing sub-skill and practice it repeatedly with immediate feedback.';
}

