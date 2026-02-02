/**
 * ARI Cognitive Layer 0: Error Handling
 *
 * Custom error classes for cognitive operations with detailed context.
 *
 * @module cognition/errors
 * @version 1.0.0
 */

import type { Pillar, ValidationStage } from './types.js';

/**
 * Base error class for all cognitive layer errors
 */
export class CognitiveError extends Error {
  public readonly pillar: Pillar | 'CROSS_CUTTING';
  public readonly framework: string;
  public readonly code: string;
  public readonly context: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(params: {
    message: string;
    pillar: Pillar | 'CROSS_CUTTING';
    framework: string;
    code: string;
    context?: Record<string, unknown>;
    recoverable?: boolean;
    cause?: Error;
  }) {
    super(params.message);
    this.name = 'CognitiveError';
    this.pillar = params.pillar;
    this.framework = params.framework;
    this.code = params.code;
    this.context = params.context || {};
    this.timestamp = new Date();
    this.recoverable = params.recoverable ?? true;

    if (params.cause) {
      this.cause = params.cause;
    }

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CognitiveError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      pillar: this.pillar,
      framework: this.framework,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      recoverable: this.recoverable,
      stack: this.stack,
    };
  }
}

// =============================================================================
// LOGOS ERRORS
// =============================================================================

/**
 * Error in Bayesian reasoning calculations
 */
export class BayesianError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'LOGOS',
      framework: 'Bayesian Reasoning',
      code: `BAYESIAN_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'BayesianError';
  }
}

/**
 * Error in expected value calculations
 */
export class ExpectedValueError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'LOGOS',
      framework: 'Expected Value Theory',
      code: `EV_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'ExpectedValueError';
  }
}

/**
 * Error in Kelly Criterion calculations
 */
export class KellyError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'LOGOS',
      framework: 'Kelly Criterion',
      code: `KELLY_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'KellyError';
  }
}

/**
 * Error in decision tree analysis
 */
export class DecisionTreeError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'LOGOS',
      framework: 'Decision Tree Analysis',
      code: `TREE_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'DecisionTreeError';
  }
}

/**
 * Error in systems thinking analysis
 */
export class SystemsThinkingError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'LOGOS',
      framework: 'Systems Thinking',
      code: `SYSTEMS_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'SystemsThinkingError';
  }
}

/**
 * Error in antifragility analysis
 */
export class AntifragilityError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'LOGOS',
      framework: 'Antifragility',
      code: `ANTIFRAGILE_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'AntifragilityError';
  }
}

// =============================================================================
// ETHOS ERRORS
// =============================================================================

/**
 * Error in bias detection
 */
export class BiasDetectionError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'ETHOS',
      framework: 'Cognitive Bias Detection',
      code: `BIAS_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'BiasDetectionError';
  }
}

/**
 * Error in emotional state assessment
 */
export class EmotionalStateError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'ETHOS',
      framework: 'Emotional State Assessment',
      code: `EMOTION_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'EmotionalStateError';
  }
}

/**
 * Error in fear/greed cycle detection
 */
export class FearGreedError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'ETHOS',
      framework: 'Fear/Greed Cycle Detection',
      code: `FEARGREED_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'FearGreedError';
  }
}

/**
 * Error in discipline checking
 */
export class DisciplineError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'ETHOS',
      framework: 'Discipline System',
      code: `DISCIPLINE_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'DisciplineError';
  }
}

// =============================================================================
// PATHOS ERRORS
// =============================================================================

/**
 * Error in CBT reframing
 */
export class CBTError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'PATHOS',
      framework: 'Cognitive Behavioral Therapy',
      code: `CBT_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'CBTError';
  }
}

/**
 * Error in Stoic philosophy analysis
 */
export class StoicError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'PATHOS',
      framework: 'Stoic Philosophy',
      code: `STOIC_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'StoicError';
  }
}

/**
 * Error in reflection engine
 */
export class ReflectionError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'PATHOS',
      framework: 'Reflection Engine',
      code: `REFLECT_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'ReflectionError';
  }
}

/**
 * Error in wisdom consultation
 */
export class WisdomError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'PATHOS',
      framework: 'Wisdom Index',
      code: `WISDOM_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'WisdomError';
  }
}

