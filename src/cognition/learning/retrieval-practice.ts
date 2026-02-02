/**
 * Retrieval Practice Engine (Socratic Mode)
 *
 * Implements evidence-based retrieval practice with:
 * - "Test before tell" teaching pattern (Roediger & Karpicke, 2006)
 * - Progressive hint system (3 levels)
 * - SM-2 quality rating integration
 * - Dual-coded feedback (visual + verbal)
 *
 * The testing effect shows 3x better retention from retrieval vs restudying.
 */

import type { UserKnowledgeState } from './user-knowledge.js';

// =============================================================================
// Types
// =============================================================================

export type ExplanationLevel = 'beginner' | 'intermediate' | 'advanced';

export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface RetrievalQuestion {
  concept: string;
  prompt: string;
  expected?: string;
  level: ExplanationLevel;
  rationale: string;
  grading: {
    type: 'self_report';
    scale: 'SM2_0_5';
    meaning: Record<SM2Quality, string>;
  };
}

/**
 * Hint levels for progressive scaffolding
 */
export interface HintLevel {
  level: 1 | 2 | 3;
  hint: string;
  scaffoldingType: 'conceptual' | 'breakdown' | 'walkthrough';
}

/**
 * A single attempt at answering a retrieval question
 */
export interface RetrievalAttempt {
  userAnswer: string;
  isCorrect: boolean;
  hint?: HintLevel;
  timestamp: Date;
  timeToAnswerMs: number;
}

/**
 * Full Socratic dialogue session
 */
export interface SocraticSession {
  id: string;
  concept: string;
  question: RetrievalQuestion;
  attempts: RetrievalAttempt[];
  hintsUsed: number;
  maxHints: 3;
  correctAnswer: string;
  elaboration: string;
  visual: string;
  qualityRating: SM2Quality;
  retrievalSuccessful: boolean;
  startedAt: Date;
  completedAt: Date | null;
}

/**
 * Session result with feedback
 */
