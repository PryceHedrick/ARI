/**
 * ARI Multi-Signal Request Classifier
 *
 * Replaces the basic keyword-matching classifier with a 6-dimension
 * signal analysis system. Each dimension produces a score from 0-10,
 * combined with configurable weights into a final complexity estimate.
 *
 * Design principles:
 * - No ML training required — pure heuristic scoring
 * - Multiple weak signals combine into strong classification
 * - Fails safe: when uncertain, overestimates complexity (routes to better model)
 * - Observable: every classification produces detailed reasoning
 *
 * Signal dimensions:
 * 1. Content Analysis — vocabulary sophistication, domain detection
 * 2. Structural Analysis — request structure, code, multi-part
 * 3. Conversation Context — multi-turn complexity, topic shifts
 * 4. Task Metadata — agent, trust, priority, security flags
 * 5. Capability Requirements — what model features are needed
 * 6. Ambiguity Detection — vague references, underspecified requests
 *
 * Based on research:
 * - FrugalGPT (Stanford 2023) — quality scoring without trained models
 * - RouteLLM (ICLR 2025) — multi-signal routing as architecture
 * - Martian Model Router — semantic complexity extraction
 */

import type {
  TaskComplexity,
  TaskCategory,
  AIRequest,
} from './types.js';
import type { PerformanceTracker } from './performance-tracker.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ClassificationResult {
  complexity: TaskComplexity;
  score: number; // 0-10 composite score
  confidence: number; // 0-1 how confident the classification is
  signals: SignalScores;
  suggestedCategory: TaskCategory; // May override caller's category
  suggestedChain: string; // Recommended cascade chain
  reasoning: string; // Human-readable explanation
}

export interface SignalScores {
  contentAnalysis: number; // 0-10
  structuralAnalysis: number; // 0-10
  conversationContext: number; // 0-10
  taskMetadata: number; // 0-10
  capabilityRequirements: number; // 0-10
  ambiguityPenalty: number; // 0-10 (higher = more ambiguous = harder)
}

export interface ClassifierWeights {
  contentAnalysis: number;
  structuralAnalysis: number;
  conversationContext: number;
  taskMetadata: number;
  capabilityRequirements: number;
  ambiguityPenalty: number;
}

const DEFAULT_WEIGHTS: ClassifierWeights = {
  contentAnalysis: 0.25,
  structuralAnalysis: 0.15,
  conversationContext: 0.10,
  taskMetadata: 0.15,
  capabilityRequirements: 0.15,
  ambiguityPenalty: 0.20,
};

// ═══════════════════════════════════════════════════════════════════════════════
// VOCABULARY & PATTERN DATABASES
// ═══════════════════════════════════════════════════════════════════════════════

