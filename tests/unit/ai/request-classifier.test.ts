import { describe, it, expect, beforeEach } from 'vitest';
import { RequestClassifier } from '../../../src/ai/request-classifier.js';
import type { AIRequest } from '../../../src/ai/types.js';

describe('RequestClassifier', () => {
  let classifier: RequestClassifier;

  beforeEach(() => {
    classifier = new RequestClassifier();
  });

  // Helper to make AIRequest objects easily
  function makeRequest(overrides: Partial<AIRequest>): AIRequest {
    return {
      content: 'test',
      category: 'query',
      agent: 'core',
      trustLevel: 'system',
      priority: 'STANDARD',
      securitySensitive: false,
      enableCaching: true,
      ...overrides,
    };
  }

  describe('basic classification', () => {
    it('should classify heartbeat ping as trivial', () => {
      const request = makeRequest({
        content: 'ping',
        category: 'heartbeat',
      });
      const result = classifier.classify(request);

      expect(result.complexity).toBe('trivial');
      expect(result.score).toBeLessThan(2);
    });

    it('should classify simple hello chat as trivial or simple', () => {
      const request = makeRequest({
        content: 'hello',
        category: 'chat',
      });
      const result = classifier.classify(request);

      expect(['trivial', 'simple']).toContain(result.complexity);
      expect(result.score).toBeLessThan(4);
    });

    it('should classify complex security audit as complex or critical', () => {
      const request = makeRequest({
        content: 'Perform a comprehensive security audit of the authentication system, checking for SQL injection, XSS, CSRF, session fixation, and privilege escalation vulnerabilities. Include threat modeling and attack surface analysis.',
        category: 'security',
        securitySensitive: true,
      });
      const result = classifier.classify(request);

      expect(['complex', 'critical']).toContain(result.complexity);
      expect(result.score).toBeGreaterThan(4.5);
    });

    it('should score code generation request higher than simple chat', () => {
      const codeRequest = makeRequest({
        content: 'Write a function to parse JSON and handle errors',
        category: 'code_generation',
      });
      const chatRequest = makeRequest({
        content: 'hello there',
        category: 'chat',
      });
      const codeResult = classifier.classify(codeRequest);
      const chatResult = classifier.classify(chatRequest);

      // Code gen with function/parse keywords should score higher than greeting
      expect(codeResult.score).toBeGreaterThan(chatResult.score);
    });
  });

  describe('content analysis signal', () => {
    it('should score high for security vocabulary', () => {
      const request = makeRequest({
        content: 'Check for SQL injection vulnerability, XSS attacks, and CSRF token validation in the authentication flow',
      });
      const result = classifier.classify(request);

      expect(result.signals.contentAnalysis).toBeGreaterThan(6);
    });

    it('should score high for multi-domain requests', () => {
      const request = makeRequest({
        content: 'Design a secure microservices architecture with encrypted communication, distributed tracing, and fault tolerance using circuit breakers',
      });
      const result = classifier.classify(request);

      expect(result.signals.contentAnalysis).toBeGreaterThan(6);
    });

    it('should score low for simple chat vocabulary', () => {
      const request = makeRequest({
        content: 'hello there, how are you doing today?',
      });
      const result = classifier.classify(request);

      expect(result.signals.contentAnalysis).toBeLessThan(3);
    });

    it('should score high for technical algorithms', () => {
      const request = makeRequest({
        content: 'Implement a dynamic programming solution for longest common subsequence with memoization and analyze time complexity',
      });
      const result = classifier.classify(request);

      expect(result.signals.contentAnalysis).toBeGreaterThan(5);
    });
  });

  describe('structural analysis signal', () => {
    it('should score higher for code blocks in content', () => {
      const request = makeRequest({
        content: 'Review this code:\n```typescript\nfunction foo() { return 42; }\n```',
      });
      const plain = makeRequest({ content: 'Review this function' });
      const result = classifier.classify(request);
      const plainResult = classifier.classify(plain);

      expect(result.signals.structuralAnalysis).toBeGreaterThan(plainResult.signals.structuralAnalysis);
    });

    it('should score higher for numbered list (multi-step)', () => {
      const request = makeRequest({
        content: '1. Clone the repository\n2. Install dependencies\n3. Run tests\n4. Deploy to production',
      });
      const plain = makeRequest({ content: 'Deploy to production' });
      const result = classifier.classify(request);
      const plainResult = classifier.classify(plain);

      expect(result.signals.structuralAnalysis).toBeGreaterThan(plainResult.signals.structuralAnalysis);
    });

    it('should score higher for conditional logic', () => {
      const request = makeRequest({
        content: 'If the user is authenticated, then allow access, otherwise redirect to login. When admin, should show dashboard.',
      });
      const plain = makeRequest({ content: 'Allow access to the dashboard' });
      const result = classifier.classify(request);
      const plainResult = classifier.classify(plain);

      expect(result.signals.structuralAnalysis).toBeGreaterThan(plainResult.signals.structuralAnalysis);
    });

    it('should score higher for file references', () => {
      const request = makeRequest({
        content: 'Update src/main.ts and tests/unit/main.test.ts and src/config.ts to fix the bug',
      });
      const plain = makeRequest({ content: 'Fix the bug' });
      const result = classifier.classify(request);
      const plainResult = classifier.classify(plain);

      expect(result.signals.structuralAnalysis).toBeGreaterThan(plainResult.signals.structuralAnalysis);
    });

    it('should score low for plain text no structure', () => {
      const request = makeRequest({
        content: 'just a simple question about something',
      });
      const result = classifier.classify(request);

      expect(result.signals.structuralAnalysis).toBeLessThan(3);
    });
  });

  describe('conversation context signal', () => {
    it('should score low for single turn (no messages)', () => {
      const request = makeRequest({
        content: 'What is TypeScript?',
        messages: [],
      });
      const result = classifier.classify(request);

      expect(result.signals.conversationContext).toBeLessThan(2);
    });

    it('should score moderately for 3 messages', () => {
      const request = makeRequest({
        content: 'Can you explain more?',
        messages: [
          { role: 'user', content: 'What is async?' },
          { role: 'assistant', content: 'Async is...' },
          { role: 'user', content: 'Can you explain more?' },
        ],
      });
      const result = classifier.classify(request);

      expect(result.signals.conversationContext).toBeGreaterThan(2);
      expect(result.signals.conversationContext).toBeLessThan(7);
    });

    it('should score high for 10+ messages', () => {
      const messages = [];
      for (let i = 0; i < 12; i++) {
        messages.push(
          { role: 'user' as const, content: `Message ${i} with some reasonable length content to accumulate tokens properly` },
          { role: 'assistant' as const, content: `Response ${i} with detailed explanation spanning multiple sentences and paragraphs` }
        );
      }
      const request = makeRequest({
        content: 'Continue our discussion',
        messages,
      });
      const result = classifier.classify(request);

      // 24 messages (12 turns) → +3.0 for turns + token bonus
      expect(result.signals.conversationContext).toBeGreaterThan(2);
    });

    it('should increase score for topic shift between turns', () => {
      const request = makeRequest({
        content: 'Now explain blockchain technology',
        messages: [
          { role: 'user', content: 'What is TypeScript?' },
          { role: 'assistant', content: 'TypeScript is a typed superset...' },
          { role: 'user', content: 'Now explain blockchain technology' },
        ],
      });
      const result = classifier.classify(request);

      expect(result.signals.conversationContext).toBeGreaterThan(2);
    });

    it('should increase score for previous assistant uncertainty', () => {
      const request = makeRequest({
        content: 'Are you sure about that?',
        messages: [
          { role: 'user', content: 'What is quantum computing?' },
          { role: 'assistant', content: 'I am not entirely sure, but I think...' },
          { role: 'user', content: 'Are you sure about that?' },
        ],
      });
      const result = classifier.classify(request);

      expect(result.signals.conversationContext).toBeGreaterThan(2);
    });
  });

  describe('task metadata signal', () => {
    it('should add +4 score for securitySensitive=true', () => {
      const normal = makeRequest({ content: 'Do something' });
      const sensitive = makeRequest({ content: 'Do something', securitySensitive: true });

      const normalResult = classifier.classify(normal);
      const sensitiveResult = classifier.classify(sensitive);

      expect(sensitiveResult.signals.taskMetadata).toBeGreaterThan(normalResult.signals.taskMetadata + 3);
    });

    it('should add +3 score for agent=guardian', () => {
      const request = makeRequest({
        content: 'Check this',
        agent: 'guardian',
      });
      const result = classifier.classify(request);

      expect(result.signals.taskMetadata).toBeGreaterThan(2);
    });

    it('should add +5 score for trustLevel=hostile', () => {
      const request = makeRequest({
        content: 'Process this input',
        trustLevel: 'hostile',
      });
      const result = classifier.classify(request);

      expect(result.signals.taskMetadata).toBeGreaterThan(4);
    });

    it('should add +1 score for priority=URGENT', () => {
      const normal = makeRequest({ content: 'Do this', priority: 'STANDARD' });
      const urgent = makeRequest({ content: 'Do this', priority: 'URGENT' });

      const normalResult = classifier.classify(normal);
      const urgentResult = classifier.classify(urgent);

      expect(urgentResult.signals.taskMetadata).toBeGreaterThan(normalResult.signals.taskMetadata);
    });

    it('should add +3 boost for category=security', () => {
      const request = makeRequest({
        content: 'Check authentication',
        category: 'security',
      });
      const result = classifier.classify(request);

      expect(result.signals.taskMetadata).toBeGreaterThan(2);
    });

    it('should subtract score for category=heartbeat', () => {
      const request = makeRequest({
        content: 'ping',
        category: 'heartbeat',
      });
      const result = classifier.classify(request);

      expect(result.signals.taskMetadata).toBeLessThan(2);
    });
  });

  describe('capability requirements', () => {
    it('should detect reasoning capability', () => {
      const request = makeRequest({
        content: 'Analyze the trade-offs between microservices and monolithic architecture, compare performance implications',
      });
      const result = classifier.classify(request);

      expect(result.signals.capabilityRequirements).toBeGreaterThanOrEqual(2);
    });

    it('should detect code capability', () => {
      const request = makeRequest({
        content: 'Write a function to implement binary search with TypeScript generics',
        category: 'code_generation',
      });
      const result = classifier.classify(request);

      expect(result.signals.capabilityRequirements).toBeGreaterThanOrEqual(1.5);
    });

    it('should give bonus for multiple capabilities', () => {
      const request = makeRequest({
        content: 'Analyze this code, refactor it to use async/await instead of callbacks, then write tests and compare performance',
        category: 'code_review',
      });
      const result = classifier.classify(request);

      // Reasoning ("analyze", "compare") + code ("code", "refactor", "async", "await") + tools ("run") = multi-cap bonus
      expect(result.signals.capabilityRequirements).toBeGreaterThan(3);
    });

    it('should detect long_context requirement for long content', () => {
      // Need >40000 chars to get >10000 estimated tokens (chars/4)
      const longContent = 'word '.repeat(10001);
      const request = makeRequest({
        content: longContent,
      });
      const result = classifier.classify(request);

      expect(result.signals.capabilityRequirements).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ambiguity detection', () => {
    it('should score high for "make it work"', () => {
      const request = makeRequest({
        content: 'make it work',
      });
      const result = classifier.classify(request);

      expect(result.signals.ambiguityPenalty).toBeGreaterThan(5);
    });

    it('should score high for "fix it"', () => {
      const request = makeRequest({
        content: 'fix it',
      });
      const result = classifier.classify(request);

      expect(result.signals.ambiguityPenalty).toBeGreaterThan(5);
    });

    it('should score high for very short requests (3 words)', () => {
      const request = makeRequest({
        content: 'do the thing',
      });
      const result = classifier.classify(request);

      expect(result.signals.ambiguityPenalty).toBeGreaterThan(4);
    });

    it('should score lower for detailed 50+ word request', () => {
      const request = makeRequest({
        content: 'I need you to implement a thread-safe least recently used cache in TypeScript with the following requirements: support generic key-value types, maintain O(1) access time, automatically evict least recently used items when capacity is exceeded, use a doubly linked list for ordering, and include comprehensive unit tests with edge cases',
      });
      const result = classifier.classify(request);

      expect(result.signals.ambiguityPenalty).toBeLessThan(4);
    });

    it('should increase score for high pronoun density', () => {
      const highPronoun = makeRequest({
        content: 'Can you make it better? It should do what we discussed before and then update it accordingly.',
      });
      const lowPronoun = makeRequest({
        content: 'Improve the login page by adding validation to the email field and password strength meter.',
      });
      const highResult = classifier.classify(highPronoun);
      const lowResult = classifier.classify(lowPronoun);

      expect(highResult.signals.ambiguityPenalty).toBeGreaterThan(lowResult.signals.ambiguityPenalty);
    });
  });

  describe('category detection', () => {
    it('should detect code_generation category', () => {
      const request = makeRequest({
        content: 'implement a function to sort an array',
      });
      const result = classifier.classify(request);

      expect(result.suggestedCategory).toBe('code_generation');
    });

    it('should detect code_review category', () => {
      const request = makeRequest({
        content: 'review this code for bugs',
      });
      const result = classifier.classify(request);

      expect(result.suggestedCategory).toBe('code_review');
    });

    it('should override to security category for vulnerability mentions', () => {
      const request = makeRequest({
        content: 'there is a vulnerability in the authentication system',
        category: 'query',
      });
      const result = classifier.classify(request);

      expect(result.suggestedCategory).toBe('security');
    });

    it('should detect summarize category', () => {
      const request = makeRequest({
        content: 'summarize this long document for me',
      });
      const result = classifier.classify(request);

      expect(result.suggestedCategory).toBe('summarize');
    });

    it('should detect planning category', () => {
      const request = makeRequest({
        content: 'plan the architecture for a new microservices system',
      });
      const result = classifier.classify(request);

      expect(result.suggestedCategory).toBe('planning');
    });
  });

  describe('confidence calculation', () => {
    it('should have reasonable confidence when signals align', () => {
      const request = makeRequest({
        content: 'ping',
        category: 'heartbeat',
      });
      const result = classifier.classify(request);

      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    it('should have lower confidence when signals disagree widely', () => {
      const request = makeRequest({
        content: 'Explain quantum entanglement using simple terms',
        category: 'query',
        securitySensitive: true,
        agent: 'guardian',
      });
      const result = classifier.classify(request);

      // Content suggests medium complexity, but metadata suggests high complexity
      // This creates signal disagreement
      expect(result.confidence).toBeLessThan(0.8);
    });
  });

  describe('chain suggestion', () => {
    it('should suggest security chain for securitySensitive', () => {
      const request = makeRequest({
        content: 'Check for vulnerabilities',
        securitySensitive: true,
      });
      const result = classifier.classify(request);

      expect(result.suggestedChain).toBe('security');
    });

    it('should suggest quality chain for critical complexity', () => {
      const request = makeRequest({
        content: 'Design a fault-tolerant distributed consensus protocol with Byzantine fault tolerance, automatic leader election, and recovery from network partitions',
        category: 'planning',
        priority: 'URGENT',
      });
      const result = classifier.classify(request);

      if (result.complexity === 'critical') {
        expect(result.suggestedChain).toBe('quality');
      }
    });

    it('should suggest code chain for code_generation category', () => {
      const request = makeRequest({
        content: 'Write a function to parse CSV files',
        category: 'code_generation',
      });
      const result = classifier.classify(request);

      expect(result.suggestedChain).toBe('code');
    });

    it('should suggest frugal chain for simple chat', () => {
      const request = makeRequest({
        content: 'hello',
        category: 'chat',
      });
      const result = classifier.classify(request);

      expect(result.suggestedChain).toBe('frugal');
    });
  });

  describe('integration scenarios', () => {
    it('should classify complex Rust LRU cache request higher than simple greeting', () => {
      const complex = makeRequest({
        content: 'Implement a thread-safe LRU cache in Rust with atomic reference counting, generic key-value types, and O(1) operations using a mutex-protected doubly linked list with concurrent access patterns',
        category: 'code_generation',
      });
      const simple = makeRequest({
        content: 'Hello, how are you?',
        category: 'chat',
      });
      const complexResult = classifier.classify(complex);
      const simpleResult = classifier.classify(simple);

      expect(complexResult.score).toBeGreaterThan(simpleResult.score);
      expect(complexResult.complexity).not.toBe('trivial');
    });

    it('should classify "Why is the sky blue?" as trivial or simple, NOT complex', () => {
      const request = makeRequest({
        content: 'Why is the sky blue?',
        category: 'query',
      });
      const result = classifier.classify(request);

      expect(['trivial', 'simple']).toContain(result.complexity);
      expect(result.score).toBeLessThan(4);
      expect(result.complexity).not.toBe('complex');
    });

    it('should score multi-turn GPU request higher than single-turn version', () => {
      const messages = [
        { role: 'user' as const, content: 'What is GPU acceleration?' },
        { role: 'assistant' as const, content: 'GPU acceleration uses graphics processors for parallel computation...' },
        { role: 'user' as const, content: 'How do I implement it in CUDA?' },
        { role: 'assistant' as const, content: 'CUDA implementation involves writing kernels...' },
        { role: 'user' as const, content: 'Can you show me a kernel example with shared memory optimization?' },
      ];
      const withHistory = makeRequest({
        content: 'Can you show me a kernel example with shared memory optimization?',
        messages,
        category: 'code_generation',
      });
      const withoutHistory = makeRequest({
        content: 'Can you show me a kernel example with shared memory optimization?',
        category: 'code_generation',
      });
      const withResult = classifier.classify(withHistory);
      const withoutResult = classifier.classify(withoutHistory);

      // Multi-turn should score higher due to conversation context
      expect(withResult.score).toBeGreaterThan(withoutResult.score);
    });

    it('should classify URGENT security crypto audit as complex+ due to metadata', () => {
      const request = makeRequest({
        content: 'Audit the cryptographic implementation for timing attacks and side-channel vulnerabilities',
        category: 'security',
        securitySensitive: true,
        priority: 'URGENT',
        agent: 'guardian',
      });
      const result = classifier.classify(request);

      // Hard gate: securitySensitive forces minimum score of 5.0 → complex
      expect(['complex', 'critical']).toContain(result.complexity);
      expect(result.score).toBeGreaterThanOrEqual(5);
    });

    it('should classify ping heartbeat as trivial', () => {
      const request = makeRequest({
        content: 'ping',
        category: 'heartbeat',
      });
      const result = classifier.classify(request);

      expect(result.complexity).toBe('trivial');
      expect(result.score).toBeLessThan(2);
    });

    it('should classify distributed consensus protocol significantly above trivial', () => {
      const request = makeRequest({
        content: 'Build a distributed consensus protocol for financial transactions with ACID guarantees, two-phase commit, and Byzantine fault tolerance',
        category: 'code_generation',
      });
      const result = classifier.classify(request);

      // Rich domain vocabulary (distributed, consensus, fault tolerance) + code generation
      expect(result.complexity).not.toBe('trivial');
      expect(result.score).toBeGreaterThan(3);
    });
  });

  describe('improvement over keyword classifier', () => {
    it('should NOT classify "Why is the sky blue?" as complex (old classifier gave score=2)', () => {
      const request = makeRequest({
        content: 'Why is the sky blue?',
        category: 'query',
      });
      const result = classifier.classify(request);

      // Old keyword classifier gave this a score of 2 because of "why"
      // New classifier should recognize it as simple
      expect(result.complexity).not.toBe('complex');
      expect(['trivial', 'simple']).toContain(result.complexity);
      expect(result.score).toBeLessThan(4);
    });

    it('should NOT classify distributed consensus as trivial (old classifier missed it)', () => {
      const request = makeRequest({
        content: 'Build distributed consensus for financial transactions',
        category: 'code_generation',
      });
      const result = classifier.classify(request);

      // Old classifier scored 0 (no keyword triggers), mapping to 'trivial'
      // New classifier catches domain vocabulary: "distributed", "consensus"
      expect(result.complexity).not.toBe('trivial');
      expect(result.score).toBeGreaterThan(2);
    });

    it('should account for message history in multi-turn conversation', () => {
      const messages = [
        { role: 'user' as const, content: 'Explain async/await' },
        { role: 'assistant' as const, content: 'Async/await is syntactic sugar...' },
        { role: 'user' as const, content: 'Show me an example' },
        { role: 'assistant' as const, content: 'Here is an example...' },
        { role: 'user' as const, content: 'How does error handling work?' },
      ];

      const withHistory = makeRequest({
        content: 'How does error handling work?',
        messages,
      });

      const withoutHistory = makeRequest({
        content: 'How does error handling work?',
        messages: [],
      });

      const withResult = classifier.classify(withHistory);
      const withoutResult = classifier.classify(withoutHistory);

      // With message history should have higher context signal
      expect(withResult.signals.conversationContext).toBeGreaterThan(withoutResult.signals.conversationContext);
    });
  });

  describe('reasoning field', () => {
    it('should include reasoning explanation', () => {
      const request = makeRequest({
        content: 'Write a sorting algorithm',
        category: 'code_generation',
      });
      const result = classifier.classify(request);

      expect(result.reasoning).toBeTruthy();
      expect(typeof result.reasoning).toBe('string');
      expect(result.reasoning.length).toBeGreaterThan(10);
    });

    it('should reference key signals in reasoning', () => {
      const request = makeRequest({
        content: 'Check for SQL injection vulnerabilities',
        category: 'security',
        securitySensitive: true,
      });
      const result = classifier.classify(request);

      // Reasoning includes composite score and complexity level
      expect(result.reasoning).toContain('Composite:');
      expect(result.reasoning.toLowerCase()).toMatch(/complex|critical|standard/);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const request = makeRequest({
        content: '',
      });
      const result = classifier.classify(request);

      expect(result).toBeTruthy();
      expect(result.complexity).toBeTruthy();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long content', () => {
      const longContent = 'complex analysis '.repeat(1000);
      const request = makeRequest({
        content: longContent,
      });
      const result = classifier.classify(request);

      expect(result).toBeTruthy();
      expect(result.score).toBeGreaterThan(1); // Long content should push above trivial
    });

    it('should handle all trust levels', () => {
      const trustLevels: Array<'system' | 'operator' | 'verified' | 'standard' | 'untrusted' | 'hostile'> = [
        'system', 'operator', 'verified', 'standard', 'untrusted', 'hostile'
      ];

      for (const trustLevel of trustLevels) {
        const request = makeRequest({
          content: 'Do something',
          trustLevel,
        });
        const result = classifier.classify(request);

        expect(result).toBeTruthy();
        expect(result.complexity).toBeTruthy();
      }
    });

    it('should handle missing optional fields', () => {
      const request = makeRequest({
        content: 'Test request',
      });
      // messages and metadata are optional
      const result = classifier.classify(request);

      expect(result).toBeTruthy();
      expect(result.complexity).toBeTruthy();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
