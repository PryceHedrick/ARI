import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Scratchpad } from '../../../src/agents/scratchpad.js';
import { EventBus } from '../../../src/kernel/event-bus.js';

describe('Scratchpad', () => {
  let scratchpad: Scratchpad;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    scratchpad = new Scratchpad(eventBus, 30); // 30 minute default TTL
  });

  afterEach(() => {
    scratchpad.stopCleanup();
  });

  describe('write', () => {
    it('should write an entry', () => {
      const entry = scratchpad.write('planner', 'thought-1', 'I need to break down this task');

      expect(entry.id).toMatch(/^sp_/);
      expect(entry.key).toBe('thought-1');
      expect(entry.content).toBe('I need to break down this task');
      expect(entry.agent).toBe('planner');
    });

    it('should emit scratchpad:written event', () => {
      const writtenHandler = vi.fn();
      eventBus.on('scratchpad:written', writtenHandler);

      scratchpad.write('executor', 'step-1', 'Executing command');

      expect(writtenHandler).toHaveBeenCalledWith({
        agent: 'executor',
        key: 'step-1',
        size: 17, // "Executing command".length
      });
    });

    it('should set task and session IDs', () => {
      scratchpad.write('planner', 'key', 'content', {
        taskId: 'task-123',
        sessionId: 'session-456',
      });

      const context = scratchpad.getContext('planner');
      expect(context?.taskId).toBe('task-123');
      expect(context?.sessionId).toBe('session-456');
    });

    it('should overwrite existing entry with same key', () => {
      scratchpad.write('core', 'state', 'initial');
      scratchpad.write('core', 'state', 'updated');

      const entry = scratchpad.read('core', 'state');
      expect(entry?.content).toBe('updated');
    });
  });

  describe('append', () => {
    it('should append to existing entry', () => {
      scratchpad.write('planner', 'log', 'Step 1: Initialize');
      scratchpad.append('planner', 'log', 'Step 2: Process');

      const entry = scratchpad.read('planner', 'log');
      expect(entry?.content).toBe('Step 1: Initialize\nStep 2: Process');
    });

    it('should create new entry if key does not exist', () => {
      scratchpad.append('planner', 'new-log', 'First entry');

      const entry = scratchpad.read('planner', 'new-log');
      expect(entry?.content).toBe('First entry');
    });

    it('should use custom separator', () => {
      scratchpad.write('executor', 'commands', 'cmd1');
      scratchpad.append('executor', 'commands', 'cmd2', ' && ');

      const entry = scratchpad.read('executor', 'commands');
      expect(entry?.content).toBe('cmd1 && cmd2');
    });
  });

  describe('read', () => {
    it('should return null for non-existent agent', () => {
      const entry = scratchpad.read('unknown' as any, 'key');
      expect(entry).toBeNull();
    });

    it('should return null for non-existent key', () => {
      scratchpad.write('planner', 'exists', 'value');
      const entry = scratchpad.read('planner', 'nonexistent');
      expect(entry).toBeNull();
    });

    it('should return null for expired entry', () => {
      const entry = scratchpad.write('planner', 'expires', 'value', { ttlMinutes: 0.001 }); // ~60ms
      
      // Wait for expiration
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);
      
      const result = scratchpad.read('planner', 'expires');
      expect(result).toBeNull();
      
      vi.useRealTimers();
    });
  });

  describe('readAll', () => {
    it('should return all entries for an agent', () => {
      scratchpad.write('planner', 'key1', 'value1');
      scratchpad.write('planner', 'key2', 'value2');
      scratchpad.write('planner', 'key3', 'value3');

      const entries = scratchpad.readAll('planner');
      expect(entries).toHaveLength(3);
    });

    it('should filter out expired entries', () => {
      vi.useFakeTimers();
      
      scratchpad.write('planner', 'short', 'expires quickly', { ttlMinutes: 1 });
      scratchpad.write('planner', 'long', 'lasts longer', { ttlMinutes: 60 });

      vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

      const entries = scratchpad.readAll('planner');
      expect(entries).toHaveLength(1);
      expect(entries[0].key).toBe('long');

      vi.useRealTimers();
    });

    it('should return empty array for unknown agent', () => {
      const entries = scratchpad.readAll('unknown' as any);
      expect(entries).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete an entry', () => {
      scratchpad.write('planner', 'to-delete', 'value');
      
      const deleted = scratchpad.delete('planner', 'to-delete');
      
      expect(deleted).toBe(true);
      expect(scratchpad.read('planner', 'to-delete')).toBeNull();
    });

    it('should emit scratchpad:deleted event', () => {
      const deletedHandler = vi.fn();
      eventBus.on('scratchpad:deleted', deletedHandler);

      scratchpad.write('planner', 'key', 'value');
      scratchpad.delete('planner', 'key');

      expect(deletedHandler).toHaveBeenCalledWith({
        agent: 'planner',
        key: 'key',
      });
    });

    it('should return false for non-existent entry', () => {
      const deleted = scratchpad.delete('planner', 'nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries for an agent', () => {
      scratchpad.write('planner', 'key1', 'value1');
      scratchpad.write('planner', 'key2', 'value2');
      scratchpad.write('executor', 'key3', 'value3');

      const count = scratchpad.clear('planner');

      expect(count).toBe(2);
      expect(scratchpad.readAll('planner')).toHaveLength(0);
      expect(scratchpad.readAll('executor')).toHaveLength(1);
    });

    it('should emit scratchpad:cleared event', () => {
      const clearedHandler = vi.fn();
      eventBus.on('scratchpad:cleared', clearedHandler);

      scratchpad.write('planner', 'key1', 'value1');
      scratchpad.write('planner', 'key2', 'value2');
      scratchpad.clear('planner');

      expect(clearedHandler).toHaveBeenCalledWith({
        agent: 'planner',
        count: 2,
      });
    });
  });

  describe('clearTask', () => {
    it('should clear entries for a specific task', () => {
      scratchpad.write('planner', 'plan', 'plan content', { taskId: 'task-1' });
      scratchpad.write('executor', 'result', 'result content', { taskId: 'task-1' });
      scratchpad.write('guardian', 'check', 'check content', { taskId: 'task-2' });

      const count = scratchpad.clearTask('task-1');

      expect(count).toBe(2);
      expect(scratchpad.readAll('planner')).toHaveLength(0);
      expect(scratchpad.readAll('executor')).toHaveLength(0);
      expect(scratchpad.readAll('guardian')).toHaveLength(1);
    });
  });

  describe('has', () => {
    it('should return true for existing entry', () => {
      scratchpad.write('planner', 'exists', 'value');
      expect(scratchpad.has('planner', 'exists')).toBe(true);
    });

    it('should return false for non-existent entry', () => {
      expect(scratchpad.has('planner', 'nonexistent')).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return all keys for an agent', () => {
      scratchpad.write('planner', 'key1', 'value1');
      scratchpad.write('planner', 'key2', 'value2');

      const keys = scratchpad.keys('planner');
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should return empty array for unknown agent', () => {
      const keys = scratchpad.keys('unknown' as any);
      expect(keys).toEqual([]);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      scratchpad.write('planner', 'task-plan', 'Plan for TypeScript migration');
      scratchpad.write('executor', 'cmd-output', 'npm install typescript');
      scratchpad.write('guardian', 'security-check', 'Checking for vulnerabilities', {
        metadata: { severity: 'high' },
      });
    });

    it('should search by content', () => {
      const results = scratchpad.search('TypeScript');
      expect(results).toHaveLength(2);
    });

    it('should search by key', () => {
      const results = scratchpad.search('security');
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('security-check');
    });

    it('should filter by agent', () => {
      const results = scratchpad.search('Plan', 'planner');
      expect(results).toHaveLength(1);
      expect(results[0].agent).toBe('planner');
    });

    it('should search in metadata', () => {
      const results = scratchpad.search('high');
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('security-check');
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      vi.useFakeTimers();

      scratchpad.write('planner', 'short1', 'value', { ttlMinutes: 1 });
      scratchpad.write('planner', 'short2', 'value', { ttlMinutes: 2 });
      scratchpad.write('planner', 'long', 'value', { ttlMinutes: 60 });

      vi.advanceTimersByTime(3 * 60 * 1000); // 3 minutes

      const cleaned = scratchpad.cleanup();

      expect(cleaned).toBe(2);
      expect(scratchpad.readAll('planner')).toHaveLength(1);

      vi.useRealTimers();
    });

    it('should emit scratchpad:cleanup event', () => {
      vi.useFakeTimers();

      const cleanupHandler = vi.fn();
      eventBus.on('scratchpad:cleanup', cleanupHandler);

      scratchpad.write('planner', 'short', 'value', { ttlMinutes: 1 });
      vi.advanceTimersByTime(2 * 60 * 1000);

      scratchpad.cleanup();

      expect(cleanupHandler).toHaveBeenCalledWith({
        cleaned: 1,
        remaining: 0,
      });

      vi.useRealTimers();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      scratchpad.write('planner', 'plan', 'This is a plan');
      scratchpad.write('planner', 'notes', 'Some notes');
      scratchpad.write('executor', 'output', 'Command output');

      const stats = scratchpad.getStats();

      expect(stats.totalContexts).toBe(2);
      expect(stats.totalEntries).toBe(3);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.byAgent['planner'].entries).toBe(2);
      expect(stats.byAgent['executor'].entries).toBe(1);
    });
  });

  describe('export', () => {
    it('should export state for debugging', () => {
      scratchpad.write('planner', 'plan', 'Plan content', { taskId: 'task-1' });
      scratchpad.write('planner', 'notes', 'Notes content');

      const exported = scratchpad.export();

      expect(exported['planner']).toBeDefined();
      expect(exported['planner'].taskId).toBe('task-1');
      expect(exported['planner'].entryCount).toBe(2);
      expect(exported['planner'].totalSize).toBeGreaterThan(0);
    });
  });

  describe('automatic cleanup', () => {
    it('should run cleanup on interval', () => {
      vi.useFakeTimers();

      scratchpad.write('planner', 'expires', 'value', { ttlMinutes: 1 });
      scratchpad.startCleanup(30000); // 30 second interval

      vi.advanceTimersByTime(90000); // 90 seconds

      expect(scratchpad.readAll('planner')).toHaveLength(0);

      scratchpad.stopCleanup();
      vi.useRealTimers();
    });
  });
});
