/**
 * Cognition UX — Comparables
 *
 * Human-friendly reference points so users can interpret a number by comparison.
 */

export type ComparableCategory = 'excellent' | 'good' | 'moderate' | 'poor';

export interface ComparableReference {
  value: number;
  label: string;
  category: ComparableCategory;
}

export const EV_COMPARABLES: ComparableReference[] = [
  { value: 9, label: 'Starting a successful business', category: 'excellent' },
  { value: 6, label: 'Learning a high-value skill', category: 'excellent' },
  { value: 3, label: 'Optimizing a daily routine', category: 'good' },
  { value: 1, label: 'Reading a quality book', category: 'moderate' },
  { value: 0, label: 'Neutral / maintenance activity', category: 'moderate' },
  { value: -2, label: 'Procrastinating on important work', category: 'poor' },
  { value: -5, label: 'Staying in a clearly bad situation', category: 'poor' },
];

export function nearestComparable(
  value: number,
  comparables: ComparableReference[]
): ComparableReference | undefined {
  if (comparables.length === 0) return undefined;
  let best = comparables[0];
  let bestDist = Math.abs(value - best.value);
  for (const c of comparables) {
    const dist = Math.abs(value - c.value);
    if (dist < bestDist) {
      best = c;
      bestDist = dist;
    }
  }
  return best;
}

export function comparablesAround(
  value: number,
  comparables: ComparableReference[]
): { similar?: ComparableReference; betterThan?: ComparableReference; worseThan?: ComparableReference } {
  const sorted = [...comparables].sort((a, b) => a.value - b.value);
  const similar = nearestComparable(value, sorted);
  const worseThan = [...sorted].reverse().find(c => c.value < value);
  const betterThan = sorted.find(c => c.value > value);
  return { similar, betterThan, worseThan };
}

