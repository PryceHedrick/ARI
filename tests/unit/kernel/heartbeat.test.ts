import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HeartbeatMonitor, createHeartbeatMonitor } from '../../../src/kernel/heartbeat.js';
import { EventBus } from '../../../src/kernel/event-bus.js';

describe('HeartbeatMonitor', () => {
  let heartbeatMonitor: HeartbeatMonitor;
  let eventBus: EventBus;

  beforeEach(() => {
    vi.useFakeTimers();
    eventBus = new EventBus();
    heartbeatMonitor = new HeartbeatMonitor(eventBus, {
      intervalMs: 1000,
      staggerMs: 100,
      failureThreshold: 3,
      timeoutMs: 500,
    });
  });

  afterEach(() => {
    heartbeatMonitor.stop();
    vi.useRealTimers();
  });

  describe('register', () => {
    it('should register a component with unknown status', () => {
      heartbeatMonitor.register('test-component', 'kernel', async () => ({
        status: 'ok',
      }));

      const status = heartbeatMonitor.getComponentStatus('test-component');
      expect(status).toBeDefined();
      expect(status?.componentId).toBe('test-component');
      expect(status?.componentType).toBe('kernel');
      expect(status?.status).toBe('unknown');
    });

    it('should start monitoring immediately if already started', async () => {
      heartbeatMonitor.start();
      
      let beatCalled = false;
      heartbeatMonitor.register('late-component', 'agent', async () => {
        beatCalled = true;
        return { status: 'ok' };
      });

      await vi.advanceTimersByTimeAsync(200);
      expect(beatCalled).toBe(true);
    });
  });

  describe('unregister', () => {
    it('should remove a component from monitoring', () => {
      heartbeatMonitor.register('test-component', 'kernel', async () => ({
        status: 'ok',
      }));

      expect(heartbeatMonitor.getComponentStatus('test-component')).toBeDefined();

      heartbeatMonitor.unregister('test-component');

      expect(heartbeatMonitor.getComponentStatus('test-component')).toBeUndefined();
    });
  });

  describe('start', () => {
    it('should emit heartbeat_started event', () => {
      const startedHandler = vi.fn();
      eventBus.on('system:heartbeat_started', startedHandler);

      heartbeatMonitor.register('comp1', 'kernel', async () => ({ ok: true }));
      heartbeatMonitor.start();

      expect(startedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          componentCount: 1,
        })
      );
    });

    it('should stagger component heartbeats', async () => {
      const beat1 = vi.fn().mockResolvedValue({ status: 'ok' });
      const beat2 = vi.fn().mockResolvedValue({ status: 'ok' });
      const beat3 = vi.fn().mockResolvedValue({ status: 'ok' });

      heartbeatMonitor.register('comp1', 'kernel', beat1);
      heartbeatMonitor.register('comp2', 'agent', beat2);
      heartbeatMonitor.register('comp3', 'system', beat3);

      heartbeatMonitor.start();

      // At t=0, comp1 should beat
      await vi.advanceTimersByTimeAsync(0);
      expect(beat1).toHaveBeenCalledTimes(1);
      expect(beat2).toHaveBeenCalledTimes(0);
      expect(beat3).toHaveBeenCalledTimes(0);

      // At t=100, comp2 should beat
      await vi.advanceTimersByTimeAsync(100);
      expect(beat2).toHaveBeenCalledTimes(1);
      expect(beat3).toHaveBeenCalledTimes(0);

      // At t=200, comp3 should beat
      await vi.advanceTimersByTimeAsync(100);
      expect(beat3).toHaveBeenCalledTimes(1);
    });

    it('should not start twice', () => {
      heartbeatMonitor.register('comp1', 'kernel', async () => ({ ok: true }));
      heartbeatMonitor.start();
      heartbeatMonitor.start(); // Second call should be ignored

      expect(heartbeatMonitor.isStarted()).toBe(true);
    });
  });

  describe('stop', () => {
    it('should emit heartbeat_stopped event', () => {
      const stoppedHandler = vi.fn();
      eventBus.on('system:heartbeat_stopped', stoppedHandler);

      heartbeatMonitor.start();
      heartbeatMonitor.stop();

      expect(stoppedHandler).toHaveBeenCalled();
      expect(heartbeatMonitor.isStarted()).toBe(false);
    });

    it('should stop all interval timers', async () => {
      const beatFn = vi.fn().mockResolvedValue({ status: 'ok' });
      heartbeatMonitor.register('comp1', 'kernel', beatFn);
      heartbeatMonitor.start();

      await vi.advanceTimersByTimeAsync(0);
      expect(beatFn).toHaveBeenCalledTimes(1);

      heartbeatMonitor.stop();

      // After stopping, no more beats should occur
      await vi.advanceTimersByTimeAsync(5000);
      expect(beatFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('heartbeat execution', () => {
    it('should mark component as healthy on successful beat', async () => {
      heartbeatMonitor.register('comp1', 'kernel', async () => ({ status: 'ok' }));
      heartbeatMonitor.start();

      await vi.advanceTimersByTimeAsync(0);

      const status = heartbeatMonitor.getComponentStatus('comp1');
      expect(status?.status).toBe('healthy');
      expect(status?.consecutiveFailures).toBe(0);
    });

    it('should emit heartbeat event on successful beat', async () => {
      const heartbeatHandler = vi.fn();
      eventBus.on('system:heartbeat', heartbeatHandler);

      heartbeatMonitor.register('comp1', 'kernel', async () => ({ value: 42 }));
      heartbeatMonitor.start();

      await vi.advanceTimersByTimeAsync(0);

      expect(heartbeatHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          componentId: 'comp1',
          status: 'healthy',
          metrics: { value: 42 },
        })
      );
    });

    it('should mark component as degraded on slow response', async () => {
      heartbeatMonitor.register('comp1', 'kernel', async () => {
        // Simulate slow response (80% of timeout = 400ms)
        await new Promise(resolve => setTimeout(resolve, 410));
        return { status: 'slow' };
      });
      heartbeatMonitor.start();

      await vi.advanceTimersByTimeAsync(500);

      const status = heartbeatMonitor.getComponentStatus('comp1');
      expect(status?.status).toBe('degraded');
    });

    it('should mark component as degraded after first failure', async () => {
      heartbeatMonitor.register('comp1', 'kernel', async () => {
        throw new Error('Beat failed');
      });
      heartbeatMonitor.start();

      await vi.advanceTimersByTimeAsync(0);

      const status = heartbeatMonitor.getComponentStatus('comp1');
      expect(status?.status).toBe('degraded');
      expect(status?.consecutiveFailures).toBe(1);
    });

    it('should mark component as unhealthy after threshold failures', async () => {
      const beatFn = vi.fn().mockRejectedValue(new Error('Beat failed'));
      heartbeatMonitor.register('comp1', 'kernel', beatFn);
      heartbeatMonitor.start();

      // First failure
      await vi.advanceTimersByTimeAsync(0);
      expect(heartbeatMonitor.getComponentStatus('comp1')?.consecutiveFailures).toBe(1);

      // Second failure
      await vi.advanceTimersByTimeAsync(1000);
      expect(heartbeatMonitor.getComponentStatus('comp1')?.consecutiveFailures).toBe(2);

      // Third failure - should now be unhealthy
      await vi.advanceTimersByTimeAsync(1000);
      const status = heartbeatMonitor.getComponentStatus('comp1');
      expect(status?.status).toBe('unhealthy');
      expect(status?.consecutiveFailures).toBe(3);
    });

    it('should emit heartbeat_failure event when unhealthy', async () => {
      const failureHandler = vi.fn();
      eventBus.on('system:heartbeat_failure', failureHandler);

      heartbeatMonitor.register('comp1', 'kernel', async () => {
        throw new Error('Component down');
      });
      heartbeatMonitor.start();

      // Trigger 3 failures
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      expect(failureHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          componentId: 'comp1',
          consecutiveFailures: 3,
          error: 'Component down',
        })
      );
    });

    it('should reset failure count on successful beat', async () => {
      let failCount = 0;
      heartbeatMonitor.register('comp1', 'kernel', async () => {
        failCount++;
        if (failCount <= 2) {
          throw new Error('Temporary failure');
        }
        return { status: 'recovered' };
      });
      heartbeatMonitor.start();

      // Two failures
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      expect(heartbeatMonitor.getComponentStatus('comp1')?.consecutiveFailures).toBe(2);

      // Third call succeeds
      await vi.advanceTimersByTimeAsync(1000);
      const status = heartbeatMonitor.getComponentStatus('comp1');
      expect(status?.status).toBe('healthy');
      expect(status?.consecutiveFailures).toBe(0);
    });

    it('should handle timeout correctly', async () => {
      heartbeatMonitor.register('comp1', 'kernel', async () => {
        // This will timeout (>500ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        return { status: 'ok' };
      });
      heartbeatMonitor.start();

      await vi.advanceTimersByTimeAsync(600);

      const status = heartbeatMonitor.getComponentStatus('comp1');
      expect(status?.status).toBe('degraded');
      expect(status?.consecutiveFailures).toBe(1);
    });
  });

  describe('getReport', () => {
    it('should return complete report of all components', async () => {
      heartbeatMonitor.register('healthy1', 'kernel', async () => ({ ok: true }));
      heartbeatMonitor.register('healthy2', 'agent', async () => ({ ok: true }));
      heartbeatMonitor.register('failing', 'system', async () => {
        throw new Error('Down');
      });

      heartbeatMonitor.start();

      // Let initial beats complete
      await vi.advanceTimersByTimeAsync(300);

      const report = heartbeatMonitor.getReport();

      expect(report.totalComponents).toBe(3);
      expect(report.healthy).toBe(2);
      expect(report.degraded).toBe(1);
      expect(report.unhealthy).toBe(0);
      expect(report.components).toHaveLength(3);
    });
  });

  describe('getComponentsByStatus', () => {
    it('should filter components by status', async () => {
      heartbeatMonitor.register('healthy1', 'kernel', async () => ({ ok: true }));
      heartbeatMonitor.register('healthy2', 'agent', async () => ({ ok: true }));
      heartbeatMonitor.register('failing', 'system', async () => {
        throw new Error('Down');
      });

      heartbeatMonitor.start();
      await vi.advanceTimersByTimeAsync(300);

      const healthy = heartbeatMonitor.getComponentsByStatus('healthy');
      expect(healthy).toHaveLength(2);

      const degraded = heartbeatMonitor.getComponentsByStatus('degraded');
      expect(degraded).toHaveLength(1);
    });
  });

  describe('isHealthy', () => {
    it('should return true when all components are healthy', async () => {
      heartbeatMonitor.register('comp1', 'kernel', async () => ({ ok: true }));
      heartbeatMonitor.register('comp2', 'agent', async () => ({ ok: true }));

      heartbeatMonitor.start();
      await vi.advanceTimersByTimeAsync(200);

      expect(heartbeatMonitor.isHealthy()).toBe(true);
    });

    it('should return false when any component is not healthy', async () => {
      heartbeatMonitor.register('comp1', 'kernel', async () => ({ ok: true }));
      heartbeatMonitor.register('comp2', 'agent', async () => {
        throw new Error('Down');
      });

      heartbeatMonitor.start();
      await vi.advanceTimersByTimeAsync(200);

      expect(heartbeatMonitor.isHealthy()).toBe(false);
    });
  });

  describe('hasUnhealthyComponents', () => {
    it('should return true when any component is unhealthy', async () => {
      heartbeatMonitor.register('comp1', 'kernel', async () => {
        throw new Error('Down');
      });

      heartbeatMonitor.start();

      // Trigger 3 failures to become unhealthy
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      expect(heartbeatMonitor.hasUnhealthyComponents()).toBe(true);
    });

    it('should return false when no component is unhealthy', async () => {
      heartbeatMonitor.register('comp1', 'kernel', async () => ({ ok: true }));

      heartbeatMonitor.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(heartbeatMonitor.hasUnhealthyComponents()).toBe(false);
    });
  });

  describe('checkComponent', () => {
    it('should manually trigger a heartbeat and return status', async () => {
      let callCount = 0;
      heartbeatMonitor.register('comp1', 'kernel', async () => {
        callCount++;
        return { callCount };
      });

      // Don't start automatic monitoring
      const status = await heartbeatMonitor.checkComponent('comp1');

      expect(status?.status).toBe('healthy');
      expect(status?.metrics).toEqual({ callCount: 1 });
      expect(callCount).toBe(1);
    });
  });

  describe('createHeartbeatMonitor factory', () => {
    it('should create a HeartbeatMonitor instance', () => {
      const monitor = createHeartbeatMonitor(eventBus);
      expect(monitor).toBeInstanceOf(HeartbeatMonitor);
    });

    it('should apply custom config', () => {
      const monitor = createHeartbeatMonitor(eventBus, {
        intervalMs: 60000,
        failureThreshold: 5,
      });

      const config = monitor.getConfig();
      expect(config.intervalMs).toBe(60000);
      expect(config.failureThreshold).toBe(5);
    });
  });
});
