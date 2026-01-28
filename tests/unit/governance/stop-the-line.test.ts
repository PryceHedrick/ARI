import { describe, it, expect, beforeEach } from 'vitest';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { StopTheLine } from '../../../src/governance/stop-the-line.js';
import { AuditLogger } from '../../../src/kernel/audit.js';
import { EventBus } from '../../../src/kernel/event-bus.js';

describe('StopTheLine', () => {
  let stopTheLine: StopTheLine;
  let auditLogger: AuditLogger;
  let eventBus: EventBus;

  beforeEach(() => {
    const logPath = join(tmpdir(), `audit-${randomUUID()}.jsonl`);
    auditLogger = new AuditLogger(logPath);
    eventBus = new EventBus();
    stopTheLine = new StopTheLine(auditLogger, eventBus);
  });

  it('should start in non-halted state', () => {
    expect(stopTheLine.isHalted()).toBe(false);

    const status = stopTheLine.getStatus();
    expect(status.halted).toBe(false);
    expect(status.haltedBy).toBeNull();
    expect(status.haltedAt).toBeNull();
    expect(status.reason).toBeNull();
  });

  it('should halt when operator initiates halt', () => {
    stopTheLine.halt('operator', 'Emergency maintenance');

    expect(stopTheLine.isHalted()).toBe(true);

    const status = stopTheLine.getStatus();
    expect(status.halted).toBe(true);
    expect(status.haltedBy).toBe('operator');
    expect(status.haltedAt).toBeInstanceOf(Date);
    expect(status.reason).toBe('Emergency maintenance');
  });

  it('should halt when guardian initiates halt', () => {
    stopTheLine.halt('guardian', 'Security concern detected');

    expect(stopTheLine.isHalted()).toBe(true);

    const status = stopTheLine.getStatus();
    expect(status.halted).toBe(true);
    expect(status.haltedBy).toBe('guardian');
    expect(status.haltedAt).toBeInstanceOf(Date);
    expect(status.reason).toBe('Security concern detected');
  });

  it('should allow operator to resume', () => {
    stopTheLine.halt('operator', 'Test halt');
    expect(stopTheLine.isHalted()).toBe(true);

    stopTheLine.resume('operator');
    expect(stopTheLine.isHalted()).toBe(false);

    const status = stopTheLine.getStatus();
    expect(status.halted).toBe(false);
    expect(status.haltedBy).toBeNull();
    expect(status.haltedAt).toBeNull();
    expect(status.reason).toBeNull();
  });

  it('should throw error when non-operator attempts to resume', () => {
    stopTheLine.halt('guardian', 'Test halt');
    expect(stopTheLine.isHalted()).toBe(true);

    // TypeScript will not allow this call, but we test the runtime behavior
    expect(() => {
      stopTheLine.resume('guardian' as 'operator');
    }).toThrow('Only operator can resume the system');

    // System should still be halted
    expect(stopTheLine.isHalted()).toBe(true);
  });

  it('should be idempotent when halting multiple times', () => {
    stopTheLine.halt('operator', 'First halt');
    const firstStatus = stopTheLine.getStatus();

    stopTheLine.halt('guardian', 'Second halt attempt');
    const secondStatus = stopTheLine.getStatus();

    expect(secondStatus.halted).toBe(true);
    expect(secondStatus.haltedBy).toBe('operator'); // Should remain 'operator'
    expect(secondStatus.reason).toBe('First halt'); // Should remain original reason
    expect(secondStatus.haltedAt).toEqual(firstStatus.haltedAt);
  });

  it('should be idempotent when resuming multiple times', () => {
    stopTheLine.halt('operator', 'Test halt');
    stopTheLine.resume('operator');

    expect(stopTheLine.isHalted()).toBe(false);

    // Second resume should not throw
    expect(() => {
      stopTheLine.resume('operator');
    }).not.toThrow();

    expect(stopTheLine.isHalted()).toBe(false);
  });

  it('should emit system:halted event when halted', () => {
    let emittedEvent: { authority: string; reason: string; timestamp: Date } | undefined;

    eventBus.on('system:halted', (payload) => {
      emittedEvent = payload;
    });

    stopTheLine.halt('operator', 'Test halt');

    expect(emittedEvent).toBeDefined();
    expect(emittedEvent?.authority).toBe('operator');
    expect(emittedEvent?.reason).toBe('Test halt');
    expect(emittedEvent?.timestamp).toBeInstanceOf(Date);
  });

  it('should emit system:resumed event when resumed', () => {
    let emittedEvent: { authority: string; timestamp: Date } | undefined;

    eventBus.on('system:resumed', (payload) => {
      emittedEvent = payload;
    });

    stopTheLine.halt('operator', 'Test halt');
    stopTheLine.resume('operator');

    expect(emittedEvent).toBeDefined();
    expect(emittedEvent?.authority).toBe('operator');
    expect(emittedEvent?.timestamp).toBeInstanceOf(Date);
  });

  it('should log halt action to audit log', async () => {
    stopTheLine.halt('operator', 'Test halt');

    const events = auditLogger.getEvents();
    const haltEvent = events.find(e => e.action === 'system:halt');

    expect(haltEvent).toBeDefined();
    expect(haltEvent?.actor).toBe('operator');
    expect(haltEvent?.trustLevel).toBe('operator');
    expect(haltEvent?.details).toMatchObject({
      reason: 'Test halt',
    });
  });

  it('should log resume action to audit log', async () => {
    stopTheLine.halt('guardian', 'Test halt');
    stopTheLine.resume('operator');

    const events = auditLogger.getEvents();
    const resumeEvent = events.find(e => e.action === 'system:resume');

    expect(resumeEvent).toBeDefined();
    expect(resumeEvent?.actor).toBe('operator');
    expect(resumeEvent?.trustLevel).toBe('operator');
    expect(resumeEvent?.details).toMatchObject({
      previous_halted_by: 'guardian',
      previous_reason: 'Test halt',
    });
  });

  it('should preserve halt context when resuming', () => {
    const haltTime = new Date();
    stopTheLine.halt('guardian', 'Critical issue');

    const statusBeforeResume = stopTheLine.getStatus();
    expect(statusBeforeResume.haltedBy).toBe('guardian');

    stopTheLine.resume('operator');

    // Audit should contain the previous context
    const events = auditLogger.getEvents();
    const resumeEvent = events.find(e => e.action === 'system:resume');
    expect(resumeEvent?.details).toMatchObject({
      previous_halted_by: 'guardian',
      previous_reason: 'Critical issue',
    });
  });
});
