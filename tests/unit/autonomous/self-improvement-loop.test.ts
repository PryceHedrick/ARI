import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import fs from 'node:fs/promises';
import { EventBus } from '../../../src/kernel/event-bus.js';
import { DecisionJournal } from '../../../src/cognition/learning/decision-journal.js';
import { SelfImprovementLoop } from '../../../src/autonomous/self-improvement-loop.js';
import type { Initiative } from '../../../src/autonomous/initiative-engine.js';
import type { CouncilInterface, Vote, VoteOption } from '../../../src/kernel/types.js';

function makeInitiative(overrides: Partial<Initiative> = {}): Initiative {
  return {
    id: `init-${randomUUID()}`,
    category: 'CODE_QUALITY',
    title: 'Test initiative',
    description: 'Add tests for untested module',
    rationale: 'Improve code quality',
    effort: 'LOW',
    impact: 'MEDIUM',
    priority: 0.75,
    forUser: false,
    autonomous: true,
    createdAt: new Date(),
    status: 'IN_PROGRESS',
    ...overrides,
  };
}

describe('SelfImprovementLoop', () => {
  let loop: SelfImprovementLoop;
  let eventBus: EventBus;
  let journal: DecisionJournal;
  let tmpDir: string;
  let persistPath: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `ari-loop-test-${randomUUID()}`);
    persistPath = join(tmpDir, 'self-improvement-state.json');
    eventBus = new EventBus();
    journal = new DecisionJournal(join(tmpDir, 'decisions'));
    await journal.initialize(eventBus);

    loop = new SelfImprovementLoop(eventBus, {
      decisionJournal: journal,
      persistPath,
      config: { governanceEnabled: true },
    });
    await loop.initialize();
  });

  afterEach(async () => {
    await loop.shutdown();
    await journal.shutdown();
    try { await fs.rm(tmpDir, { recursive: true }); } catch { /* noop */ }
  });

  describe('Outcome Processing', () => {
    it('should process a successful initiative outcome', async () => {
      const initiative = makeInitiative();
      const outcome = await loop.processOutcome(initiative, true, {
        summary: 'Added 5 tests, all passing',
        filesChanged: ['src/foo.ts', 'tests/foo.test.ts'],
      });

      expect(outcome.success).toBe(true);
      expect(outcome.patternsExtracted).toBeGreaterThan(0);
      expect(outcome.initiativeId).toBe(initiative.id);
    });

    it('should process a failed initiative outcome', async () => {
      const initiative = makeInitiative();
      const outcome = await loop.processOutcome(initiative, false, {
        summary: 'Build failed due to type errors',
      });

      expect(outcome.success).toBe(false);
      expect(outcome.patternsExtracted).toBe(0);
    });

    it('should record decisions in the journal', async () => {
      const initiative = makeInitiative({ title: 'Write tests for router' });
      await loop.processOutcome(initiative, true, {
        summary: 'Tests written successfully',
      });

      const decisions = journal.getRecentDecisions(1);
      expect(decisions.length).toBeGreaterThanOrEqual(1);
      const found = decisions.find(d => d.decision.includes('Write tests for router'));
      expect(found).toBeDefined();
      expect(found?.outcome).toBe('success');
    });

    it('should emit learning events for LearningMachine', async () => {
      const events: unknown[] = [];
      eventBus.on('scheduler:task_complete', (payload) => {
        events.push(payload);
      });

      const initiative = makeInitiative();
      await loop.processOutcome(initiative, true, {
        summary: 'Done',
      });

      expect(events.length).toBe(1);
    });
  });

  describe('Governance', () => {
    it('should require governance for high-impact categories', () => {
      const codeQuality = makeInitiative({ category: 'CODE_QUALITY' });
      expect(loop.requiresGovernance(codeQuality)).toBe(true);

      const improvements = makeInitiative({ category: 'IMPROVEMENTS' });
      expect(loop.requiresGovernance(improvements)).toBe(true);
    });

    it('should not require governance for low-impact categories', () => {
      const knowledge = makeInitiative({ category: 'KNOWLEDGE' });
      expect(loop.requiresGovernance(knowledge)).toBe(false);

      const opportunities = makeInitiative({ category: 'OPPORTUNITIES' });
      expect(loop.requiresGovernance(opportunities)).toBe(false);
    });

    it('should request governance approval', async () => {
      const initiative = makeInitiative({ category: 'CODE_QUALITY' });
      const result = await loop.requestGovernanceApproval(initiative);
      expect(result.approved).toBe(true);
      expect(result.voteId).toContain(initiative.id);
    });

    it('should skip governance when disabled', () => {
      const loopNoGov = new SelfImprovementLoop(eventBus, {
        persistPath: join(tmpDir, 'no-gov.json'),
        config: { governanceEnabled: false },
      });
      const initiative = makeInitiative({ category: 'CODE_QUALITY' });
      expect(loopNoGov.requiresGovernance(initiative)).toBe(false);
    });

    it('should call Council.createVote when council is provided', async () => {
      const mockCouncil: CouncilInterface = {
        createVote: vi.fn((request) => ({
          vote_id: `vote-${randomUUID()}`,
          topic: request.topic,
          description: request.description,
          threshold: request.threshold,
          deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          votes: {},
          status: 'OPEN',
        })),
        castVote: vi.fn(),
        getVote: vi.fn(),
        getOpenVotes: vi.fn(),
        expireOverdueVotes: vi.fn(),
      };

      const loopWithCouncil = new SelfImprovementLoop(eventBus, {
        council: mockCouncil,
        persistPath: join(tmpDir, 'with-council.json'),
      });
      await loopWithCouncil.initialize();

      const initiative = makeInitiative({ category: 'CODE_QUALITY', title: 'Add tests' });

      // Trigger the vote in the background
      const votePromise = loopWithCouncil.requestGovernanceApproval(initiative);

      // Simulate vote completion after 50ms
      setTimeout(() => {
        eventBus.emit('vote:completed', {
          voteId: (mockCouncil.createVote as ReturnType<typeof vi.fn>).mock.results[0].value.vote_id,
          status: 'APPROVED',
        });
      }, 50);

      const result = await votePromise;

      expect(mockCouncil.createVote).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Initiative: Add tests',
          threshold: 'MAJORITY',
          initiated_by: 'autonomous',
        })
      );
      expect(result.approved).toBe(true);
      expect(result.voteId).toBeDefined();

      await loopWithCouncil.shutdown();
    });

    it('should track governanceBlocked stat when vote is rejected', async () => {
      const mockCouncil: CouncilInterface = {
        createVote: vi.fn((request) => ({
          vote_id: `vote-${randomUUID()}`,
          topic: request.topic,
          description: request.description,
          threshold: request.threshold,
          deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          votes: {},
          status: 'OPEN',
        })),
        castVote: vi.fn(),
        getVote: vi.fn(),
        getOpenVotes: vi.fn(),
        expireOverdueVotes: vi.fn(),
      };

      const loopWithCouncil = new SelfImprovementLoop(eventBus, {
        council: mockCouncil,
        persistPath: join(tmpDir, 'with-council-2.json'),
      });
      await loopWithCouncil.initialize();

      const initiative = makeInitiative({ category: 'CODE_QUALITY', title: 'Refactor' });

      // Trigger the vote in the background
      const votePromise = loopWithCouncil.requestGovernanceApproval(initiative);

      // Simulate vote rejection after 50ms
      setTimeout(() => {
        eventBus.emit('vote:completed', {
          voteId: (mockCouncil.createVote as ReturnType<typeof vi.fn>).mock.results[0].value.vote_id,
          status: 'REJECTED',
        });
      }, 50);

      const result = await votePromise;

      expect(result.approved).toBe(false);

      const stats = loopWithCouncil.getStats();
      expect(stats.governanceBlocked).toBe(1);

      await loopWithCouncil.shutdown();
    });
  });

  describe('Statistics', () => {
    it('should track stats across outcomes', async () => {
      await loop.processOutcome(makeInitiative(), true, { summary: 'Success' });
      await loop.processOutcome(makeInitiative(), true, { summary: 'Success 2' });
      await loop.processOutcome(makeInitiative({ category: 'KNOWLEDGE' }), false, { summary: 'Failed' });

      const stats = loop.getStats();
      expect(stats.totalCycles).toBe(3);
      expect(stats.successfulImprovements).toBe(2);
      expect(stats.failedImprovements).toBe(1);
      expect(stats.averageSuccessRate).toBeCloseTo(0.667, 1);
      expect(stats.byCategory['CODE_QUALITY']?.success).toBe(2);
      expect(stats.byCategory['KNOWLEDGE']?.failure).toBe(1);
    });

    it('should return empty stats when no outcomes', () => {
      const stats = loop.getStats();
      expect(stats.totalCycles).toBe(0);
      expect(stats.averageSuccessRate).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should persist and reload state', async () => {
      await loop.processOutcome(makeInitiative(), true, {
        summary: 'Persisted outcome',
        filesChanged: ['a.ts'],
      });

      await loop.shutdown();

      // Create new loop pointing to same path
      const loop2 = new SelfImprovementLoop(eventBus, { persistPath });
      await loop2.initialize();

      const outcomes = loop2.getRecentOutcomes(10);
      expect(outcomes.length).toBe(1);
      expect(outcomes[0].summary).toBe('Persisted outcome');

      const stats = loop2.getStats();
      expect(stats.totalCycles).toBe(1);

      await loop2.shutdown();
    });

    it('should handle missing state file gracefully', async () => {
      const loop2 = new SelfImprovementLoop(eventBus, {
        persistPath: join(tmpDir, 'nonexistent.json'),
      });
      await loop2.initialize();

      const stats = loop2.getStats();
      expect(stats.totalCycles).toBe(0);
      await loop2.shutdown();
    });
  });

  describe('Query API', () => {
    it('should return recent outcomes in reverse order', async () => {
      await loop.processOutcome(makeInitiative({ title: 'First' }), true, { summary: 'A' });
      await loop.processOutcome(makeInitiative({ title: 'Second' }), false, { summary: 'B' });
      await loop.processOutcome(makeInitiative({ title: 'Third' }), true, { summary: 'C' });

      const recent = loop.getRecentOutcomes(2);
      expect(recent).toHaveLength(2);
      expect(recent[0].title).toBe('Third');
      expect(recent[1].title).toBe('Second');
    });

    it('should filter outcomes by category', async () => {
      await loop.processOutcome(makeInitiative({ category: 'CODE_QUALITY' }), true, { summary: 'A' });
      await loop.processOutcome(makeInitiative({ category: 'KNOWLEDGE' }), true, { summary: 'B' });

      const cq = loop.getOutcomesByCategory('CODE_QUALITY');
      expect(cq).toHaveLength(1);
      expect(cq[0].category).toBe('CODE_QUALITY');
    });
  });

  describe('Event Subscription', () => {
    it('should track initiative completion from audit events', async () => {
      // Simulate an initiative:completed audit event
      eventBus.emit('audit:log', {
        action: 'initiative:completed',
        agent: 'INITIATIVE',
        trustLevel: 'system',
        details: {
          initiativeId: 'test-123',
          status: 'COMPLETED',
          title: 'Auto-tracked initiative',
          category: 'DELIVERABLES',
          result: 'Generated status report',
        },
      });

      // Give event handler time to process
      await new Promise(r => setTimeout(r, 50));

      const stats = loop.getStats();
      expect(stats.totalCycles).toBeGreaterThanOrEqual(1);
    });
  });
});
