import type { EventBus } from './event-bus.js';

/**
 * Configuration for the heartbeat monitor
 */
export interface HeartbeatConfig {
  intervalMs: number;        // Default: 30000 (30s)
  staggerMs: number;         // Default: 2000 (2s between components)
  failureThreshold: number;  // Default: 3 consecutive failures
  timeoutMs: number;         // Default: 5000 (5s timeout per beat)
}

/**
 * Component type categories
 */
export type ComponentType = 'kernel' | 'agent' | 'system' | 'autonomous' | 'governance';

/**
 * Health status for a component
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Heartbeat data for a single component
 */
export interface ComponentHeartbeat {
  componentId: string;
  componentType: ComponentType;
  lastBeat: Date;
  consecutiveFailures: number;
  status: HealthStatus;
  metrics: Record<string, unknown>;
  latencyMs: number;
}

/**
 * Report of all component heartbeats
 */
export interface HeartbeatReport {
  timestamp: Date;
  totalComponents: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  unknown: number;
  components: ComponentHeartbeat[];
}

/**
 * HeartbeatMonitor - System-wide component health monitoring
 * 
 * Based on Mission Control's heartbeat system:
 * - Staggered component wakeups to prevent thundering herd
 * - Failure detection with configurable thresholds
 * - EventBus integration for real-time alerts
 */
export class HeartbeatMonitor {
  private heartbeats = new Map<string, ComponentHeartbeat>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private beatFunctions = new Map<string, () => Promise<Record<string, unknown>>>();
  private readonly eventBus: EventBus;
  private readonly config: HeartbeatConfig;
  private started = false;

  constructor(eventBus: EventBus, config: Partial<HeartbeatConfig> = {}) {
    this.eventBus = eventBus;
    this.config = {
      intervalMs: config.intervalMs ?? 30000,
      staggerMs: config.staggerMs ?? 2000,
      failureThreshold: config.failureThreshold ?? 3,
      timeoutMs: config.timeoutMs ?? 5000,
    };
  }

  /**
   * Register a component for heartbeat monitoring
   * 
   * @param componentId - Unique identifier for the component
   * @param componentType - Type category of the component
   * @param beatFn - Async function that returns health metrics
   */
  register(
    componentId: string,
    componentType: ComponentType,
    beatFn: () => Promise<Record<string, unknown>>
  ): void {
    this.beatFunctions.set(componentId, beatFn);

    this.heartbeats.set(componentId, {
      componentId,
      componentType,
      lastBeat: new Date(0), // Never
      consecutiveFailures: 0,
      status: 'unknown',
      metrics: {},
      latencyMs: 0,
    });

    // If already started, begin monitoring this component immediately
    if (this.started) {
      this.startComponentHeartbeat(componentId);
    }
  }

  /**
   * Unregister a component from monitoring
   */
  unregister(componentId: string): void {
    const interval = this.intervals.get(componentId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(componentId);
    }
    this.beatFunctions.delete(componentId);
    this.heartbeats.delete(componentId);
  }

  /**
   * Start the heartbeat monitor
   * Components are started with staggered timing to prevent thundering herd
   */
  start(): void {
    if (this.started) return;
    this.started = true;

    let stagger = 0;
    for (const componentId of this.beatFunctions.keys()) {
      setTimeout(() => {
        this.startComponentHeartbeat(componentId);
      }, stagger);
      stagger += this.config.staggerMs;
    }

    this.eventBus.emit('system:heartbeat_started', {
      timestamp: new Date(),
      componentCount: this.beatFunctions.size,
    });
  }

