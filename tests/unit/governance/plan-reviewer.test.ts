import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlanReviewer, type Plan, type PlanTask } from '../../../src/governance/plan-reviewer.js';
import { Arbiter } from '../../../src/governance/arbiter.js';
import { Overseer } from '../../../src/governance/overseer.js';
import { AuditLogger } from '../../../src/kernel/audit.js';
import { EventBus } from '../../../src/kernel/event-bus.js';

describe('PlanReviewer', () => {
  let planReviewer: PlanReviewer;
  let arbiter: Arbiter;
  let overseer: Overseer;
  let eventBus: EventBus;
  let auditLogger: AuditLogger;

  function createTask(overrides: Partial<PlanTask> = {}): PlanTask {
    return {
      id: `task-${Math.random().toString(36).slice(2)}`,
      name: 'Test Task',
      description: 'A test task description',
      priority: 'medium',
      dependencies: [],
      ...overrides,
    };
  }

  function createPlan(overrides: Partial<Plan> = {}): Plan {
    return {
      id: `plan-${Math.random().toString(36).slice(2)}`,
      name: 'Test Plan',
      description: 'A test plan',
      tasks: [createTask()],
      created_by: 'planner',
      created_at: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    eventBus = new EventBus();
    auditLogger = new AuditLogger('/tmp/test-audit.json');
    arbiter = new Arbiter(auditLogger, eventBus);
    overseer = new Overseer(auditLogger, eventBus);
    planReviewer = new PlanReviewer(arbiter, overseer, eventBus, auditLogger);
  });

  describe('reviewPlan', () => {
    it('should approve a valid plan', async () => {
      const plan = createPlan({
        tasks: [
          createTask({ name: 'Task 1', description: 'First task to complete' }),
          createTask({ name: 'Task 2', description: 'Second task to complete' }),
        ],
      });

      const pipeline = await planReviewer.reviewPlan(plan);

      expect(pipeline.status).toBe('approved');
      expect(pipeline.approvedAt).toBeDefined();
      expect(pipeline.reviews.length).toBeGreaterThan(0);
    });

    it('should emit review_started event', async () => {
      const startedHandler = vi.fn();
      eventBus.on('plan:review_started', startedHandler);

      const plan = createPlan();
      await planReviewer.reviewPlan(plan);

      expect(startedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: plan.id,
        })
      );
    });

    it('should emit review_approved event on approval', async () => {
      const approvedHandler = vi.fn();
      eventBus.on('plan:review_approved', approvedHandler);

      const plan = createPlan();
      await planReviewer.reviewPlan(plan);

      expect(approvedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: plan.id,
        })
      );
    });

    it('should include constitutional review', async () => {
      const plan = createPlan();
      const pipeline = await planReviewer.reviewPlan(plan);

      const constitutionalReview = pipeline.reviews.find(r => r.reviewType === 'constitutional');
      expect(constitutionalReview).toBeDefined();
      expect(constitutionalReview?.reviewer).toBe('arbiter');
    });

    it('should include quality review by default', async () => {
      const plan = createPlan();
      const pipeline = await planReviewer.reviewPlan(plan);

      const qualityReview = pipeline.reviews.find(r => r.reviewType === 'quality');
      expect(qualityReview).toBeDefined();
      expect(qualityReview?.reviewer).toBe('overseer');
    });

    it('should skip quality review when requested', async () => {
      const plan = createPlan();
      const pipeline = await planReviewer.reviewPlan(plan, { skipQuality: true });

      const qualityReview = pipeline.reviews.find(r => r.reviewType === 'quality');
      expect(qualityReview).toBeUndefined();
    });

    it('should include expert review when required', async () => {
      const plan = createPlan({
        tasks: [
          createTask({ name: 'Test Task', description: 'A test task' }),
        ],
      });

      const pipeline = await planReviewer.reviewPlan(plan, {
        requireExpertReview: true,
        expertReviewer: 'integrator',
      });

      const expertReview = pipeline.reviews.find(r => r.reviewType === 'expert');
      expect(expertReview).toBeDefined();
      expect(expertReview?.reviewer).toBe('integrator');
    });
  });

  describe('constitutional review', () => {
    it('should pass plan with valid tasks', async () => {
      const plan = createPlan({
        tasks: [
          createTask({ name: 'Read file', description: 'Read a configuration file' }),
        ],
      });

      const pipeline = await planReviewer.reviewPlan(plan);
      const review = pipeline.reviews.find(r => r.reviewType === 'constitutional');

      expect(review?.passed).toBe(true);
      expect(review?.blockers).toHaveLength(0);
    });

    it('should generate tips for critical tasks', async () => {
      const plan = createPlan({
        tasks: [
          createTask({ name: 'Critical task', description: 'A critical operation', priority: 'critical' }),
        ],
      });

      const pipeline = await planReviewer.reviewPlan(plan);
      const review = pipeline.reviews.find(r => r.reviewType === 'constitutional');

      expect(review?.tips.length).toBeGreaterThan(0);
    });

    it('should generate tips for large plans', async () => {
      const plan = createPlan({
        tasks: Array(7).fill(null).map((_, i) => 
          createTask({ name: `Task ${i}`, description: `Task ${i} description` })
        ),
      });

      const pipeline = await planReviewer.reviewPlan(plan);
      const review = pipeline.reviews.find(r => r.reviewType === 'constitutional');

      expect(review?.tips.length).toBeGreaterThan(0);
    });
  });

  describe('quality review', () => {
    it('should fail plan with no tasks', async () => {
      const plan = createPlan({
        tasks: [],
      });

      const pipeline = await planReviewer.reviewPlan(plan);
      const review = pipeline.reviews.find(r => r.reviewType === 'quality');

      expect(review?.passed).toBe(false);
      expect(review?.score).toBeLessThan(70);
      expect(review?.concerns).toContain('Plan has no tasks');
    });

    it('should flag missing dependencies', async () => {
      const plan = createPlan({
        tasks: [
          createTask({ 
            name: 'Task with missing dep', 
            description: 'Depends on non-existent task',
            dependencies: ['non-existent-task-id'],
          }),
        ],
      });

      const pipeline = await planReviewer.reviewPlan(plan);
      const review = pipeline.reviews.find(r => r.reviewType === 'quality');

      expect(review?.concerns.some(c => c.includes('missing dependency'))).toBe(true);
    });

    it('should recommend fallbacks for critical tasks without them', async () => {
      const plan = createPlan({
        tasks: [
          createTask({ name: 'Critical operation', description: 'Something critical', priority: 'critical' }),
        ],
      });

      const pipeline = await planReviewer.reviewPlan(plan);
      const review = pipeline.reviews.find(r => r.reviewType === 'quality');

      expect(review?.recommendations.some(r => r.includes('fallback'))).toBe(true);
    });

    it('should recommend breaking up large plans', async () => {
      const plan = createPlan({
        tasks: Array(12).fill(null).map((_, i) => 
          createTask({ name: `Task ${i}`, description: `Task ${i} description` })
        ),
      });

      const pipeline = await planReviewer.reviewPlan(plan);
      const review = pipeline.reviews.find(r => r.reviewType === 'quality');

      expect(review?.recommendations.some(r => r.includes('breaking into phases'))).toBe(true);
    });

    it('should flag tasks with inadequate descriptions', async () => {
      const plan = createPlan({
        tasks: [
          createTask({ name: 'Vague task', description: 'Do it' }), // Less than 10 chars
        ],
      });

      const pipeline = await planReviewer.reviewPlan(plan);
      const review = pipeline.reviews.find(r => r.reviewType === 'quality');

      expect(review?.concerns.some(c => c.includes('lack adequate descriptions'))).toBe(true);
    });
  });

  describe('expert review', () => {
    it('should recommend testing tasks', async () => {
      const plan = createPlan({
        tasks: [
          createTask({ name: 'Feature implementation', description: 'Implement the feature' }),
        ],
      });

      const pipeline = await planReviewer.reviewPlan(plan, { requireExpertReview: true });
      const review = pipeline.reviews.find(r => r.reviewType === 'expert');

      expect(review?.recommendations.some(r => r.includes('testing'))).toBe(true);
    });

    it('should not recommend testing if test task exists', async () => {
      const plan = createPlan({
        tasks: [
          createTask({ name: 'Feature implementation', description: 'Implement the feature' }),
          createTask({ name: 'Test feature', description: 'Test the implementation' }),
        ],
      });

      const pipeline = await planReviewer.reviewPlan(plan, { requireExpertReview: true });
      const review = pipeline.reviews.find(r => r.reviewType === 'expert');

      expect(review?.recommendations.some(r => r.includes('Add explicit testing'))).toBe(false);
    });

    it('should recommend rollback for critical tasks', async () => {
      const plan = createPlan({
        tasks: [
          createTask({ name: 'Critical deployment', description: 'Deploy to production', priority: 'critical' }),
        ],
      });

      const pipeline = await planReviewer.reviewPlan(plan, { requireExpertReview: true });
      const review = pipeline.reviews.find(r => r.reviewType === 'expert');

      expect(review?.recommendations.some(r => r.includes('rollback'))).toBe(true);
    });

    it('should recommend documentation for larger plans', async () => {
      const plan = createPlan({
        tasks: Array(5).fill(null).map((_, i) => 
          createTask({ name: `Task ${i}`, description: `Task ${i} description that is long enough` })
        ),
      });

      const pipeline = await planReviewer.reviewPlan(plan, { requireExpertReview: true });
      const review = pipeline.reviews.find(r => r.reviewType === 'expert');

      expect(review?.recommendations.some(r => r.includes('documentation'))).toBe(true);
    });
  });

  describe('getPipeline', () => {
    it('should return pipeline for reviewed plan', async () => {
      const plan = createPlan();
      await planReviewer.reviewPlan(plan);

      const pipeline = planReviewer.getPipeline(plan.id);

      expect(pipeline).toBeDefined();
      expect(pipeline?.planId).toBe(plan.id);
    });

    it('should return undefined for unknown plan', () => {
      const pipeline = planReviewer.getPipeline('unknown-id');
      expect(pipeline).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return statistics about reviews', async () => {
      const plan1 = createPlan();
      const plan2 = createPlan();

      await planReviewer.reviewPlan(plan1);
      await planReviewer.reviewPlan(plan2);

      const stats = planReviewer.getStats();

      expect(stats.totalPipelines).toBe(2);
      expect(stats.byStatus.approved).toBe(2);
      expect(stats.avgScore).toBeGreaterThan(0);
      expect(stats.approvalRate).toBe(1);
    });
  });

  describe('clearOldPipelines', () => {
    it('should clear old completed pipelines', async () => {
      const plan = createPlan();
      const pipeline = await planReviewer.reviewPlan(plan);

      // Manually set old approval date
      if (pipeline.approvedAt) {
        pipeline.approvedAt = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      }

      const cleared = planReviewer.clearOldPipelines(24 * 60 * 60 * 1000); // 24 hours

      expect(cleared).toBe(1);
      expect(planReviewer.getPipeline(plan.id)).toBeUndefined();
    });

    it('should not clear recent pipelines', async () => {
      const plan = createPlan();
      await planReviewer.reviewPlan(plan);

      const cleared = planReviewer.clearOldPipelines(24 * 60 * 60 * 1000); // 24 hours

      expect(cleared).toBe(0);
      expect(planReviewer.getPipeline(plan.id)).toBeDefined();
    });
  });

  describe('reasoning traces', () => {
    it('should include reasoning trace in constitutional review', async () => {
      const plan = createPlan();
      const pipeline = await planReviewer.reviewPlan(plan);
      const review = pipeline.reviews.find(r => r.reviewType === 'constitutional');

      expect(review?.reasoning).toBeDefined();
      expect(review?.reasoning.decision).toBeDefined();
      expect(review?.reasoning.rationale).toBeDefined();
      expect(review?.reasoning.steps.length).toBeGreaterThan(0);
    });

    it('should include reasoning trace in quality review', async () => {
      const plan = createPlan();
      const pipeline = await planReviewer.reviewPlan(plan);
      const review = pipeline.reviews.find(r => r.reviewType === 'quality');

      expect(review?.reasoning).toBeDefined();
      expect(review?.reasoning.decision).toBeDefined();
      expect(review?.reasoning.confidence).toBeGreaterThan(0);
    });

    it('should include reasoning trace in expert review', async () => {
      const plan = createPlan();
      const pipeline = await planReviewer.reviewPlan(plan, { requireExpertReview: true });
      const review = pipeline.reviews.find(r => r.reviewType === 'expert');

      expect(review?.reasoning).toBeDefined();
      expect(review?.reasoning.alternatives).toContain('APPROVE');
      expect(review?.reasoning.alternatives).toContain('NEEDS_REVISION');
    });
  });
});
