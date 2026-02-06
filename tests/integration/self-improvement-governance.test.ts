import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SelfImprovementLoop } from '../../src/autonomous/self-improvement-loop.js';
import { EventBus } from '../../src/kernel/event-bus.js';
import { DecisionJournal } from '../../src/cognition/learning/decision-journal.js';
import type { CouncilInterface } from '../../src/kernel/types.js';

describe('Self-Improvement Governance Integration', () => {
  let eventBus: EventBus;
  let decisionJournal: DecisionJournal;
  let mockCouncil: CouncilInterface;
  let loop: SelfImprovementLoop;

  beforeEach(async () => {
    eventBus = new EventBus();
    decisionJournal = new DecisionJournal('/tmp/ari-test-decisions');
    await decisionJournal.initialize(eventBus);

    mockCouncil = {
      createVote: vi.fn((request) => ({
        vote_id: `vote_${Date.now()}`,
        topic: request.topic,
        status: 'OPEN',
        options: ['APPROVE', 'REJECT'],
        votes: [],
        threshold: request.threshold,
        created_at: new Date().toISOString(),
        deadline: new Date(Date.now() + 60 * 60000).toISOString(),
        initiated_by: request.initiated_by,
      })),
      castVote: vi.fn(),
      getVote: vi.fn(() => undefined),
      getOpenVotes: vi.fn(() => []),
      expireOverdueVotes: vi.fn(() => 0),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createTestInitiative = () => ({
    id: `init_${Date.now()}`,
    title: 'Add comprehensive error handling',
    description: 'Improve error handling across the gateway layer',
    category: 'CODE_QUALITY' as const,
    priority: 8,
    estimatedEffort: 'MEDIUM',
    effort: 'MEDIUM' as const,
    impact: 'HIGH' as const,
    rationale: 'Error handling reduces crashes by 40%',
    kind: 'code_improvement',
  });

  describe('Governance Flow', () => {
    it('should route initiative through Council when governance enabled', async () => {
      loop = new SelfImprovementLoop(eventBus, {
        decisionJournal,
        council: mockCouncil,
        config: {
          governanceEnabled: true,
          governanceThreshold: 'MAJORITY',
        },
      });

      await loop.initialize();

      const initiative = createTestInitiative();
      const approvalPromise = loop.requestGovernanceApproval(initiative);

      // Wait for createVote to be called
      await vi.waitFor(() => {
        expect(mockCouncil.createVote).toHaveBeenCalled();
      });

      // Get the vote_id from the mock return
      const voteResult = (mockCouncil.createVote as ReturnType<typeof vi.fn>).mock.results[0]?.value;
      const voteId = voteResult?.vote_id;

      expect(voteId).toBeDefined();

      // Simulate Council approval via event
      eventBus.emit('vote:completed', {
        voteId: voteId!,
        status: 'APPROVED',
        result: { outcome: 'APPROVE' },
      });

      const approval = await approvalPromise;

      expect(approval.approved).toBe(true);
      expect(approval.voteId).toBe(voteId);
    });

    it('should reject initiative when Council votes REJECT', async () => {
      loop = new SelfImprovementLoop(eventBus, {
        decisionJournal,
        council: mockCouncil,
        config: {
          governanceEnabled: true,
          governanceThreshold: 'SUPERMAJORITY',
        },
      });

      await loop.initialize();

      const initiative = createTestInitiative();
      const approvalPromise = loop.requestGovernanceApproval(initiative);

      await vi.waitFor(() => {
        expect(mockCouncil.createVote).toHaveBeenCalled();
      });

      const voteResult = (mockCouncil.createVote as ReturnType<typeof vi.fn>).mock.results[0]?.value;
      const voteId = voteResult?.vote_id;

      // Simulate Council rejection
      eventBus.emit('vote:completed', {
        voteId: voteId!,
        status: 'REJECTED',
        result: { outcome: 'REJECT' },
      });

      const approval = await approvalPromise;

      expect(approval.approved).toBe(false);
      expect(approval.voteId).toBe(voteId);
    });

    it('should bypass governance when disabled', async () => {
      loop = new SelfImprovementLoop(eventBus, {
        decisionJournal,
        council: mockCouncil,
        config: { governanceEnabled: false },
      });

      await loop.initialize();

      const initiative = createTestInitiative();
      const approval = await loop.requestGovernanceApproval(initiative);

      expect(approval.approved).toBe(true);
      expect(mockCouncil.createVote).not.toHaveBeenCalled();
    });
  });

  describe('Outcome Processing', () => {
    it('should record successful improvement outcome', async () => {
      loop = new SelfImprovementLoop(eventBus, {
        decisionJournal,
        config: { governanceEnabled: false },
      });

      await loop.initialize();

      const initiative = createTestInitiative();
      const outcome = await loop.processOutcome(
        initiative,
        true,
        {
          summary: 'Successfully added error handlers across gateway layer',
          filesChanged: ['src/kernel/gateway.ts'],
          governanceApproved: true,
        },
      );

      expect(outcome.success).toBe(true);
      expect(outcome.initiativeId).toBe(initiative.id);
      expect(outcome.category).toBe('CODE_QUALITY');
      expect(outcome.summary).toContain('error handlers');
    });

    it('should record failed improvement outcome', async () => {
      loop = new SelfImprovementLoop(eventBus, {
        decisionJournal,
        config: { governanceEnabled: false },
      });

      await loop.initialize();

      const initiative = createTestInitiative();
      const outcome = await loop.processOutcome(
        initiative,
        false,
        {
          summary: 'Failed: Insufficient permissions to modify gateway',
        },
      );

      expect(outcome.success).toBe(false);
      expect(outcome.initiativeId).toBe(initiative.id);
    });

    it('should emit audit event on outcome processing', async () => {
      loop = new SelfImprovementLoop(eventBus, {
        decisionJournal,
        config: { governanceEnabled: false },
      });

      await loop.initialize();

      const initiative = createTestInitiative();
      const auditSpy = vi.fn();
      eventBus.on('audit:log', auditSpy);

      await loop.processOutcome(
        initiative,
        true,
        { summary: 'Success' },
      );

      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'self_improvement:outcome_processed',
        }),
      );
    });
  });

  describe('Confidence-Based Approval', () => {
    it('should check initiative confidence', async () => {
      loop = new SelfImprovementLoop(eventBus, {
        decisionJournal,
        config: { governanceEnabled: false },
      });

      await loop.initialize();

      const initiative = createTestInitiative();
      const check = loop.checkInitiativeConfidence(initiative);

      expect(check).toHaveProperty('allowed');
      expect(check).toHaveProperty('confidence');
      expect(typeof check.confidence).toBe('number');
      expect(check.confidence).toBeGreaterThanOrEqual(0);
      expect(check.confidence).toBeLessThanOrEqual(1);
    });

    it('should report low confidence with reason', async () => {
      loop = new SelfImprovementLoop(eventBus, {
        decisionJournal,
        config: { governanceEnabled: false },
      });

      await loop.initialize();

      // Process several failed outcomes to lower confidence for category
      const initiative = createTestInitiative();
      for (let i = 0; i < 5; i++) {
        await loop.processOutcome(
          { ...initiative, id: `fail_${i}` },
          false,
          { summary: 'Failed again' },
        );
      }

      // Now check confidence for same category
      const check = loop.checkInitiativeConfidence(initiative);
      // After many failures, confidence should be lower
      expect(check.confidence).toBeLessThan(1);
    });
  });

  describe('Stats Tracking', () => {
    it('should track improvement cycle statistics', async () => {
      loop = new SelfImprovementLoop(eventBus, {
        decisionJournal,
        config: { governanceEnabled: false },
      });

      await loop.initialize();

      const initiative = createTestInitiative();

      await loop.processOutcome(initiative, true, { summary: 'Win' });
      await loop.processOutcome(
        { ...initiative, id: 'init_2' },
        false,
        { summary: 'Loss' },
      );

      const stats = loop.getStats();
      expect(stats.totalCycles).toBeGreaterThanOrEqual(2);
      expect(stats.successfulImprovements).toBeGreaterThanOrEqual(1);
      expect(stats.failedImprovements).toBeGreaterThanOrEqual(1);
    });
  });
});