export interface SocraticSessionResult {
  session: SocraticSession;
  feedback: {
    summary: string;
    nextReviewDate: Date;
    retrievalRate: string;
    recommendation: string;
  };
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Determine if retrieval-first approach should be used
 * (Test before tell if user has prior exposure)
 */
export function shouldRetrievalFirst(state: UserKnowledgeState): boolean {
  return state.exposures > 0;
}

/**
 * Generate a retrieval question for a concept
 */
export function generateRetrievalQuestion(params: {
  concept: string;
  state: UserKnowledgeState;
  level: ExplanationLevel;
  expected?: string;
}): RetrievalQuestion {
  const { concept, state, level, expected } = params;
  const seen = state.exposures > 0;

  const prompt = seen
    ? `Before I explain more, can you recall: what is "${concept}" (in your own words)?`
    : `Quick check: what do you already know about "${concept}"?`;

  return {
    concept,
    prompt,
    expected,
    level,
    rationale:
      'Retrieval strengthens memory more than rereading. Even a failed attempt + correction improves retention.',
    grading: {
      type: 'self_report',
      scale: 'SM2_0_5',
      meaning: {
        0: 'Complete blackout',
        1: 'Incorrect; barely remembered',
        2: 'Incorrect; remembered fragments',
        3: 'Correct with difficulty',
        4: 'Correct with minor hesitation',
        5: 'Perfect recall; effortless',
      },
    },
  };
}

// =============================================================================
// Socratic Dialogue System
// =============================================================================

/**
 * Generate progressive hints for a concept
 */
export function generateHints(params: {
  concept: string;
  correctAnswer: string;
  level: ExplanationLevel;
}): HintLevel[] {
  const { concept, correctAnswer } = params;

  // Parse answer into components for progressive hints
  const answerParts = parseAnswerComponents(correctAnswer);

  return [
    {
      level: 1,
      hint: `Remember the core definition of ${concept}. Think about its key characteristics and purpose.`,
      scaffoldingType: 'conceptual',
    },
    {
      level: 2,
      hint: answerParts.length > 1
        ? `Break it down: ${answerParts.map((p, i) => `(${i + 1}) ${p.hint}`).join(' ')}`
        : `Think about how ${concept} is used in practice. What problem does it solve?`,
      scaffoldingType: 'breakdown',
    },
    {
      level: 3,
      hint: `Here's most of the answer: ${correctAnswer.slice(0, Math.floor(correctAnswer.length * 0.7))}...`,
      scaffoldingType: 'walkthrough',
    },
  ];
}

/**
 * Parse answer into components for progressive hints
 */
function parseAnswerComponents(answer: string): Array<{ text: string; hint: string }> {
  // Split on common delimiters
  const parts = answer.split(/[.,;:]\s*/).filter(p => p.trim().length > 10);

  if (parts.length <= 1) {
    return [{ text: answer, hint: 'the core concept' }];
  }

  return parts.map((text, i) => ({
    text,
    hint: i === 0 ? 'start with the definition' : `then consider ${text.slice(0, 20)}...`,
  }));
}

/**
 * Create a new Socratic session
 */
export function createSocraticSession(params: {
  concept: string;
  question: RetrievalQuestion;
  correctAnswer: string;
  elaboration: string;
  visual?: string;
}): SocraticSession {
  return {
    id: `socratic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    concept: params.concept,
    question: params.question,
    attempts: [],
    hintsUsed: 0,
    maxHints: 3,
    correctAnswer: params.correctAnswer,
    elaboration: params.elaboration,
    visual: params.visual ?? generateDefaultVisual(params.concept),
    qualityRating: 0,
    retrievalSuccessful: false,
    startedAt: new Date(),
    completedAt: null,
  };
}

/**
 * Generate default visual for a concept
 */
function generateDefaultVisual(concept: string): string {
  const bar = '█'.repeat(10) + '░'.repeat(10);
  return `[${concept}] ${bar}`;
}

/**
 * Record an attempt in a Socratic session
 */
export function recordAttempt(
  session: SocraticSession,
  userAnswer: string,
  isCorrect: boolean,
  timeToAnswerMs: number
): { session: SocraticSession; nextHint: HintLevel | null; isComplete: boolean } {
  const attempt: RetrievalAttempt = {
    userAnswer,
    isCorrect,
    timestamp: new Date(),
    timeToAnswerMs,
  };

  if (!isCorrect && session.hintsUsed < session.maxHints) {
    const hints = generateHints({
      concept: session.concept,
      correctAnswer: session.correctAnswer,
      level: session.question.level,
    });
    const nextHint = hints[session.hintsUsed];
    if (nextHint) {
      attempt.hint = nextHint;
      session.hintsUsed++;
    }
  }

  session.attempts.push(attempt);

  // Check if session is complete
  const isComplete = isCorrect || session.hintsUsed >= session.maxHints;

  if (isComplete) {
    session.retrievalSuccessful = isCorrect;
    session.qualityRating = calculateQualityRating(session);
    session.completedAt = new Date();
  }

  return {
    session,
    nextHint: attempt.hint ?? null,
    isComplete,
  };
}

/**
 * Calculate SM-2 quality rating based on session performance
 */
export function calculateQualityRating(session: SocraticSession): SM2Quality {
  const correctAttempts = session.attempts.filter(a => a.isCorrect);

  if (correctAttempts.length === 0) {
    // Never got it right
    return session.attempts.length === 0 ? 0 : 1;
  }

  const correctOnAttempt = session.attempts.findIndex(a => a.isCorrect) + 1;

  // Quality based on when correct answer was given
  if (correctOnAttempt === 1) {
    // First try - check response time
    const avgTimeMs = session.attempts[0]?.timeToAnswerMs ?? 0;
    return avgTimeMs < 5000 ? 5 : 4; // < 5 seconds = perfect, otherwise hesitation
  } else if (correctOnAttempt === 2) {
    return 3; // Correct after 1 hint
  } else if (correctOnAttempt === 3) {
    return 2; // Correct after 2 hints
  } else {
    return 2; // Correct after 3 hints (still reset interval)
  }
}

/**
 * Complete a Socratic session and generate feedback
 */
export function completeSocraticSession(
  session: SocraticSession,
  nextReviewDate: Date
): SocraticSessionResult {
  const successfulAttempts = session.attempts.filter(a => a.isCorrect).length;
  const totalAttempts = session.attempts.length;
  const retrievalRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

  let summary: string;
  let recommendation: string;

  if (session.qualityRating >= 4) {
    summary = `Excellent recall! You got "${session.concept}" correct on the first try.`;
    recommendation = 'Keep reinforcing with spaced reviews.';
  } else if (session.qualityRating === 3) {
    summary = `Good effort! You recalled "${session.concept}" with some difficulty.`;
    recommendation = 'Review the concept again before your next session.';
  } else if (session.qualityRating === 2) {
    summary = `You needed hints to recall "${session.concept}".`;
    recommendation = 'Study this concept more deeply and try again soon.';
  } else {
    summary = `"${session.concept}" needs more practice.`;
    recommendation = 'Review the elaboration and create additional practice cards.';
  }

  return {
    session,
    feedback: {
      summary,
      nextReviewDate,
      retrievalRate: `${retrievalRate.toFixed(0)}%`,
      recommendation,
    },
  };
}

// =============================================================================
// Visual Formatting for Socratic Sessions
// =============================================================================

/**
 * Format a Socratic session for CLI display
 */
export function formatSocraticSession(session: SocraticSession): string {
  const lines: string[] = [];

  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push(`│ 📚 RETRIEVAL PRACTICE: ${session.concept.slice(0, 35).padEnd(35)} │`);
  lines.push('├─────────────────────────────────────────────────────────────┤');
  lines.push('│                                                             │');
  lines.push(`│ QUESTION:                                                   │`);
  lines.push(`│ ${wrapText(session.question.prompt, 57).padEnd(57)} │`);
  lines.push('│                                                             │');

  // Show attempts
  for (let i = 0; i < session.attempts.length; i++) {
    const attempt = session.attempts[i];
    const attemptNum = i + 1;

    lines.push('├─────────────────────────────────────────────────────────────┤');

    if (attempt.isCorrect) {
      lines.push(`│ ✅ ATTEMPT ${attemptNum} - CORRECT                                      │`);
    } else {
      lines.push(`│ ❌ ATTEMPT ${attemptNum} - INCORRECT                                    │`);
      if (attempt.hint) {
        lines.push('│                                                             │');
        lines.push(`│ 💡 HINT ${attempt.hint.level}: ${wrapText(attempt.hint.hint, 43).padEnd(43)} │`);
      }
    }
  }

  // Show answer if complete
  if (session.completedAt) {
    lines.push('├─────────────────────────────────────────────────────────────┤');
    lines.push('│                                                             │');
    lines.push(`│ ✅ CORRECT ANSWER: ${session.correctAnswer.slice(0, 37).padEnd(37)} │`);
    lines.push('│                                                             │');
    lines.push(`│ ELABORATION:                                                │`);
    lines.push(`│ ${wrapText(session.elaboration, 57).padEnd(57)} │`);
    lines.push('│                                                             │');
    lines.push(`│ ${session.visual.slice(0, 57).padEnd(57)} │`);
    lines.push('│                                                             │');

    // Quality rating visualization
    const qualityBar = '█'.repeat(session.qualityRating) + '░'.repeat(5 - session.qualityRating);
    lines.push(`│ 📊 Quality: [${qualityBar}] ${session.qualityRating}/5 ${qualityDescription(session.qualityRating).padEnd(25)} │`);
  }

  lines.push('│                                                             │');
  lines.push('└─────────────────────────────────────────────────────────────┘');

  return lines.join('\n');
}

/**
 * Get description for quality rating
 */
function qualityDescription(quality: SM2Quality): string {
  const descriptions: Record<SM2Quality, string> = {
    0: '(Blackout)',
    1: '(Barely recalled)',
    2: '(Hard - needed hints)',
    3: '(Correct with difficulty)',
    4: '(Correct with hesitation)',
    5: '(Perfect recall)',
  };
  return descriptions[quality];
}

/**
 * Wrap text to fit in a fixed width
 */
function wrapText(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) return text;
  return text.slice(0, maxWidth - 3) + '...';
}

// =============================================================================
// Batch Retrieval Practice
// =============================================================================

/**
 * Generate a batch of retrieval questions for multiple concepts
 */
export function generateRetrievalBatch(params: {
  concepts: Array<{ concept: string; state: UserKnowledgeState; expected?: string }>;
  level: ExplanationLevel;
  maxQuestions?: number;
}): RetrievalQuestion[] {
  const { concepts, level, maxQuestions = 10 } = params;

  // Prioritize concepts that need retrieval practice
  const prioritized = [...concepts]
    .sort((a, b) => {
      // Lower retrieval rate = higher priority
      const rateA = a.state.retrievalRate;
      const rateB = b.state.retrievalRate;
      return rateA - rateB;
    })
    .slice(0, maxQuestions);

  return prioritized.map(c =>
    generateRetrievalQuestion({
      concept: c.concept,
      state: c.state,
      level,
      expected: c.expected,
    })
  );
}