/**
 * Error in meta-learning
 */
export class MetaLearningError extends CognitiveError {
  constructor(params: {
    message: string;
    code: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'PATHOS',
      framework: 'Meta-Learning',
      code: `METALEARNING_${params.code}`,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'MetaLearningError';
  }
}

// =============================================================================
// KNOWLEDGE ERRORS
// =============================================================================

/**
 * Error in knowledge source operations
 */
export class KnowledgeSourceError extends CognitiveError {
  public readonly sourceId?: string;
  public readonly url?: string;

  constructor(params: {
    message: string;
    code: string;
    sourceId?: string;
    url?: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'CROSS_CUTTING',
      framework: 'Knowledge Management',
      code: `SOURCE_${params.code}`,
      context: { ...params.context, sourceId: params.sourceId, url: params.url },
      cause: params.cause,
    });
    this.name = 'KnowledgeSourceError';
    this.sourceId = params.sourceId;
    this.url = params.url;
  }
}

/**
 * Error in content validation
 */
export class ValidationError extends CognitiveError {
  public readonly stage: ValidationStage;
  public readonly contentId?: string;

  constructor(params: {
    message: string;
    code: string;
    stage: ValidationStage;
    contentId?: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'CROSS_CUTTING',
      framework: 'Content Validation',
      code: `VALIDATION_${params.code}`,
      context: { ...params.context, stage: params.stage, contentId: params.contentId },
      recoverable: false,
      cause: params.cause,
    });
    this.name = 'ValidationError';
    this.stage = params.stage;
    this.contentId = params.contentId;
  }
}

// =============================================================================
// LEARNING LOOP ERRORS
// =============================================================================

/**
 * Error in learning loop operations
 */
export class LearningLoopError extends CognitiveError {
  public readonly stage: string;

