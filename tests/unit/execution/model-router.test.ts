import { describe, it, expect, beforeEach } from 'vitest';
import { ModelRouter, type ModelConfig, type TaskClassification } from '../../../src/execution/model-router.js';
import { EventBus } from '../../../src/kernel/event-bus.js';

describe('ModelRouter', () => {
  let modelRouter: ModelRouter;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    modelRouter = new ModelRouter(eventBus);
  });

  describe('classifyTask', () => {
    it('should classify a code review task', () => {
      const classification = modelRouter.classifyTask('Please review this code for bugs');

      expect(classification.taskType).toBe('code_review');
      expect(classification.requiredCapabilities).toContain('coding');
      expect(classification.requiredCapabilities).toContain('analysis');
      expect(classification.qualityRequirement).toBe('best');
    });

    it('should classify a security analysis task', () => {
      const classification = modelRouter.classifyTask('Check for security vulnerabilities');

      expect(classification.taskType).toBe('security_analysis');
      expect(classification.requiredCapabilities).toContain('analysis');
      expect(classification.qualityRequirement).toBe('best');
    });

    it('should classify a quick question', () => {
      const classification = modelRouter.classifyTask('What is TypeScript?');

      expect(classification.taskType).toBe('quick_question');
      expect(classification.complexityScore).toBeLessThan(5);
    });

    it('should use hints when provided', () => {
      const classification = modelRouter.classifyTask('Do something', {
        taskType: 'planning',
        urgency: 'critical',
      });

      expect(classification.taskType).toBe('planning');
      expect(classification.urgency).toBe('critical');
    });

    it('should adjust for guardian agent', () => {
      const classification = modelRouter.classifyTask('Analyze this', {
        agent: 'guardian',
      });

      expect(classification.qualityRequirement).toBe('best');
      expect(classification.requiredCapabilities).toContain('analysis');
    });

    it('should adjust for executor agent', () => {
      const classification = modelRouter.classifyTask('Run this task', {
        agent: 'executor',
      });

      expect(classification.requiredCapabilities).toContain('tool_use');
    });
  });

  describe('route', () => {
    it('should route to best model for high-quality requirement', () => {
      const classification: TaskClassification = {
        taskType: 'security_analysis',
        requiredCapabilities: ['reasoning', 'analysis'],
        complexityScore: 9,
        urgency: 'normal',
        expectedTokens: { input: 1000, output: 2000 },
        qualityRequirement: 'best',
      };

      const decision = modelRouter.route(classification);

      expect(decision.primaryModel).toBeDefined();
      expect(decision.primaryModel.qualityScore).toBeGreaterThanOrEqual(8);
      expect(decision.fallbackModels.length).toBeGreaterThan(0);
      expect(decision.reasoning).toContain('best');
    });

    it('should route to fast model for critical urgency', () => {
      const classification: TaskClassification = {
        taskType: 'quick_question',
        requiredCapabilities: ['reasoning'],
        complexityScore: 3,
        urgency: 'critical',
        expectedTokens: { input: 100, output: 500 },
        qualityRequirement: 'good',
      };

      const decision = modelRouter.route(classification);

      expect(decision.primaryModel).toBeDefined();
      // Should prefer faster models for critical urgency
      expect(['ultra-fast', 'fast']).toContain(decision.estimatedLatency);
    });

    it('should provide fallback models', () => {
      const classification: TaskClassification = {
        taskType: 'code_generation',
        requiredCapabilities: ['coding'],
        complexityScore: 6,
        urgency: 'normal',
        expectedTokens: { input: 500, output: 1000 },
        qualityRequirement: 'better',
      };

      const decision = modelRouter.route(classification);

      expect(decision.fallbackModels.length).toBeGreaterThan(0);
      expect(decision.fallbackModels.length).toBeLessThanOrEqual(3);
    });

    it('should calculate estimated cost', () => {
      const classification: TaskClassification = {
        taskType: 'general',
        requiredCapabilities: ['reasoning'],
        complexityScore: 5,
        urgency: 'normal',
        expectedTokens: { input: 1000, output: 1000 },
        qualityRequirement: 'good',
      };

      const decision = modelRouter.route(classification);

      expect(decision.estimatedCost).toBeGreaterThan(0);
    });

    it('should throw if no suitable model', () => {
      // Create router with no available models
      const customModels: ModelConfig[] = [
        {
          id: 'unavailable',
          name: 'Unavailable Model',
          provider: 'anthropic',
          capabilities: ['vision'], // Only has vision
          maxContextTokens: 1000,
          costPer1MInput: 1,
          costPer1MOutput: 1,
          latencyClass: 'fast',
          qualityScore: 5,
          isAvailable: false, // Not available
        },
      ];

      const router = new ModelRouter(eventBus, undefined, customModels);

      const classification: TaskClassification = {
        taskType: 'coding',
        requiredCapabilities: ['coding'], // Needs coding, but model only has vision
        complexityScore: 5,
        urgency: 'normal',
        expectedTokens: { input: 100, output: 100 },
        qualityRequirement: 'good',
      };

      expect(() => router.route(classification)).toThrow('No suitable models available');
    });
  });

  describe('listModels', () => {
    it('should list all available models', () => {
      const models = modelRouter.listModels(true);

      expect(models.length).toBeGreaterThan(0);
      for (const model of models) {
        expect(model.isAvailable).toBe(true);
      }
    });

    it('should list all models including unavailable', () => {
      const allModels = modelRouter.listModels(false);
      const availableModels = modelRouter.listModels(true);

      expect(allModels.length).toBeGreaterThanOrEqual(availableModels.length);
    });
  });

  describe('getModel', () => {
    it('should return model by ID', () => {
      const model = modelRouter.getModel('claude-sonnet-4');

      expect(model).toBeDefined();
      expect(model?.name).toBe('Claude Sonnet 4');
    });

    it('should return undefined for unknown model', () => {
      const model = modelRouter.getModel('unknown-model');
      expect(model).toBeUndefined();
    });
  });

  describe('registerModel', () => {
    it('should register a new model', () => {
      const customModel: ModelConfig = {
        id: 'custom-model',
        name: 'Custom Model',
        provider: 'local',
        capabilities: ['reasoning'],
        maxContextTokens: 8000,
        costPer1MInput: 0,
        costPer1MOutput: 0,
        latencyClass: 'fast',
        qualityScore: 7,
        isAvailable: true,
      };

      modelRouter.registerModel(customModel);

      const retrieved = modelRouter.getModel('custom-model');
      expect(retrieved).toEqual(customModel);
    });
  });

  describe('setModelAvailability', () => {
    it('should update model availability', () => {
      const modelId = 'claude-sonnet-4';

      modelRouter.setModelAvailability(modelId, false);
      let model = modelRouter.getModel(modelId);
      expect(model?.isAvailable).toBe(false);

      modelRouter.setModelAvailability(modelId, true);
      model = modelRouter.getModel(modelId);
      expect(model?.isAvailable).toBe(true);
    });
  });

  describe('quickRoute', () => {
    it('should route to fast model', () => {
      const model = modelRouter.quickRoute('fast');

      expect(model).toBeDefined();
      expect(['ultra-fast', 'fast']).toContain(model?.latencyClass);
    });

    it('should route to best model', () => {
      const model = modelRouter.quickRoute('best');

      expect(model).toBeDefined();
      expect(model?.qualityScore).toBeGreaterThanOrEqual(8);
    });

    it('should route to cheap model', () => {
      const model = modelRouter.quickRoute('cheap');

      expect(model).toBeDefined();
      // Should be one of the cheaper models
      expect(model?.costPer1MInput + model?.costPer1MOutput).toBeLessThan(30);
    });
  });

  describe('getRoutingHistory', () => {
    it('should track routing decisions', () => {
      const classification: TaskClassification = {
        taskType: 'test',
        requiredCapabilities: ['reasoning'],
        complexityScore: 5,
        urgency: 'normal',
        expectedTokens: { input: 100, output: 100 },
        qualityRequirement: 'good',
      };

      modelRouter.route(classification);
      modelRouter.route(classification);
      modelRouter.route(classification);

      const history = modelRouter.getRoutingHistory();

      expect(history.length).toBe(3);
      for (const entry of history) {
        expect(entry.timestamp).toBeInstanceOf(Date);
        expect(entry.selectedModel).toBeDefined();
      }
    });

    it('should limit history size', () => {
      const classification: TaskClassification = {
        taskType: 'test',
        requiredCapabilities: ['reasoning'],
        complexityScore: 5,
        urgency: 'normal',
        expectedTokens: { input: 100, output: 100 },
        qualityRequirement: 'good',
      };

      // Route many times
      for (let i = 0; i < 150; i++) {
        modelRouter.route(classification);
      }

      const history = modelRouter.getRoutingHistory(150);

      // Should be capped at 100
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getStats', () => {
    it('should return routing statistics', () => {
      const classification1: TaskClassification = {
        taskType: 'code_review',
        requiredCapabilities: ['coding', 'analysis'],
        complexityScore: 7,
        urgency: 'normal',
        expectedTokens: { input: 1000, output: 1000 },
        qualityRequirement: 'best',
      };

      const classification2: TaskClassification = {
        taskType: 'quick_question',
        requiredCapabilities: ['reasoning'],
        complexityScore: 3,
        urgency: 'normal',
        expectedTokens: { input: 100, output: 200 },
        qualityRequirement: 'good',
      };

      modelRouter.route(classification1);
      modelRouter.route(classification1);
      modelRouter.route(classification2);

      const stats = modelRouter.getStats();

      expect(stats.totalRoutings).toBe(3);
      expect(stats.byTaskType['code_review']).toBe(2);
      expect(stats.byTaskType['quick_question']).toBe(1);
      expect(stats.availableModels).toBeGreaterThan(0);
    });
  });
});
