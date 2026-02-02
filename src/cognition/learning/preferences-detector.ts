/**
 * Learning Preferences Detector
 *
 * Lightweight heuristic detector for how a user prefers to learn.
 * This can be replaced later with a model-based classifier.
 */

export interface LearningPreferences {
  visual: number; // 0..1
  verbal: number; // 0..1
  kinesthetic: number; // 0..1

  depth: 'surface' | 'strategic' | 'deep';
  pace: 'fast' | 'moderate' | 'thorough';

  preferences: {
    analogies: boolean;
    mathematics: boolean;
    examples: 'many' | 'few';
    interleaving: boolean;
  };
}

export function defaultLearningPreferences(): LearningPreferences {
  return {
    visual: 0.5,
    verbal: 0.7,
    kinesthetic: 0.6,
    depth: 'strategic',
    pace: 'moderate',
    preferences: {
      analogies: true,
      mathematics: false,
      examples: 'many',
      interleaving: false,
    },
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function updatePreferencesFromUtterance(
  current: LearningPreferences,
  utterance: string
): LearningPreferences {
  const u = utterance.toLowerCase();
  const next: LearningPreferences = JSON.parse(JSON.stringify(current)) as LearningPreferences;

  // Visual signals
  if (/(visualize|diagram|chart|graph|draw|picture|flow)/i.test(u)) {
    next.visual = clamp(next.visual + 0.1, 0, 1);
  }

  // Math signals
  if (/(show me the math|derive|formula|proof|equation)/i.test(u)) {
    next.preferences.mathematics = true;
    next.depth = 'deep';
  }

  // Examples / hands-on
  if (/(example|examples|walkthrough|hands[- ]on|try it|let's implement)/i.test(u)) {
    next.kinesthetic = clamp(next.kinesthetic + 0.1, 0, 1);
    next.preferences.examples = 'many';
  }

  // Pace cues
  if (/(quickly|tl;dr|short version|brief)/i.test(u)) next.pace = 'fast';
  if (/(slowly|step by step|thorough|detail)/i.test(u)) next.pace = 'thorough';

  // Analogies
  if (/(analogy|compare|like when|similar to)/i.test(u)) next.preferences.analogies = true;

  // Interleaving preference
  if (/(mix it up|interleave|vary|different topics)/i.test(u)) next.preferences.interleaving = true;

  // Depth cues
  if (/(why does this matter|intuition|big picture)/i.test(u)) next.depth = 'strategic';
  if (/(just tell me|what do i do|command|steps)/i.test(u)) next.depth = 'surface';

  // Keep verbal as complement-ish, but don't force strict sum
  next.verbal = clamp(0.5 + (1 - next.visual) * 0.3, 0, 1);

  return next;
}

export function detectPreferencesFromHistory(history: string[]): LearningPreferences {
  let prefs = defaultLearningPreferences();
  for (const h of history.slice(-25)) {
    prefs = updatePreferencesFromUtterance(prefs, h);
  }
  return prefs;
}