  constructor(params: {
    message: string;
    code: string;
    stage: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super({
      message: params.message,
      pillar: 'CROSS_CUTTING',
      framework: 'Learning Loop',
      code: `LEARNING_${params.code}`,
      context: { ...params.context, stage: params.stage },
      cause: params.cause,
    });
    this.name = 'LearningLoopError';
    this.stage = params.stage;
  }
}

// =============================================================================
// ERROR CODES
// =============================================================================

/**
 * Standardized error codes for cognitive operations
 */
export const CognitiveErrorCodes = {
  // LOGOS
  BAYESIAN: {
    INVALID_PROBABILITY: 'INVALID_PROBABILITY',
    INVALID_EVIDENCE: 'INVALID_EVIDENCE',
    COMPUTATION_FAILED: 'COMPUTATION_FAILED',
  },
  EXPECTED_VALUE: {
    INVALID_OUTCOMES: 'INVALID_OUTCOMES',
    PROBABILITIES_NOT_SUM_TO_ONE: 'PROBABILITIES_NOT_SUM_TO_ONE',
    NEGATIVE_PROBABILITY: 'NEGATIVE_PROBABILITY',
    COMPUTATION_FAILED: 'COMPUTATION_FAILED',
  },
  KELLY: {
    INVALID_INPUT: 'INVALID_INPUT',
    NEGATIVE_EDGE: 'NEGATIVE_EDGE',
    INVALID_PROBABILITY: 'INVALID_PROBABILITY',
    COMPUTATION_FAILED: 'COMPUTATION_FAILED',
  },
  DECISION_TREE: {
    INVALID_NODE: 'INVALID_NODE',
    CYCLE_DETECTED: 'CYCLE_DETECTED',
    NO_TERMINAL_NODES: 'NO_TERMINAL_NODES',
    COMPUTATION_FAILED: 'COMPUTATION_FAILED',
  },
  SYSTEMS: {
    INVALID_COMPONENT: 'INVALID_COMPONENT',
    INVALID_CONNECTION: 'INVALID_CONNECTION',
    NO_FEEDBACK_LOOPS: 'NO_FEEDBACK_LOOPS',
    COMPUTATION_FAILED: 'COMPUTATION_FAILED',
  },
  ANTIFRAGILITY: {
    INVALID_STRESSOR: 'INVALID_STRESSOR',
    NO_STRESSORS: 'NO_STRESSORS',
    COMPUTATION_FAILED: 'COMPUTATION_FAILED',
  },

  // ETHOS
  BIAS: {
    EMPTY_REASONING: 'EMPTY_REASONING',
    INVALID_CONTEXT: 'INVALID_CONTEXT',
    DETECTION_FAILED: 'DETECTION_FAILED',
  },
  EMOTION: {
    INVALID_CONTEXT: 'INVALID_CONTEXT',
    ASSESSMENT_FAILED: 'ASSESSMENT_FAILED',
  },
  FEAR_GREED: {
    INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
    DETECTION_FAILED: 'DETECTION_FAILED',
  },
  DISCIPLINE: {
    INVALID_DECISION: 'INVALID_DECISION',
    INVALID_CONTEXT: 'INVALID_CONTEXT',
    CHECK_FAILED: 'CHECK_FAILED',
  },

  // PATHOS
  CBT: {
    EMPTY_THOUGHT: 'EMPTY_THOUGHT',
    REFRAME_FAILED: 'REFRAME_FAILED',
  },
  STOIC: {
    EMPTY_SITUATION: 'EMPTY_SITUATION',
    ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  },
  REFLECTION: {
    INVALID_OUTCOME: 'INVALID_OUTCOME',
    REFLECTION_FAILED: 'REFLECTION_FAILED',
  },
  WISDOM: {
    EMPTY_QUERY: 'EMPTY_QUERY',
    NO_RESULTS: 'NO_RESULTS',
    QUERY_FAILED: 'QUERY_FAILED',
  },
  META_LEARNING: {
    INVALID_SKILL: 'INVALID_SKILL',
    INVALID_LEVELS: 'INVALID_LEVELS',
    PLAN_FAILED: 'PLAN_FAILED',
  },

  // Knowledge
  SOURCE: {
    NOT_FOUND: 'NOT_FOUND',
    FETCH_FAILED: 'FETCH_FAILED',
    INVALID_URL: 'INVALID_URL',
    TRUST_VIOLATION: 'TRUST_VIOLATION',
  },
  VALIDATION: {
    WHITELIST_FAILED: 'WHITELIST_FAILED',
    SANITIZE_FAILED: 'SANITIZE_FAILED',
    BIAS_CHECK_FAILED: 'BIAS_CHECK_FAILED',
    FACT_CHECK_FAILED: 'FACT_CHECK_FAILED',
    HUMAN_REVIEW_REQUIRED: 'HUMAN_REVIEW_REQUIRED',
  },

  // Learning Loop
  LEARNING: {
    REVIEW_FAILED: 'REVIEW_FAILED',
    GAP_ANALYSIS_FAILED: 'GAP_ANALYSIS_FAILED',
    ASSESSMENT_FAILED: 'ASSESSMENT_FAILED',
    INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  },
} as const;

// =============================================================================
// ERROR UTILITIES
// =============================================================================

/**
 * Check if an error is a CognitiveError
 */
export function isCognitiveError(error: unknown): error is CognitiveError {
  return error instanceof CognitiveError;
}

/**
 * Wrap any error in a CognitiveError
 */
export function wrapError(
  error: unknown,
  params: {
    pillar: Pillar | 'CROSS_CUTTING';
    framework: string;
    code: string;
    context?: Record<string, unknown>;
  }
): CognitiveError {
  if (isCognitiveError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  return new CognitiveError({
    message,
    pillar: params.pillar,
    framework: params.framework,
    code: params.code,
    context: params.context,
    cause: error instanceof Error ? error : undefined,
  });
}

/**
 * Format error for logging
 */
export function formatCognitiveError(error: CognitiveError): string {
  return [
    `[${error.pillar}/${error.framework}] ${error.code}`,
    `Message: ${error.message}`,
    error.context && Object.keys(error.context).length > 0
      ? `Context: ${JSON.stringify(error.context)}`
      : null,
    `Timestamp: ${error.timestamp.toISOString()}`,
    `Recoverable: ${error.recoverable}`,
  ]
    .filter(Boolean)
    .join('\n');
}
