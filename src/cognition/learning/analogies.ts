/**
 * Analogy Generator
 *
 * Provides simple cross-domain analogies to support dual coding + elaboration.
 */

export function generateAnalogy(concept: string): string {
  const c = concept.toLowerCase();
  if (c.includes('bayes') || c.includes('bayesian')) {
    return 'Bayesian updating is like adjusting a thermostat: new sensor readings nudge the setting, not reset it.';
  }
  if (c.includes('kelly')) {
    return 'Kelly sizing is like choosing how hard to press the gas: too little is slow, too much risks crashing.';
  }
  if (c.includes('expected value') || c === 'ev') {
    return 'Expected value is like the average result of spinning a weighted roulette wheel many times.';
  }
  return `Think of "${concept}" as a reusable pattern: find the core rule, then apply it to new situations.`;
}

