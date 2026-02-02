import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextLayerManager, type Session } from '../../../src/system/context-layers.js';
import { EventBus } from '../../../src/kernel/event-bus.js';
import { MemoryManager } from '../../../src/agents/memory-manager.js';
import { LearningMachine } from '../../../src/agents/learning-machine.js';
import { AuditLogger } from '../../../src/kernel/audit.js';
import type { Message } from '../../../src/kernel/types.js';

describe('ContextLayerManager', () => {
  let contextLayerManager: ContextLayerManager;
  let eventBus: EventBus;
  let auditLogger: AuditLogger;
  let memoryManager: MemoryManager;
  let learningMachine: LearningMachine;

  function createSession(overrides: Partial<Session> = {}): Session {
    return {
      id: `session-${Math.random().toString(36).slice(2)}`,
      trustLevel: 'operator',
      startedAt: new Date(),
      ...overrides,
    };
  }

  function createMessage(overrides: Partial<Message> = {}): Message {
    return {
      id: `msg-${Math.random().toString(36).slice(2)}`,
      content: 'Test message content',
      source: 'operator',
      timestamp: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    eventBus = new EventBus();
    auditLogger = new AuditLogger('/tmp/test-audit.json');
    memoryManager = new MemoryManager(auditLogger, eventBus);
    learningMachine = new LearningMachine(memoryManager, eventBus);
    contextLayerManager = new ContextLayerManager(eventBus, memoryManager, learningMachine);
  });

  describe('loadSchemaContext', () => {
    it('should load schema context with all types', async () => {
      const layer = await contextLayerManager.loadSchemaContext();

      expect(layer.id).toBe(1);
      expect(layer.name).toBe('schema');
      expect(layer.priority).toBe(100);
      expect(layer.content.trustLevels).toContain('system');
      expect(layer.content.permissionTiers).toContain('ADMIN');
      expect(layer.content.memoryTypes).toContain('FACT');
      expect(layer.content.memoryPartitions).toContain('INTERNAL');
      expect(layer.content.agentIds).toBeDefined();
    });
  });

  describe('loadAnnotations', () => {
    it('should return empty annotations when no memory manager', async () => {
      const manager = new ContextLayerManager(eventBus);
      const layer = await manager.loadAnnotations();

      expect(layer.id).toBe(2);
      expect(layer.name).toBe('annotations');
      expect(layer.content.annotations).toEqual([]);
    });

    it('should load annotations from memory manager', async () => {
      // Store a preference
      await memoryManager.store({
        type: 'PREFERENCE',
        content: 'Use TypeScript strict mode',
        provenance: {
          source: 'user',
          trust_level: 'operator',
          agent: 'core',
          chain: [],
        },
        confidence: 0.8,
        partition: 'INTERNAL',
      });

      const layer = await contextLayerManager.loadAnnotations();

      expect(layer.id).toBe(2);
      expect(layer.name).toBe('annotations');
      expect(layer.size).toBeGreaterThan(0);
    });
  });

  describe('loadPatterns', () => {
    it('should return empty patterns when no learning machine', async () => {
      const manager = new ContextLayerManager(eventBus);
      const layer = await manager.loadPatterns('test context');

      expect(layer.id).toBe(3);
      expect(layer.name).toBe('patterns');
      expect(layer.content.patterns).toEqual([]);
    });

    it('should load patterns from learning machine', async () => {
      // Add a pattern
      await learningMachine.observe({
        id: 'test-1',
        type: 'task_completed',
        success: true,
        agent: 'executor',
        taskDescription: 'TypeScript compilation',
        steps: ['tsc --build'],
      });

      const layer = await contextLayerManager.loadPatterns('TypeScript');

      expect(layer.id).toBe(3);
      expect(layer.name).toBe('patterns');
      // Pattern should be found
    });
  });

  describe('loadKnowledge', () => {
    it('should return placeholder for knowledge layer', async () => {
      const layer = await contextLayerManager.loadKnowledge('test query');

      expect(layer.id).toBe(4);
      expect(layer.name).toBe('knowledge');
      expect(layer.content.query).toBe('test query');
      expect(layer.content.documents).toEqual([]);
    });
  });

  describe('loadLearnings', () => {
    it('should return empty learnings when no memory manager', async () => {
      const manager = new ContextLayerManager(eventBus);
      const layer = await manager.loadLearnings();

      expect(layer.id).toBe(5);
      expect(layer.name).toBe('learnings');
      expect(layer.content.learnings).toEqual([]);
    });
  });

  describe('loadRuntimeContext', () => {
    it('should load runtime context from session', () => {
      const session = createSession({
        id: 'test-session',
        contextId: 'test-context',
        trustLevel: 'operator',
        activeTasks: ['task1', 'task2'],
        recentDecisions: [{ action: 'approve', timestamp: new Date() }],
      });

      const layer = contextLayerManager.loadRuntimeContext(session);

      expect(layer.id).toBe(6);
      expect(layer.name).toBe('runtime');
      expect(layer.priority).toBe(50);
      expect(layer.content.sessionId).toBe('test-session');
      expect(layer.content.contextId).toBe('test-context');
      expect(layer.content.trustLevel).toBe('operator');
      expect(layer.content.activeTasks).toHaveLength(2);
    });
  });

  describe('buildContext', () => {
    it('should build layered context with all layers', async () => {
      const message = createMessage({ content: 'Test query for context' });
      const session = createSession();

      const context = await contextLayerManager.buildContext(message, session);

      expect(context.depth).toBeGreaterThan(0);
      expect(context.layers).toBeDefined();
      expect(context.activeContext).toBeDefined();
      expect(context.totalSize).toBeGreaterThanOrEqual(0);
    });

    it('should emit context:loaded event', async () => {
      const loadedHandler = vi.fn();
      eventBus.on('context:loaded', loadedHandler);

      const message = createMessage();
      const session = createSession({ contextId: 'test-context' });

      await contextLayerManager.buildContext(message, session);

      expect(loadedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'test-context',
          depth: expect.any(Number),
        })
      );
    });

    it('should always include schema and runtime layers', async () => {
      const message = createMessage({ content: 'xyz123abc' }); // Unlikely to match anything
      const session = createSession();

      const context = await contextLayerManager.buildContext(message, session);

      const schemaLayer = context.layers.find(l => l.name === 'schema');
      const runtimeLayer = context.layers.find(l => l.name === 'runtime');

      expect(schemaLayer).toBeDefined();
      expect(runtimeLayer).toBeDefined();
    });

    it('should filter irrelevant content', async () => {
      // Add a pattern about TypeScript
      await learningMachine.observe({
        id: 'ts-pattern',
        type: 'task_completed',
        success: true,
        agent: 'executor',
        taskDescription: 'TypeScript compilation error fix',
        steps: [],
      });

      // Query about something completely different
      const message = createMessage({ content: 'Python machine learning' });
      const session = createSession();

      const context = await contextLayerManager.buildContext(message, session);

      // The TypeScript pattern should be filtered out or have low relevance
      const patternsLayer = context.layers.find(l => l.name === 'patterns');
      // Either filtered out or empty
      expect(patternsLayer?.size === 0 || patternsLayer === undefined).toBe(true);
    });
  });

  describe('getLayer', () => {
    it('should return specific layer by name', async () => {
      const schemaLayer = await contextLayerManager.getLayer('schema');
      expect(schemaLayer?.name).toBe('schema');

      const annotationsLayer = await contextLayerManager.getLayer('annotations');
      expect(annotationsLayer?.name).toBe('annotations');
    });

    it('should return null for unknown layer', async () => {
      const unknownLayer = await contextLayerManager.getLayer('unknown');
      expect(unknownLayer).toBeNull();
    });

    it('should return null for runtime layer without session', async () => {
      const runtimeLayer = await contextLayerManager.getLayer('runtime');
      expect(runtimeLayer).toBeNull();
    });

    it('should return runtime layer with session', async () => {
      const session = createSession();
      const runtimeLayer = await contextLayerManager.getLayer('runtime', '', session);
      expect(runtimeLayer?.name).toBe('runtime');
    });
  });

  describe('getLayerNames', () => {
    it('should return all layer names in order', () => {
      const names = contextLayerManager.getLayerNames();

      expect(names).toEqual([
        'schema',
        'annotations',
        'patterns',
        'knowledge',
        'learnings',
        'runtime',
      ]);
    });
  });

  describe('getStats', () => {
    it('should return statistics about layers', async () => {
      const stats = await contextLayerManager.getStats();

      expect(stats.layerCount).toBe(6);
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
      expect(stats.layerSizes.schema).toBeGreaterThan(0);
    });
  });
});