// Domain-specific vocabulary with difficulty weights
const DOMAIN_VOCABULARY: Record<string, { weight: number; domains: string[] }> = {
  // Security (high complexity)
  'vulnerability': { weight: 3.0, domains: ['security'] },
  'injection': { weight: 3.0, domains: ['security'] },
  'authentication': { weight: 2.5, domains: ['security'] },
  'authorization': { weight: 2.5, domains: ['security'] },
  'encryption': { weight: 2.5, domains: ['security'] },
  'credential': { weight: 2.5, domains: ['security'] },
  'csrf': { weight: 3.0, domains: ['security'] },
  'xss': { weight: 3.0, domains: ['security'] },
  'sql injection': { weight: 3.5, domains: ['security'] },
  'privilege escalation': { weight: 3.5, domains: ['security'] },
  'zero-day': { weight: 4.0, domains: ['security'] },
  'buffer overflow': { weight: 3.5, domains: ['security'] },

  // Systems/Architecture (high complexity)
  'distributed': { weight: 2.5, domains: ['architecture'] },
  'microservice': { weight: 2.0, domains: ['architecture'] },
  'race condition': { weight: 3.0, domains: ['architecture', 'debugging'] },
  'deadlock': { weight: 3.0, domains: ['architecture'] },
  'consensus': { weight: 3.0, domains: ['architecture'] },
  'eventual consistency': { weight: 3.0, domains: ['architecture'] },
  'sharding': { weight: 2.5, domains: ['architecture'] },
  'load balancing': { weight: 2.0, domains: ['architecture'] },
  'replication': { weight: 2.0, domains: ['architecture'] },
  'fault tolerance': { weight: 2.5, domains: ['architecture'] },

  // Algorithms/Math (medium-high complexity)
  'algorithm': { weight: 2.0, domains: ['reasoning'] },
  'complexity': { weight: 1.5, domains: ['reasoning'] },
  'big-o': { weight: 2.0, domains: ['reasoning'] },
  'recursion': { weight: 1.5, domains: ['reasoning'] },
  'dynamic programming': { weight: 3.0, domains: ['reasoning'] },
  'graph traversal': { weight: 2.5, domains: ['reasoning'] },
  'optimization': { weight: 2.0, domains: ['reasoning'] },
  'polynomial': { weight: 2.0, domains: ['reasoning'] },
  'eigenvalue': { weight: 3.0, domains: ['reasoning'] },
  'gradient descent': { weight: 2.5, domains: ['reasoning'] },

  // Code patterns (medium complexity)
  'refactor': { weight: 2.0, domains: ['code'] },
  'implement': { weight: 1.5, domains: ['code'] },
  'debug': { weight: 2.0, domains: ['code', 'debugging'] },
  'test': { weight: 1.0, domains: ['code'] },
  'api': { weight: 1.5, domains: ['code'] },
  'endpoint': { weight: 1.0, domains: ['code'] },
  'migration': { weight: 2.0, domains: ['code'] },
  'schema': { weight: 1.5, domains: ['code'] },
  'type system': { weight: 2.0, domains: ['code'] },
  'generics': { weight: 2.0, domains: ['code'] },
  'function': { weight: 1.0, domains: ['code'] },
  'class': { weight: 1.0, domains: ['code'] },
  'parse': { weight: 1.0, domains: ['code'] },
  'json': { weight: 0.5, domains: ['code'] },
  'database': { weight: 1.5, domains: ['code'] },
  'cache': { weight: 1.5, domains: ['code', 'architecture'] },
  'async': { weight: 1.0, domains: ['code'] },
  'thread': { weight: 2.0, domains: ['code', 'architecture'] },
  'concurrent': { weight: 2.0, domains: ['architecture'] },
  'mutex': { weight: 2.5, domains: ['architecture'] },
  'atomic': { weight: 2.0, domains: ['architecture'] },

  // Analysis/Reasoning triggers
  'why': { weight: 1.5, domains: ['reasoning'] },
  'explain': { weight: 1.0, domains: ['reasoning'] },
  'analyze': { weight: 1.5, domains: ['reasoning'] },
  'compare': { weight: 1.5, domains: ['reasoning'] },
  'tradeoff': { weight: 2.0, domains: ['reasoning'] },
  'trade-off': { weight: 2.0, domains: ['reasoning'] },
  'evaluate': { weight: 1.5, domains: ['reasoning'] },
  'implications': { weight: 2.0, domains: ['reasoning'] },
  'consequences': { weight: 1.5, domains: ['reasoning'] },

  // Creative (medium complexity)
  'design': { weight: 1.5, domains: ['creative'] },
  'architect': { weight: 2.0, domains: ['creative', 'architecture'] },
  'brainstorm': { weight: 1.5, domains: ['creative'] },
  'novel': { weight: 1.5, domains: ['creative'] },
  'innovative': { weight: 1.5, domains: ['creative'] },

  // Simple indicators (low complexity)
  'hello': { weight: -1.0, domains: ['chat'] },
  'hi': { weight: -1.0, domains: ['chat'] },
  'thanks': { weight: -1.0, domains: ['chat'] },
  'status': { weight: 0, domains: ['query'] },
  'time': { weight: -0.5, domains: ['query'] },
  'weather': { weight: -0.5, domains: ['query'] },
};