  /**
   * Start heartbeat monitoring for a single component
   */
  private startComponentHeartbeat(componentId: string): void {
    // Clear any existing interval
    const existingInterval = this.intervals.get(componentId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(() => {
      void this.performBeat(componentId);
    }, this.config.intervalMs);

    this.intervals.set(componentId, interval);

    // Perform immediate first beat
    void this.performBeat(componentId);
  }

  /**
   * Perform a heartbeat check for a component
   */
  private async performBeat(componentId: string): Promise<void> {
    const beatFn = this.beatFunctions.get(componentId);
    const heartbeat = this.heartbeats.get(componentId);

    if (!beatFn || !heartbeat) return;

    const startTime = Date.now();

    try {
      // Race between beat function and timeout
      const metrics = await Promise.race([
        beatFn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Heartbeat timeout')), this.config.timeoutMs)
        ),
      ]);

      const latencyMs = Date.now() - startTime;

      heartbeat.lastBeat = new Date();
      heartbeat.consecutiveFailures = 0;
      heartbeat.latencyMs = latencyMs;
      heartbeat.metrics = metrics;

      // Determine status based on latency
      if (latencyMs > this.config.timeoutMs * 0.8) {
        heartbeat.status = 'degraded';
      } else {
        heartbeat.status = 'healthy';
      }

      this.eventBus.emit('system:heartbeat', {
        componentId,
        status: heartbeat.status,
        timestamp: heartbeat.lastBeat,
        metrics,
        latencyMs,
      });

    } catch (error) {
      heartbeat.consecutiveFailures++;
      heartbeat.latencyMs = Date.now() - startTime;

      if (heartbeat.consecutiveFailures >= this.config.failureThreshold) {
        heartbeat.status = 'unhealthy';

        this.eventBus.emit('system:heartbeat_failure', {
          componentId,
          consecutiveFailures: heartbeat.consecutiveFailures,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : String(error),
        });
      } else {
        heartbeat.status = 'degraded';
      }

      this.eventBus.emit('system:heartbeat', {
        componentId,
        status: heartbeat.status,
        timestamp: new Date(),
        metrics: { error: error instanceof Error ? error.message : String(error) },
        latencyMs: heartbeat.latencyMs,
      });
    }
  }

  /**
   * Manually trigger a heartbeat for a component
   */
  async checkComponent(componentId: string): Promise<ComponentHeartbeat | undefined> {
    await this.performBeat(componentId);
    return this.heartbeats.get(componentId);
  }

  /**
   * Get a full report of all component heartbeats
   */
  getReport(): HeartbeatReport {
    const components = Array.from(this.heartbeats.values());

    return {
      timestamp: new Date(),
      totalComponents: components.length,
      healthy: components.filter(c => c.status === 'healthy').length,
      degraded: components.filter(c => c.status === 'degraded').length,
      unhealthy: components.filter(c => c.status === 'unhealthy').length,
      unknown: components.filter(c => c.status === 'unknown').length,
      components,
    };
  }

  /**
   * Get status for a specific component
   */
  getComponentStatus(componentId: string): ComponentHeartbeat | undefined {
    return this.heartbeats.get(componentId);
  }

  /**
   * Get all components with a specific status
   */
  getComponentsByStatus(status: HealthStatus): ComponentHeartbeat[] {
    return Array.from(this.heartbeats.values()).filter(c => c.status === status);
  }

  /**
   * Check if all components are healthy
   */
  isHealthy(): boolean {
    const components = Array.from(this.heartbeats.values());
    return components.length > 0 && components.every(c => c.status === 'healthy');
  }

  /**
   * Check if any component is unhealthy
   */
  hasUnhealthyComponents(): boolean {
    return Array.from(this.heartbeats.values()).some(c => c.status === 'unhealthy');
  }

  /**
   * Stop the heartbeat monitor
   */
  stop(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    this.started = false;

    this.eventBus.emit('system:heartbeat_stopped', {
      timestamp: new Date(),
    });
  }

  /**
   * Get the current configuration
   */
  getConfig(): HeartbeatConfig {
    return { ...this.config };
  }

  /**
   * Check if the monitor is currently running
   */
  isStarted(): boolean {
    return this.started;
  }
}

/**
 * Factory function to create a HeartbeatMonitor
 */
export function createHeartbeatMonitor(
  eventBus: EventBus,
  config?: Partial<HeartbeatConfig>
): HeartbeatMonitor {
  return new HeartbeatMonitor(eventBus, config);
}
