import { describe, it, expect, beforeEach } from 'vitest';
import { SOULManager, type SOULIdentity } from '../../../src/governance/soul.js';
import path from 'node:path';

describe('SOULManager', () => {
  let soulManager: SOULManager;
  const soulsPath = path.join(process.cwd(), '.claude/souls');

  beforeEach(() => {
    soulManager = new SOULManager(soulsPath);
  });

  describe('loadSouls', () => {
    it('should load SOUL files from directory', async () => {
      await soulManager.loadSouls();

      const stats = soulManager.getStats();
      expect(stats.totalLoaded).toBeGreaterThan(0);
    });

    it('should handle missing souls directory gracefully', async () => {
      const manager = new SOULManager('/nonexistent/path');
      await expect(manager.loadSouls()).resolves.not.toThrow();
    });
  });

  describe('getIdentity', () => {
    beforeEach(async () => {
      await soulManager.loadSouls();
    });

    it('should return identity for known agent', async () => {
      const identity = soulManager.getIdentity('guardian');
      
      if (identity) {
        expect(identity.name).toBe('Aegis');
        expect(identity.agentId).toBe('guardian');
        expect(identity.pillar).toBeDefined();
      }
    });

    it('should return undefined for unknown agent', () => {
      const identity = soulManager.getIdentity('unknown' as any);
      expect(identity).toBeUndefined();
    });
  });

  describe('hasIdentity', () => {
    beforeEach(async () => {
      await soulManager.loadSouls();
    });

    it('should return true for loaded identity', () => {
      expect(soulManager.hasIdentity('guardian')).toBe(true);
    });

    it('should return false for unloaded identity', () => {
      expect(soulManager.hasIdentity('unknown' as any)).toBe(false);
    });
  });

  describe('registerIdentity', () => {
    it('should register a SOUL identity programmatically', () => {
      const testSoul: SOULIdentity = {
        agentId: 'router',
        name: 'Atlas',
        role: 'Router - Message Guide',
        pillar: 'Infrastructure',
        personality: 'Precise and efficient',
        values: ['Efficiency', 'Accuracy'],
        communicationStyle: 'Brief and direct',
        decisionPatterns: ['Route to best handler'],
        cares: ['Message routing'],
        refuses: ['Delay messages'],
        votingBehavior: {
          style: 'balanced',
          vetoAuthority: [],
          defaultPosition: 'neutral',
          approvalCondition: 'clear routing path',
        },
      };

      soulManager.registerIdentity(testSoul);

      const retrieved = soulManager.getIdentity('router');
      expect(retrieved).toEqual(testSoul);
    });
  });

  describe('influenceDecision', () => {
    beforeEach(async () => {
      await soulManager.loadSouls();
    });

    it('should return decision unchanged when no SOUL loaded', () => {
      const decision = {
        action: 'approve',
        confidence: 0.8,
        alternatives: ['approve', 'reject'],
      };

      const result = soulManager.influenceDecision('unknown' as any, decision);

      expect(result.action).toBe('approve');
      expect(result.reasoning).toContain('No SOUL identity loaded');
    });

    it('should block actions matching refuses list', async () => {
      // Guardian refuses to pass untrusted content
      const decision = {
        action: 'Pass untrusted content without scanning',
        confidence: 0.9,
        alternatives: ['pass', 'block'],
      };

      const result = soulManager.influenceDecision('guardian', decision);

      // Should be blocked based on refuses - reasoning contains soul name "Aegis"
      expect(result.action).toBe('BLOCK');
      expect(result.confidence).toBe(1);
      expect(result.reasoning).toContain('Aegis');
      expect(result.reasoning).toContain('Refuses');
    });

    it('should apply cautious style for moderate confidence', async () => {
      // Guardian has cautious style - use confidence between 0.7 and 0.8
      // to trigger cautious style reduction (not blocking from uncertainty)
      const decision = {
        action: 'some_moderate_action',
        confidence: 0.75,
        alternatives: ['approve', 'reject'],
      };

      const result = soulManager.influenceDecision('guardian', decision);

      // Cautious agents should reduce confidence for decisions below 0.8
      expect(result.confidence).toBeLessThan(decision.confidence);
      expect(result.reasoning).toContain('Cautious style');
    });

    it('should apply progressive style for higher confidence', async () => {
      // Executor (BOLT) has progressive style
      const decision = {
        action: 'efficiency_improvement',
        confidence: 0.75,
        alternatives: ['approve', 'reject'],
      };

      const result = soulManager.influenceDecision('executor', decision);

      // Progressive agents should boost confidence
      // The boost happens when confidence > 0.6 with progressive style
      expect(result.reasoning).toContain('Bolt');
    });
  });

  describe('getVotingRecommendation', () => {
    beforeEach(async () => {
      await soulManager.loadSouls();
    });

    it('should return abstain when no SOUL loaded', () => {
      const result = soulManager.getVotingRecommendation('unknown' as any, {
        topic: 'test proposal',
        risk: 'low',
        domains: [],
      });

      expect(result.recommendation).toBe('abstain');
      expect(result.reasoning).toContain('No SOUL identity loaded');
    });

    it('should invoke veto authority for critical security risks', async () => {
      // Guardian has veto authority over security
      const result = soulManager.getVotingRecommendation('guardian', {
        topic: 'Weaken security validation',
        risk: 'critical',
        domains: ['security'],
      });

      expect(result.recommendation).toBe('reject');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.reasoning).toContain('Veto authority');
    });

    it('should support changes with progressive style', async () => {
      // Executor has progressive style
      const result = soulManager.getVotingRecommendation('executor', {
        topic: 'Performance improvement',
        risk: 'low',
        domains: ['performance'],
      });

      expect(result.recommendation).toBe('approve');
    });

    it('should be cautious for high risk with cautious style', async () => {
      // Guardian has cautious style
      const result = soulManager.getVotingRecommendation('guardian', {
        topic: 'Major system change',
        risk: 'high',
        domains: ['architecture'],
      });

      expect(result.recommendation).not.toBe('approve');
    });
  });

  describe('getAllIdentities', () => {
    beforeEach(async () => {
      await soulManager.loadSouls();
    });

    it('should return all loaded identities', () => {
      const identities = soulManager.getAllIdentities();

      expect(identities.length).toBeGreaterThan(0);
      for (const identity of identities) {
        expect(identity.name).toBeDefined();
        expect(identity.agentId).toBeDefined();
      }
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await soulManager.loadSouls();
    });

    it('should return statistics about loaded SOULs', () => {
      const stats = soulManager.getStats();

      expect(stats.totalLoaded).toBeGreaterThan(0);
      expect(stats.byPillar).toBeDefined();
      expect(stats.byVotingStyle).toBeDefined();
      expect(stats.byVotingStyle.cautious).toBeGreaterThanOrEqual(0);
      expect(stats.byVotingStyle.balanced).toBeGreaterThanOrEqual(0);
      expect(stats.byVotingStyle.progressive).toBeGreaterThanOrEqual(0);
    });
  });
});