// Ambiguity indicators — vague references that signal the model needs more context
const AMBIGUITY_PATTERNS = [
  { pattern: /\bmake it work\b/i, weight: 2.0, reason: 'vague goal' },
  { pattern: /\bfix (?:it|this|that)\b/i, weight: 1.5, reason: 'unspecified target' },
  { pattern: /\bdo (?:it|this|that|the thing)\b/i, weight: 1.5, reason: 'vague reference' },
  { pattern: /\bsomething (?:like|similar)\b/i, weight: 1.0, reason: 'underspecified' },
  { pattern: /\bwhatever (?:works|you think)\b/i, weight: 1.0, reason: 'delegated decision' },
  { pattern: /\bi(?:'m| am) not sure (?:what|how|why)\b/i, weight: 1.5, reason: 'uncertain requirement' },
  { pattern: /\bjust\b.*\bquick\b/i, weight: -0.5, reason: 'explicitly simple' },
  { pattern: /\bthe (?:usual|normal|standard)\b/i, weight: 0.5, reason: 'implicit context needed' },
  { pattern: /\byou know\b/i, weight: 1.0, reason: 'assumed context' },
  { pattern: /^.{1,15}$/m, weight: 1.5, reason: 'very short request' }, // Single-line <15 chars
];

// Structural complexity indicators
const STRUCTURE_PATTERNS = {
  codeBlock: /```[\s\S]*?```/g,
  numberedList: /^\s*\d+[.)]\s/gm,
  bulletList: /^\s*[-*•]\s/gm,
  conditionalLogic: /\bif\b.*\bthen\b|\bunless\b|\bwhen\b.*\bshould\b|\bdepending on\b/gi,
  fileReference: /(?:\/[\w.-]+)+(?:\.\w+)?|\b[\w-]+\.(?:ts|js|py|rs|go|md|json|yaml|yml|toml|sql)\b/g,
  urlReference: /https?:\/\/\S+/g,
  multiPart: /\b(?:first|then|next|after that|finally|step \d|part \d)\b/gi,
  questionMark: /\?/g,
  technicalTerms: /\b(?:async|await|promise|callback|closure|mutex|semaphore|thread|process|socket|buffer|stream|iterator|generator|decorator|metaclass|monad|functor)\b/gi,
};

// Category detection patterns
const CATEGORY_PATTERNS: { category: TaskCategory; patterns: RegExp[]; weight: number }[] = [
  {
    category: 'code_generation',
    patterns: [
      /\b(?:write|create|implement|build|make|add|generate)\b.*\b(?:function|class|component|module|script|code|program|app|service|api)\b/i,
      /\b(?:write|create)\b.*\b(?:code|program|script)\b/i,
    ],
    weight: 3,
  },
  {
    category: 'code_review',
    patterns: [
      /\b(?:review|check|look at|examine|audit)\b.*\b(?:code|implementation|pr|pull request|diff|changes)\b/i,
      /\bwhat(?:'s| is) wrong with\b/i,
    ],
    weight: 3,
  },
  {
    category: 'security',
    patterns: [
      /\b(?:security|vulnerability|exploit|attack|threat|injection|xss|csrf|auth)\b/i,
      /\b(?:pentest|penetration test|security audit|vulnerability scan)\b/i,
    ],
    weight: 4,
  },
  {
    category: 'analysis',
    patterns: [
      /\b(?:analyze|analyse|evaluate|assess|investigate|diagnose|examine)\b/i,
      /\bwhy (?:does|is|did|would|should)\b/i,
    ],
    weight: 2,
  },
  {
    category: 'planning',
    patterns: [
      /\b(?:plan|design|architect|strategy|roadmap|outline|proposal)\b/i,
      /\bhow (?:should|would|can) (?:we|i|you)\b/i,
    ],
    weight: 2,
  },
  {
    category: 'summarize',
    patterns: [
      /\b(?:summarize|summarise|tldr|tl;dr|brief|recap|overview)\b/i,
    ],
    weight: 1,
  },
  {
    category: 'heartbeat',
    patterns: [
      /^(?:ping|pong|health|status|alive|ok)\s*\??$/i,
    ],
    weight: 0,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════════

export class RequestClassifier {
  private readonly performanceTracker: PerformanceTracker | null;
  private readonly weights: ClassifierWeights;

  constructor(options?: {
    performanceTracker?: PerformanceTracker;
    weights?: Partial<ClassifierWeights>;
  }) {
    this.performanceTracker = options?.performanceTracker ?? null;
    this.weights = { ...DEFAULT_WEIGHTS, ...options?.weights };
  }

  /**
   * Classify a request using multi-signal analysis.
   *
   * Combines 6 signal dimensions into a composite complexity score,
   * then maps to a TaskComplexity level with confidence and reasoning.
   */
  classify(request: AIRequest): ClassificationResult {
    const content = this.getFullContent(request);

    // Score each signal dimension (0-10)
    const signals: SignalScores = {
      contentAnalysis: this.scoreContentAnalysis(content),
      structuralAnalysis: this.scoreStructuralAnalysis(content),
      conversationContext: this.scoreConversationContext(request),
      taskMetadata: this.scoreTaskMetadata(request),
      capabilityRequirements: this.scoreCapabilityRequirements(content, request.category),
      ambiguityPenalty: this.scoreAmbiguity(content),
    };

    // Weighted composite score
    let compositeScore =
      signals.contentAnalysis * this.weights.contentAnalysis +
      signals.structuralAnalysis * this.weights.structuralAnalysis +
      signals.conversationContext * this.weights.conversationContext +
      signals.taskMetadata * this.weights.taskMetadata +
      signals.capabilityRequirements * this.weights.capabilityRequirements +
      signals.ambiguityPenalty * this.weights.ambiguityPenalty;

    // Apply interaction effects (signals that amplify each other)
    // Based on RouteLLM research: correlated signals are stronger than sum of parts
    compositeScore = this.applyInteractionEffects(compositeScore, signals, request);

    // Map to complexity level
    const complexity = this.scoreToComplexity(compositeScore);

    // Calculate confidence based on signal agreement
    const confidence = this.calculateConfidence(signals);

    // Detect best category
    const suggestedCategory = this.detectCategory(content, request.category);

    // Map to cascade chain
    const suggestedChain = this.complexityToChain(complexity, suggestedCategory, request.securitySensitive);

    // Build reasoning string
    const reasoning = this.buildReasoning(signals, compositeScore, complexity, confidence);

    return {
      complexity,
      score: compositeScore,
      confidence,
      signals,
      suggestedCategory,
      suggestedChain,
      reasoning,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL 1: CONTENT ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze the content text for vocabulary sophistication, domain terms,
   * and linguistic complexity indicators.
   */
  private scoreContentAnalysis(content: string): number {
    const lowerContent = content.toLowerCase();
    let score = 2.0; // Base: slightly above trivial

    // Domain vocabulary detection with weighted scoring
    let domainScore = 0;
    const domainsFound = new Set<string>();

    for (const [term, config] of Object.entries(DOMAIN_VOCABULARY)) {
      if (lowerContent.includes(term.toLowerCase())) {
        domainScore += config.weight;
        for (const domain of config.domains) {
          domainsFound.add(domain);
        }
      }
    }

    // Multi-domain requests are harder (cross-cutting concerns)
    if (domainsFound.size >= 3) {
      domainScore += 1.5; // Cross-domain complexity bonus
    } else if (domainsFound.size >= 2) {
      domainScore += 0.5;
    }

    score += Math.min(domainScore, 6.0); // Cap domain contribution

    // Token count estimation (longer = potentially more complex)
    const estimatedTokens = content.length / 4;
    if (estimatedTokens > 5000) score += 1.5;
    else if (estimatedTokens > 2000) score += 1.0;
    else if (estimatedTokens > 500) score += 0.5;

    // Sentence complexity — average words per sentence
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const avgWordsPerSentence = content.split(/\s+/).length / sentences.length;
      if (avgWordsPerSentence > 25) score += 0.5; // Complex sentence structure
    }

    return Math.max(0, Math.min(10, score));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL 2: STRUCTURAL ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze the structure of the request: code blocks, lists,
   * file references, conditional logic, multi-part instructions.
   */
  private scoreStructuralAnalysis(content: string): number {
    let score = 0;

    // Code blocks indicate code-related complexity
    const codeBlocks = content.match(STRUCTURE_PATTERNS.codeBlock);
    if (codeBlocks) {
      score += Math.min(codeBlocks.length * 1.5, 4.0);
      // Large code blocks = more context to analyze
      const totalCodeLength = codeBlocks.reduce((sum, b) => sum + b.length, 0);
      if (totalCodeLength > 1000) score += 1.0;
    }

    // Numbered/bullet lists = multi-step instructions
    const numberedItems = content.match(STRUCTURE_PATTERNS.numberedList);
    const bulletItems = content.match(STRUCTURE_PATTERNS.bulletList);
    const listItems = (numberedItems?.length ?? 0) + (bulletItems?.length ?? 0);
    if (listItems > 5) score += 2.0;
    else if (listItems > 2) score += 1.0;
    else if (listItems > 0) score += 0.5;

    // Conditional logic (if/then/unless) = branching requirements
    const conditionals = content.match(STRUCTURE_PATTERNS.conditionalLogic);
    if (conditionals) {
      score += Math.min(conditionals.length * 1.0, 3.0);
    }

    // File references = codebase context needed
    const fileRefs = content.match(STRUCTURE_PATTERNS.fileReference);
    if (fileRefs) {
      score += Math.min(fileRefs.length * 0.5, 2.0);
    }

    // Multi-part instructions
    const multiPart = content.match(STRUCTURE_PATTERNS.multiPart);
    if (multiPart) {
      score += Math.min(multiPart.length * 0.5, 2.0);
    }

    // Technical terms density
    const techTerms = content.match(STRUCTURE_PATTERNS.technicalTerms);
    if (techTerms) {
      score += Math.min(techTerms.length * 0.3, 2.0);
    }

    // Multiple questions = multiple requirements
    const questions = content.match(STRUCTURE_PATTERNS.questionMark);
    if (questions && questions.length > 2) {
      score += 1.0;
    }

    return Math.max(0, Math.min(10, score));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL 3: CONVERSATION CONTEXT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze conversation history (multi-turn context) for:
   * - Conversation depth (more turns = accumulated context = harder)
   * - Topic continuity vs topic shifts
   * - Previous escalation signals
   */
  private scoreConversationContext(request: AIRequest): number {
    let score = 0;

    const messages = request.messages ?? [];

    if (messages.length === 0) {
      // Single-turn: no conversation context to analyze
      return 1.0; // Low base — single requests are usually simpler
    }

    // Turn depth: each turn adds complexity (accumulated context)
    const turnCount = messages.length;
    if (turnCount > 10) score += 3.0;
    else if (turnCount > 5) score += 2.0;
    else if (turnCount > 2) score += 1.0;

    // Total conversation tokens (longer convos = more context to manage)
    const totalTokens = messages.reduce((sum, m) => sum + m.content.length / 4, 0);
    if (totalTokens > 10000) score += 2.0;
    else if (totalTokens > 3000) score += 1.0;

    // Topic shift detection: if the last user message is very different
    // from earlier messages, it may be a complex pivot
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length >= 2) {
      const lastMsg = userMessages[userMessages.length - 1].content.toLowerCase();
      const prevMsg = userMessages[userMessages.length - 2].content.toLowerCase();

      // Simple Jaccard similarity on word sets
      const lastWords = new Set(lastMsg.split(/\s+/).filter(w => w.length > 3));
      const prevWords = new Set(prevMsg.split(/\s+/).filter(w => w.length > 3));
      const intersection = new Set([...lastWords].filter(w => prevWords.has(w)));
      const union = new Set([...lastWords, ...prevWords]);

      const similarity = union.size > 0 ? intersection.size / union.size : 1;

      if (similarity < 0.1) {
        score += 1.5; // Major topic shift — needs reorientation
      } else if (similarity < 0.3) {
        score += 0.5; // Moderate shift
      }
    }

    // Check if previous assistant messages contained uncertainty
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const hasUncertainty = assistantMessages.some(m =>
      /\bi(?:'m| am) not sure\b|\bi don(?:'t| not) know\b|\bunclear\b/i.test(m.content)
    );
    if (hasUncertainty) {
      score += 1.5; // Previous uncertainty = harder follow-up
    }

    return Math.max(0, Math.min(10, score));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL 4: TASK METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Score based on metadata signals that indicate importance/difficulty:
   * - Agent identity (guardian = security, planner = complex)
   * - Trust level (HOSTILE = always high, SYSTEM = reliable)
   * - Priority (URGENT = user-facing)
   * - Security sensitivity flag
   * - Category pre-classification
   */
  private scoreTaskMetadata(request: AIRequest): number {
    let score = 0;

    // Security-sensitive flag is a direct complexity signal
    if (request.securitySensitive) {
      score += 4.0;
    }

    // Agent identity signals
    const agentScores: Record<string, number> = {
      guardian: 3.0,    // Guardian tasks are security-related
      planner: 2.0,     // Planning tasks need reasoning
      executor: 1.5,    // Execution may need tool-use
      memory: 1.0,      // Memory management is routine
      core: 0,          // Core is general
    };
    score += agentScores[request.agent] ?? 0;

    // Trust level — lower trust = more scrutiny needed
    const trustScores: Record<string, number> = {
      hostile: 5.0,     // HOSTILE input needs maximum analysis
      untrusted: 3.0,   // External untrusted input
      standard: 1.0,    // Normal operation
      verified: 0.5,    // Verified source
      operator: 0,      // Operator-level trust
      system: 0,        // System-level trust
    };
    score += trustScores[request.trustLevel] ?? 0;

    // Priority signals
    if (request.priority === 'URGENT') {
      score += 1.0; // User-facing requests may need higher quality
    }

    // Category pre-classification boosts
    const categoryBoosts: Record<string, number> = {
      security: 3.0,
      planning: 2.0,
      analysis: 1.5,
      code_generation: 1.5,
      code_review: 1.0,
      chat: 0,
      query: 0,
      summarize: 0.5,
      heartbeat: -2.0,
      parse_command: -1.0,
    };
    score += categoryBoosts[request.category] ?? 0;

    return Math.max(0, Math.min(10, score));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL 5: CAPABILITY REQUIREMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Score based on what model capabilities are needed:
   * - Reasoning (logical analysis, math, planning)
   * - Tool use (function calling, API interaction)
   * - Code generation (implementation, debugging)
   * - Vision (image analysis)
   * - Long context (large documents)
   *
   * More capabilities needed = more complex = needs better model.
   */
  private scoreCapabilityRequirements(content: string, category: TaskCategory): number {
    let score = 0;
    const capabilities = new Set<string>();

    // Reasoning capability
    if (/\b(?:why|because|therefore|analyze|compare|evaluate|prove|derive|calculate|solve)\b/i.test(content)) {
      capabilities.add('reasoning');
      score += 2.0;
    }

    // Tool use capability
    if (/\b(?:search|fetch|browse|call|invoke|execute|run|tool|api|webhook)\b/i.test(content)) {
      capabilities.add('tools');
      score += 1.5;
    }

    // Code capability
    if (/\b(?:code|function|class|implement|debug|compile|test|lint|refactor|typescript|javascript|python)\b/i.test(content)
        || category === 'code_generation' || category === 'code_review') {
      capabilities.add('code');
      score += 1.5;
    }

    // Vision capability
    if (/\b(?:image|screenshot|photo|diagram|chart|visual|look at this)\b/i.test(content)) {
      capabilities.add('vision');
      score += 2.0; // Vision requires specific models
    }

    // Long context
    const estimatedTokens = content.length / 4;
    if (estimatedTokens > 10000) {
      capabilities.add('long_context');
      score += 2.5;
    } else if (estimatedTokens > 3000) {
      score += 1.0;
    }

    // Multi-capability requests are harder (need models that support all)
    if (capabilities.size >= 3) {
      score += 2.0; // Significant complexity from capability intersection
    } else if (capabilities.size >= 2) {
      score += 1.0;
    }

    // Historical performance adjustment
    if (this.performanceTracker) {
      const stats = this.performanceTracker.getPerformanceStats();
      const categoryPerf = stats.categories.find(c => c.category === category);
      if (categoryPerf && categoryPerf.totalCalls >= 5) {
        // If cheap models historically fail on this category, boost score
        if (categoryPerf.avgQuality < 0.6) {
          score += 1.5; // Historically difficult category
        } else if (categoryPerf.avgQuality < 0.75) {
          score += 0.5;
        }
      }
    }

    return Math.max(0, Math.min(10, score));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL 6: AMBIGUITY DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Detect ambiguity in the request. Ambiguous requests are harder because
   * the model must infer intent, which requires higher intelligence.
   *
   * Higher score = more ambiguous = needs better model to interpret correctly.
   */
  private scoreAmbiguity(content: string): number {
    let score = 2.0; // Baseline ambiguity (most requests have some)

    // Check ambiguity patterns
    for (const { pattern, weight } of AMBIGUITY_PATTERNS) {
      if (pattern.test(content)) {
        score += weight;
      }
    }

    // Very short requests with no context are highly ambiguous
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount <= 3) {
      score += 2.0; // "Fix this" or "Make it work" — extremely ambiguous
    } else if (wordCount <= 8) {
      score += 1.0; // Still pretty vague
    } else if (wordCount > 50) {
      score -= 1.0; // Detailed requests are less ambiguous
    }

    // Pronoun density (lots of "it", "this", "that" without clear referents)
    const pronounCount = (content.match(/\b(?:it|this|that|these|those|them)\b/gi) ?? []).length;
    const pronounDensity = wordCount > 0 ? pronounCount / wordCount : 0;
    if (pronounDensity > 0.15) {
      score += 1.5; // High pronoun density = vague references
    } else if (pronounDensity > 0.08) {
      score += 0.5;
    }

    // Lack of specificity: no file names, no function names, no clear target
    const hasSpecificTarget = /\b[\w]+\.(?:ts|js|py|rs|go|java|cpp|h)\b/.test(content)
      || /\b(?:function|class|method|variable|constant)\s+\w+/i.test(content)
      || /`\w+`/.test(content); // Backtick-quoted identifiers

    if (!hasSpecificTarget && wordCount > 5) {
      score += 1.0; // No specific target referenced
    }

    return Math.max(0, Math.min(10, score));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Detect the best task category from content, potentially overriding
   * the caller's pre-classification.
   */
  private detectCategory(content: string, callerCategory: TaskCategory): TaskCategory {
    let bestCategory = callerCategory;
    let bestWeight = 0;

    for (const { category, patterns, weight } of CATEGORY_PATTERNS) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          if (weight > bestWeight) {
            bestCategory = category;
            bestWeight = weight;
          }
          break; // Only count first match per category
        }
      }
    }

    // Security detection always overrides (safety-critical)
    const lowerContent = content.toLowerCase();
    if (/\b(?:vulnerability|exploit|injection|xss|csrf|attack|penetration)\b/.test(lowerContent)) {
      return 'security';
    }

    // If caller provided a specific category and we're not confident, keep theirs
    if (bestWeight < 2 && callerCategory !== 'query' && callerCategory !== 'chat') {
      return callerCategory;
    }

    return bestCategory;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERACTION EFFECTS (Research: RouteLLM ICLR 2025, FrugalGPT)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Apply interaction effects — correlated signals amplify each other.
   *
   * Hard gates override the weighted score for safety-critical cases.
   * Interaction boosts capture signal correlations missed by linear weighting.
   *
   * From research: domain specificity + syntactic complexity correlates
   * much more strongly with model difficulty than either signal alone.
   */
  private applyInteractionEffects(
    baseScore: number,
    signals: SignalScores,
    request: AIRequest,
  ): number {
    let score = baseScore;

    // ── Hard Gate 1: Security domain = minimum "complex" ──
    // Security misclassification has real consequences; always err on the side of caution
    if (
      request.securitySensitive ||
      request.category === 'security' ||
      signals.taskMetadata >= 7
    ) {
      score = Math.max(score, 5.0);
    }

    // ── Hard Gate 2: Very short conversational = trivial regardless ──
    const wordCount = request.content.split(/\s+/).filter(w => w.length > 0).length;
    if (
      wordCount <= 5 &&
      !request.securitySensitive &&
      request.category !== 'security' &&
      signals.contentAnalysis < 3 &&
      signals.taskMetadata < 3
    ) {
      score = Math.min(score, 2.0);
    }

    // ── Hard Gate 3: Heartbeat = always trivial ──
    if (request.category === 'heartbeat') {
      return Math.min(score, 1.0);
    }

    // ── Interaction 1: High domain + high structural = much harder ──
    // Complex vocabulary in a well-structured multi-part request indicates
    // a sophisticated user with a genuinely complex task
    if (signals.contentAnalysis > 5 && signals.structuralAnalysis > 4) {
      score += 0.8;
    }

    // ── Interaction 2: Multi-turn + high content = accumulated complexity ──
    // Long conversations about complex topics compound difficulty
    if (signals.conversationContext > 3 && signals.contentAnalysis > 5) {
      score += 0.6;
    }

    // ── Interaction 3: High ambiguity + high context dependency = very hard ──
    // Model must infer a lot from vague input AND conversation context
    if (signals.ambiguityPenalty > 5 && signals.conversationContext > 4) {
      score += 0.5;
    }

    // ── Interaction 4: Multiple capabilities + high domain = needs top model ──
    if (signals.capabilityRequirements > 5 && signals.contentAnalysis > 5) {
      score += 0.5;
    }

    return Math.max(0, Math.min(10, score));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORING HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Map a composite score (0-10) to a TaskComplexity level.
   */
  private scoreToComplexity(score: number): TaskComplexity {
    if (score < 1.5) return 'trivial';
    if (score < 3.0) return 'simple';
    if (score < 5.0) return 'standard';
    if (score < 7.5) return 'complex';
    return 'critical';
  }

  /**
   * Calculate classification confidence based on signal agreement.
   * If all signals point in the same direction, confidence is high.
   * If signals disagree (some say simple, some say complex), confidence is low.
   */
  private calculateConfidence(signals: SignalScores): number {
    const values = [
      signals.contentAnalysis,
      signals.structuralAnalysis,
      signals.conversationContext,
      signals.taskMetadata,
      signals.capabilityRequirements,
      signals.ambiguityPenalty,
    ];

    // Standard deviation — low deviation = high agreement = high confidence
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Map stdDev to confidence: 0 stdDev → 1.0 confidence, 4+ stdDev → 0.3 confidence
    const confidence = Math.max(0.3, 1.0 - (stdDev / 5));

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Map complexity + category to a suggested cascade chain.
   */
  private complexityToChain(
    complexity: TaskComplexity,
    category: TaskCategory,
    securitySensitive: boolean,
  ): string {
    if (securitySensitive) return 'security';
    if (complexity === 'critical') return 'quality';

    const categoryChainMap: Record<string, string> = {
      code_generation: 'code',
      code_review: 'code',
      security: 'security',
      analysis: 'reasoning',
      planning: 'reasoning',
      summarize: 'creative',
      heartbeat: 'bulk',
      parse_command: 'bulk',
      chat: 'frugal',
      query: 'frugal',
    };

    const baseChain = categoryChainMap[category] ?? 'frugal';

    // Upgrade chain based on complexity
    if (complexity === 'complex' && baseChain === 'frugal') {
      return 'balanced';
    }

    return baseChain;
  }

  /**
   * Build a human-readable reasoning string for observability.
   */
  private buildReasoning(
    signals: SignalScores,
    compositeScore: number,
    complexity: TaskComplexity,
    confidence: number,
  ): string {
    const parts: string[] = [];

    parts.push(`Composite: ${compositeScore.toFixed(2)}/10 → ${complexity}`);
    parts.push(`Confidence: ${(confidence * 100).toFixed(0)}%`);

    const signalNames: Array<[string, number]> = [
      ['Content', signals.contentAnalysis],
      ['Structure', signals.structuralAnalysis],
      ['Context', signals.conversationContext],
      ['Metadata', signals.taskMetadata],
      ['Capabilities', signals.capabilityRequirements],
      ['Ambiguity', signals.ambiguityPenalty],
    ];

    // Only mention signals that significantly contributed
    const significant = signalNames.filter(([, score]) => score >= 3.0);
    if (significant.length > 0) {
      const signalStr = significant
        .map(([name, score]) => `${name}:${score.toFixed(1)}`)
        .join(', ');
      parts.push(`Key signals: ${signalStr}`);
    }

    return parts.join(' | ');
  }

  /**
   * Get the full content from a request, including conversation messages.
   */
  private getFullContent(request: AIRequest): string {
    const parts: string[] = [request.content];

    // Include the last user message from conversation history
    if (request.messages && request.messages.length > 0) {
      const lastUserMsg = [...request.messages]
        .reverse()
        .find(m => m.role === 'user');
      if (lastUserMsg && lastUserMsg.content !== request.content) {
        parts.push(lastUserMsg.content);
      }
    }

    return parts.join('\n');
  }
}
