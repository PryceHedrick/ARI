/**
 * Decision Collector
 *
 * Collects decisions from the audit log for learning loop analysis.
 * Bridges the gap between audit events and the performance review system.
 *
 * Features:
 * - Extract decisions from audit log
 * - Track queries and failures for gap analysis
 * - Persist tracking data for scheduler handlers
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { homedir } from 'node:os';
import type { CognitiveBias } from '../types.js';
import type { LearningStorageAdapter, TrackedQuery, TrackedFailure } from './storage-adapter.js';
import { getDefaultStorage, dateReviver } from './storage-adapter.js';

// =============================================================================
// Types
// =============================================================================

export interface CollectedDecision {
  id: string;
  description: string;
  outcome: 'success' | 'failure' | 'partial';
  expectedValue?: number;
  actualValue?: number;
  biasesDetected?: CognitiveBias[];
  emotionalRisk?: number;
  timestamp: Date;
  source: string;
  reasoning?: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  agent: string;
  trustLevel: string;
  timestamp: string;
  details: Record<string, unknown>;
}

// =============================================================================
// Decision Collector
// =============================================================================

export class DecisionCollector {
  private auditPath: string;
  private storage: LearningStorageAdapter;

  constructor(options?: { auditPath?: string; storage?: LearningStorageAdapter }) {
    this.auditPath = options?.auditPath ?? path.join(homedir(), '.ari', 'audit.json');
    this.storage = options?.storage ?? getDefaultStorage();
  }

  /**
   * Get decisions from the last N hours
   */
  async getRecentDecisions(hours: number = 24): Promise<CollectedDecision[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const events = await this.loadAuditEvents(since);

    return events
      .filter(e => this.isDecisionEvent(e))
      .map(e => this.eventToDecision(e));
  }

  /**
   * Get decisions for a specific date range
   */
  async getDecisionsInRange(start: Date, end: Date): Promise<CollectedDecision[]> {
    const events = await this.loadAuditEvents(start);

    return events
      .filter(e => {
        const ts = new Date(e.timestamp);
        return ts >= start && ts <= end && this.isDecisionEvent(e);
      })
      .map(e => this.eventToDecision(e));
  }

  /**
   * Load audit events from the audit log
   */
  private async loadAuditEvents(since: Date): Promise<AuditEvent[]> {
    try {
      const data = await fs.readFile(this.auditPath, 'utf-8');

      // Handle JSONL format (newline-delimited JSON)
      const lines = data.trim().split('\n').filter(line => line.trim());
      const events: AuditEvent[] = [];

      for (const line of lines) {
        try {
          const event = JSON.parse(line, dateReviver) as AuditEvent;
          const eventTime = new Date(event.timestamp);
          if (eventTime >= since) {
            events.push(event);
          }
        } catch {
          // Skip malformed lines
        }
      }

      return events;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Check if an audit event represents a decision
   */
  private isDecisionEvent(event: AuditEvent): boolean {
    const decisionActions = [
      'decision',
      'task_completed',
      'task_failed',
      'action_taken',
      'choice_made',
      'approval',
      'rejection',
      'cognition:expected_value_calculated',
      'cognition:kelly_calculated',
      'execution:tool_executed',
    ];

    return decisionActions.some(action =>
      event.action.toLowerCase().includes(action.toLowerCase().replace(':', '_'))
    );
  }

  /**
   * Convert an audit event to a decision
   */
  private eventToDecision(event: AuditEvent): CollectedDecision {
    const details = event.details;

    // Determine outcome from event details
    let outcome: 'success' | 'failure' | 'partial' = 'partial';
    if (details.outcome === 'success' || details.success === true || event.action.includes('completed')) {
      outcome = 'success';
    } else if (details.outcome === 'failure' || details.success === false || event.action.includes('failed')) {
      outcome = 'failure';
    }

    // Extract biases if present
    const biasesDetected = (details.biasesDetected as CognitiveBias[] | undefined) ?? [];

    // Extract emotional risk if present
    const emotionalRisk = typeof details.emotionalRisk === 'number' ? details.emotionalRisk : undefined;

    return {
      id: event.id,
      description: this.extractDescription(event),
      outcome,
      expectedValue: typeof details.expectedValue === 'number' ? details.expectedValue : undefined,
      actualValue: typeof details.actualValue === 'number' ? details.actualValue : undefined,
      biasesDetected: biasesDetected.length > 0 ? biasesDetected : undefined,
      emotionalRisk,
      timestamp: new Date(event.timestamp),
      source: event.agent,
      reasoning: typeof details.reasoning === 'string' ? details.reasoning : undefined,
    };
  }

  /**
   * Extract a human-readable description from an event
   */
  private extractDescription(event: AuditEvent): string {
    const details = event.details;

    // Try various common description fields
    if (typeof details.description === 'string') return details.description;
    if (typeof details.message === 'string') return details.message;
    if (typeof details.content === 'string') return details.content.slice(0, 200);
    if (typeof details.task === 'string') return details.task;
    if (typeof details.action === 'string') return details.action;

    // Fall back to action name
    return event.action.replace(/_/g, ' ').replace(/:/g, ' - ');
  }

  // ---------------------------------------------------------------------------
  // Query/Failure Tracking (for gap analysis)
  // ---------------------------------------------------------------------------

  /**
   * Track a query for gap analysis
   */
  async trackQuery(query: TrackedQuery): Promise<void> {
    await this.storage.initialize();
    await this.storage.saveQuery(query);
  }

  /**
   * Track a failure for gap analysis
   */
  async trackFailure(failure: TrackedFailure): Promise<void> {
    await this.storage.initialize();
    await this.storage.saveFailure(failure);
  }

  /**
   * Get recent queries for gap analysis
   */
  async getRecentQueries(days: number = 7): Promise<TrackedQuery[]> {
    await this.storage.initialize();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.storage.loadQueries(since);
  }

  /**
   * Get recent failures for gap analysis
   */
  async getRecentFailures(days: number = 7): Promise<TrackedFailure[]> {
    await this.storage.initialize();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.storage.loadFailures(since);
  }

  // ---------------------------------------------------------------------------
  // Monthly Summary (for self-assessment)
  // ---------------------------------------------------------------------------

  /**
   * Get the previous month's summary for comparison
   */
  async getPreviousMonthSummary(): Promise<{
    decisionsCount: number;
    successRate: number;
    biasCount: number;
    insightsGenerated: number;
  }> {
    await this.storage.initialize();
    const summaries = await this.storage.loadMonthlySummaries();

    // Get previous month key
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const summary = summaries.find(s => s.month === prevMonthKey);

    if (summary) {
      return {
        decisionsCount: summary.decisionsCount,
        successRate: summary.successRate,
        biasCount: summary.biasCount,
        insightsGenerated: summary.insightsGenerated,
      };
    }

    // Default values if no previous data
    return {
      decisionsCount: 0,
      successRate: 0,
      biasCount: 0,
      insightsGenerated: 0,
    };
  }

  /**
   * Save current month's summary
   */
  async saveCurrentMonthSummary(data: {
    decisionsCount: number;
    successRate: number;
    biasCount: number;
    insightsGenerated: number;
  }): Promise<void> {
    await this.storage.initialize();

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await this.storage.saveMonthlySummary({
      month: monthKey,
      ...data,
      timestamp: now,
    });
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultCollector: DecisionCollector | null = null;

/**
 * Get the default decision collector (singleton)
 */
export function getDecisionCollector(): DecisionCollector {
  if (!defaultCollector) {
    defaultCollector = new DecisionCollector();
  }
  return defaultCollector;
}

/**
 * Create a new collector with custom options
 */
export function createDecisionCollector(options?: {
  auditPath?: string;
  storage?: LearningStorageAdapter;
}): DecisionCollector {
  return new DecisionCollector(options);
}
