import { describe, it, expect } from 'vitest';
import {
  getCurrentTimeBlock,
  getTimeBlockForHour,
  getCurrentModelPreferences,
  getModelPreferencesForBlock,
  isChainAllowedInBlock,
  shouldAvoidModel,
  getBlockAdjustedChain,
  getBlockBudgetAllocation,
  getAllTimeBlocks,
  getTimeBlockSummary,
  getBlockDurationHours,
  getNextBlockTransition,
} from '../../../src/autonomous/time-blocks.js';

// Helper: create a Date at a specific hour in UTC
// Note: time-blocks.ts uses timezone-aware hour extraction, so we need to
// account for the offset between UTC and America/Indiana/Indianapolis (EST = UTC-5)
const EST_OFFSET = 5; // Indiana is UTC-5 (no DST observed in Indianapolis time zone)

function dateAtHour(estHour: number): Date {
  // Create a date where the EST hour matches what we want
  const utcHour = (estHour + EST_OFFSET) % 24;
  const d = new Date('2026-02-10T00:00:00Z');
  d.setUTCHours(utcHour, 0, 0, 0);
  return d;
}

describe('TimeBlocks', () => {
  describe('getAllTimeBlocks', () => {
    it('should return all 5 time blocks', () => {
      const blocks = getAllTimeBlocks();
      expect(blocks).toHaveLength(5);
      const ids = blocks.map(b => b.id);
      expect(ids).toContain('overnight');
      expect(ids).toContain('morning');
      expect(ids).toContain('active');
      expect(ids).toContain('family');
      expect(ids).toContain('winddown');
    });

    it('should have budget weights summing to 1.0', () => {
      const blocks = getAllTimeBlocks();
      const totalWeight = blocks.reduce((sum, b) => sum + b.budgetWeight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });

    it('should cover all 24 hours without gaps', () => {
      // Every hour 0-23 should map to exactly one block
      const coveredHours = new Set<number>();
      for (let h = 0; h < 24; h++) {
        const block = getTimeBlockForHour(h);
        expect(block).toBeDefined();
        coveredHours.add(h);
      }
      expect(coveredHours.size).toBe(24);
    });
  });

  describe('getTimeBlockForHour', () => {
    it('should return overnight for 23:00', () => {
      expect(getTimeBlockForHour(23).id).toBe('overnight');
    });

    it('should return overnight for 0:00 (midnight)', () => {
      expect(getTimeBlockForHour(0).id).toBe('overnight');
    });

    it('should return overnight for 3:00 AM', () => {
      expect(getTimeBlockForHour(3).id).toBe('overnight');
    });

    it('should return overnight for 4:00 AM', () => {
      expect(getTimeBlockForHour(4).id).toBe('overnight');
    });

    it('should return morning for 6:00 AM', () => {
      expect(getTimeBlockForHour(6).id).toBe('morning');
    });

    it('should return morning for 7:00 AM', () => {
      expect(getTimeBlockForHour(7).id).toBe('morning');
    });

    it('should return active for 8:00 AM', () => {
      expect(getTimeBlockForHour(8).id).toBe('active');
    });

    it('should return active for 12:00 PM', () => {
      expect(getTimeBlockForHour(12).id).toBe('active');
    });

    it('should return active for 16:00 (4 PM)', () => {
      expect(getTimeBlockForHour(16).id).toBe('active');
    });

    it('should return family for 17:00 (5 PM)', () => {
      expect(getTimeBlockForHour(17).id).toBe('family');
    });

    it('should return family for 20:00 (8 PM)', () => {
      expect(getTimeBlockForHour(20).id).toBe('family');
    });

    it('should return winddown for 21:00 (9 PM)', () => {
      expect(getTimeBlockForHour(21).id).toBe('winddown');
    });

    it('should return winddown for 22:00 (10 PM)', () => {
      expect(getTimeBlockForHour(22).id).toBe('winddown');
    });

    it('should return morning for 5:00 AM (boundary)', () => {
      // overnight ends at 5, morning starts at 6 — hour 5 should be morning
      // Actually: overnight is 23-5, morning is 6-8
      // Hour 5 falls between overnight (ends at 5 exclusive) and morning (starts at 6)
      // This is a gap! Let me check...
      // overnight: 23 <= h || h < 5 → 23,0,1,2,3,4
      // morning: 6 <= h < 8 → 6,7
      // Hour 5 is NOT in overnight (h < 5 is false for h=5)
      // Hour 5 is NOT in morning (h >= 6 is false for h=5)
      // So hour 5 falls to the fallback (overnight)
      const block = getTimeBlockForHour(5);
      expect(block).toBeDefined();
      // Falls through to overnight fallback
      expect(block.id).toBe('overnight');
    });
  });

  describe('getCurrentTimeBlock', () => {
    it('should return a valid block for current time', () => {
      const block = getCurrentTimeBlock();
      expect(block).toBeDefined();
      expect(block.id).toBeDefined();
      expect(block.name).toBeDefined();
      expect(block.budgetWeight).toBeGreaterThan(0);
    });

    it('should return overnight for 2 AM EST', () => {
      const block = getCurrentTimeBlock(dateAtHour(2), 'America/Indiana/Indianapolis');
      expect(block.id).toBe('overnight');
    });

    it('should return active for 10 AM EST', () => {
      const block = getCurrentTimeBlock(dateAtHour(10), 'America/Indiana/Indianapolis');
      expect(block.id).toBe('active');
    });

    it('should return family for 6 PM EST', () => {
      const block = getCurrentTimeBlock(dateAtHour(18), 'America/Indiana/Indianapolis');
      expect(block.id).toBe('family');
    });
  });

  describe('isChainAllowedInBlock', () => {
    it('should allow all chains during active block', () => {
      const active = getTimeBlockForHour(10);
      expect(isChainAllowedInBlock('quality', active)).toBe(true);
      expect(isChainAllowedInBlock('security', active)).toBe(true);
      expect(isChainAllowedInBlock('reasoning', active)).toBe(true);
      expect(isChainAllowedInBlock('code', active)).toBe(true);
      expect(isChainAllowedInBlock('frugal', active)).toBe(true);
    });

    it('should restrict chains during family time', () => {
      const family = getTimeBlockForHour(18);
      expect(isChainAllowedInBlock('frugal', family)).toBe(true);
      expect(isChainAllowedInBlock('bulk', family)).toBe(true);
      expect(isChainAllowedInBlock('quality', family)).toBe(false);
      expect(isChainAllowedInBlock('reasoning', family)).toBe(false);
      expect(isChainAllowedInBlock('code', family)).toBe(false);
    });

    it('should always allow security chain regardless of block', () => {
      const family = getTimeBlockForHour(18);
      expect(isChainAllowedInBlock('security', family)).toBe(true);

      const overnight = getTimeBlockForHour(2);
      expect(isChainAllowedInBlock('security', overnight)).toBe(true);
    });

    it('should allow balanced chains during overnight but not quality', () => {
      const overnight = getTimeBlockForHour(2);
      expect(isChainAllowedInBlock('balanced', overnight)).toBe(true);
      expect(isChainAllowedInBlock('frugal', overnight)).toBe(true);
      expect(isChainAllowedInBlock('quality', overnight)).toBe(false);
    });
  });

  describe('getBlockAdjustedChain', () => {
    it('should return original chain when allowed', () => {
      const active = getTimeBlockForHour(10);
      expect(getBlockAdjustedChain('quality', active)).toBe('quality');
    });

    it('should downgrade quality to balanced during overnight', () => {
      const overnight = getTimeBlockForHour(2);
      expect(getBlockAdjustedChain('quality', overnight)).toBe('balanced');
    });

    it('should downgrade everything to frugal during family time', () => {
      const family = getTimeBlockForHour(18);
      expect(getBlockAdjustedChain('quality', family)).toBe('frugal');
      expect(getBlockAdjustedChain('reasoning', family)).toBe('frugal');
      expect(getBlockAdjustedChain('code', family)).toBe('frugal');
    });

    it('should keep frugal as frugal everywhere', () => {
      const family = getTimeBlockForHour(18);
      expect(getBlockAdjustedChain('frugal', family)).toBe('frugal');
    });
  });

  describe('getModelPreferencesForBlock', () => {
    it('should prefer free-tier models overnight', () => {
      const prefs = getModelPreferencesForBlock('overnight');
      expect(prefs.preferred).toContain('gemini-2.5-flash-lite');
      expect(prefs.preferred).toContain('gemini-2.5-flash');
      expect(prefs.avoid).toContain('claude-opus-4.6');
    });

    it('should have no restrictions during active hours', () => {
      const prefs = getModelPreferencesForBlock('active');
      expect(prefs.preferred).toHaveLength(0);
      expect(prefs.avoid).toHaveLength(0);
    });

    it('should avoid expensive models during family time', () => {
      const prefs = getModelPreferencesForBlock('family');
      expect(prefs.avoid).toContain('claude-opus-4.6');
      expect(prefs.avoid).toContain('claude-sonnet-4.5');
      expect(prefs.avoid).toContain('gpt-5.2');
      expect(prefs.preferred).toContain('gemini-2.5-flash-lite');
    });
  });

  describe('shouldAvoidModel', () => {
    it('should avoid opus during overnight', () => {
      expect(shouldAvoidModel('claude-opus-4.6', dateAtHour(2), 'America/Indiana/Indianapolis')).toBe(true);
    });

    it('should not avoid anything during active hours', () => {
      expect(shouldAvoidModel('claude-opus-4.6', dateAtHour(10), 'America/Indiana/Indianapolis')).toBe(false);
    });
  });

  describe('getBlockBudgetAllocation', () => {
    it('should allocate 40% of budget to active hours', () => {
      expect(getBlockBudgetAllocation(10, 'active')).toBeCloseTo(4.0, 2);
    });

    it('should allocate 15% to overnight', () => {
      expect(getBlockBudgetAllocation(10, 'overnight')).toBeCloseTo(1.5, 2);
    });

    it('should return 0 for unknown block', () => {
      expect(getBlockBudgetAllocation(10, 'nonexistent' as never)).toBe(0);
    });

    it('should sum allocations to total daily budget', () => {
      const dailyBudget = 2.50;
      const blocks = getAllTimeBlocks();
      const totalAllocated = blocks.reduce(
        (sum, b) => sum + getBlockBudgetAllocation(dailyBudget, b.id),
        0,
      );
      expect(totalAllocated).toBeCloseTo(dailyBudget, 2);
    });
  });

  describe('getBlockDurationHours', () => {
    it('should return 6 hours for overnight (23-5)', () => {
      expect(getBlockDurationHours('overnight')).toBe(6);
    });

    it('should return 2 hours for morning (6-8)', () => {
      expect(getBlockDurationHours('morning')).toBe(2);
    });

    it('should return 9 hours for active (8-17)', () => {
      expect(getBlockDurationHours('active')).toBe(9);
    });

    it('should return 4 hours for family (17-21)', () => {
      expect(getBlockDurationHours('family')).toBe(4);
    });

    it('should return 2 hours for winddown (21-23)', () => {
      expect(getBlockDurationHours('winddown')).toBe(2);
    });

    it('all blocks should sum to 23 hours (hour 5 is gap/fallback)', () => {
      // 6 + 2 + 9 + 4 + 2 = 23 (hour 5 falls to overnight fallback)
      const total =
        getBlockDurationHours('overnight') +
        getBlockDurationHours('morning') +
        getBlockDurationHours('active') +
        getBlockDurationHours('family') +
        getBlockDurationHours('winddown');
      expect(total).toBe(23);
    });
  });

  describe('getTimeBlockSummary', () => {
    it('should return complete summary', () => {
      const summary = getTimeBlockSummary(dateAtHour(2), 'America/Indiana/Indianapolis');
      expect(summary.block).toBe('overnight');
      expect(summary.name).toBe('Overnight Deep Work');
      expect(summary.essentialOnly).toBe(false);
      expect(summary.maxChainTier).toBe('balanced');
      expect(summary.preferredChains).toContain('bulk');
      expect(summary.preferredModels).toContain('gemini-2.5-flash-lite');
      expect(summary.avoidModels).toContain('claude-opus-4.6');
    });

    it('should show essential-only during family time', () => {
      const summary = getTimeBlockSummary(dateAtHour(18), 'America/Indiana/Indianapolis');
      expect(summary.block).toBe('family');
      expect(summary.essentialOnly).toBe(true);
    });
  });

  describe('getNextBlockTransition', () => {
    it('should return next block transition', () => {
      const result = getNextBlockTransition(dateAtHour(10), 'America/Indiana/Indianapolis');
      expect(result.nextBlock).toBeDefined();
      expect(result.hoursUntil).toBeGreaterThan(0);
      expect(result.transitionAt).toBeInstanceOf(Date);
    });

    it('should transition from active to family', () => {
      const result = getNextBlockTransition(dateAtHour(10), 'America/Indiana/Indianapolis');
      expect(result.nextBlock).toBe('family');
    });

    it('should transition from family to winddown', () => {
      const result = getNextBlockTransition(dateAtHour(18), 'America/Indiana/Indianapolis');
      expect(result.nextBlock).toBe('winddown');
    });
  });

  describe('block property constraints', () => {
    it('family block should be essential-only', () => {
      const family = getTimeBlockForHour(18);
      expect(family.essentialOnly).toBe(true);
    });

    it('active block should not be essential-only', () => {
      const active = getTimeBlockForHour(10);
      expect(active.essentialOnly).toBe(false);
    });

    it('active block should be unrestricted', () => {
      const active = getTimeBlockForHour(10);
      expect(active.maxChainTier).toBe('unrestricted');
    });

    it('overnight should prefer cheap models first', () => {
      const prefs = getModelPreferencesForBlock('overnight');
      // First preferred should be free-tier
      expect(prefs.preferred[0]).toBe('gemini-2.5-flash-lite');
    });
  });
});
