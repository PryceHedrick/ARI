/**
 * ARI Daily Audit System
 *
 * Generates comprehensive daily reports of all ARI activity.
 * Provides full transparency into what ARI did, decided, and learned.
 *
 * Schedule: Runs automatically at end of day (configurable)
 * Storage: ~/.ari/audits/YYYY-MM-DD.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const AUDIT_DIR = path.join(process.env.HOME || '~', '.ari', 'audits');

// Activity types ARI can perform
export type ActivityType =
  | 'task_completed'
  | 'task_failed'
  | 'notification_sent'
  | 'notification_batched'
  | 'knowledge_fetched'
  | 'insight_generated'
  | 'decision_made'
  | 'error_occurred'
  | 'user_interaction'
  | 'system_event'
  | 'council_vote'
  | 'threshold_alert';

// Single activity entry
export interface ActivityEntry {
  id: string;
  timestamp: string;
  type: ActivityType;
  domain?: string;
  title: string;
  description: string;
  details?: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'pending' | 'skipped';
  tokensUsed?: number;
  costEstimate?: number;
}

// Daily audit report
export interface DailyAudit {
  date: string;
  generatedAt: string;
  hash: string;
  previousHash: string;
  summary: {
    totalActivities: number;
    successful: number;
    failed: number;
    notificationsSent: number;
    notificationsBatched: number;
    tasksCompleted: number;
    insightsGenerated: number;
    estimatedCost: number;
    tokensUsed: number;
  };
  activities: ActivityEntry[];
  highlights: string[];
  issues: string[];
  recommendations: string[];
}

// Threshold configuration for notifications
export interface ThresholdConfig {
  id: string;
  name: string;
  description: string;
  domain?: string;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'change';
    value: number;
    timeframeMinutes?: number;
  };
  severity: 'info' | 'warning' | 'critical';
  cooldownMinutes: number;
  lastTriggered?: string;
  enabled: boolean;
}

// Default thresholds
export const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  {
    id: 'daily_cost_warning',
    name: 'Daily Cost Warning',
    description: 'Alert when daily API spend approaches limit',
    condition: { metric: 'daily_cost', operator: 'gte', value: 7.0 },
    severity: 'warning',
    cooldownMinutes: 60,
    enabled: true,
  },
  {
    id: 'daily_cost_critical',
    name: 'Daily Cost Critical',
    description: 'Alert when daily API spend exceeds limit',
    condition: { metric: 'daily_cost', operator: 'gte', value: 9.0 },
    severity: 'critical',
    cooldownMinutes: 30,
    enabled: true,
  },
  {
    id: 'error_spike',
    name: 'Error Spike',
    description: 'Alert when errors increase significantly',
    condition: { metric: 'error_count', operator: 'gte', value: 5, timeframeMinutes: 60 },
    severity: 'warning',
    cooldownMinutes: 30,
    enabled: true,
  },
  {
    id: 'task_queue_backup',
    name: 'Task Queue Backup',
    description: 'Alert when tasks are piling up',
    condition: { metric: 'pending_tasks', operator: 'gte', value: 10 },
    severity: 'warning',
    cooldownMinutes: 120,
    enabled: true,
  },
  {
    id: 'high_value_opportunity',
    name: 'High Value Opportunity',
    description: 'Alert for significant opportunities',
    condition: { metric: 'opportunity_score', operator: 'gte', value: 0.8 },
    severity: 'info',
    cooldownMinutes: 0,
    enabled: true,
  },
];

/**
 * Daily Audit System
 */
export class DailyAuditSystem {
  private activities: ActivityEntry[] = [];
  private thresholds: ThresholdConfig[] = [...DEFAULT_THRESHOLDS];
  private metrics: Map<string, number> = new Map();
  private todayDate: string;

  constructor() {
    this.todayDate = new Date().toISOString().split('T')[0];
  }

  /**
   * Initialize the audit system
   */
  async init(): Promise<void> {
    await fs.mkdir(AUDIT_DIR, { recursive: true });
    await this.loadTodayActivities();
  }

  /**
   * Load today's activities from disk
   */
  private async loadTodayActivities(): Promise<void> {
    try {
      const filepath = path.join(AUDIT_DIR, `${this.todayDate}.json`);
      const data = await fs.readFile(filepath, 'utf-8');
      const audit = JSON.parse(data) as DailyAudit;
      this.activities = audit.activities;
    } catch {
      // No existing audit for today
      this.activities = [];
    }
  }

  /**
   * Log an activity
   */
  async logActivity(
    type: ActivityType,
    title: string,
    description: string,
    options: {
      domain?: string;
      details?: Record<string, unknown>;
      outcome?: ActivityEntry['outcome'];
      tokensUsed?: number;
      costEstimate?: number;
    } = {}
  ): Promise<ActivityEntry> {
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      domain: options.domain,
      title,
      description,
      details: options.details,
      outcome: options.outcome || 'success',
      tokensUsed: options.tokensUsed,
      costEstimate: options.costEstimate,
    };

    this.activities.push(entry);

    // Update metrics
    this.updateMetrics(entry);

    // Check thresholds
    await this.checkThresholds();

    // Save incrementally
    await this.saveActivities();

    return entry;
  }

  /**
   * Update metrics based on activity
   */
  private updateMetrics(entry: ActivityEntry): void {
    // Update cost tracking
    if (entry.costEstimate) {
      const currentCost = this.metrics.get('daily_cost') || 0;
      this.metrics.set('daily_cost', currentCost + entry.costEstimate);
    }

    // Update token tracking
    if (entry.tokensUsed) {
      const currentTokens = this.metrics.get('daily_tokens') || 0;
      this.metrics.set('daily_tokens', currentTokens + entry.tokensUsed);
    }

    // Update error count
    if (entry.outcome === 'failure') {
      const errorCount = this.metrics.get('error_count') || 0;
      this.metrics.set('error_count', errorCount + 1);
    }

    // Update activity counts by type
    const typeCount = this.metrics.get(`count_${entry.type}`) || 0;
    this.metrics.set(`count_${entry.type}`, typeCount + 1);
  }

  /**
   * Check all thresholds and trigger alerts
   */
  async checkThresholds(): Promise<ThresholdConfig[]> {
    const triggered: ThresholdConfig[] = [];

    for (const threshold of this.thresholds) {
      if (!threshold.enabled) continue;

      // Check cooldown
      if (threshold.lastTriggered) {
        const cooldownMs = threshold.cooldownMinutes * 60 * 1000;
        const timeSince = Date.now() - new Date(threshold.lastTriggered).getTime();
        if (timeSince < cooldownMs) continue;
      }

      // Check condition
      const metricValue = this.metrics.get(threshold.condition.metric) || 0;
      let shouldTrigger = false;

      switch (threshold.condition.operator) {
        case 'gt':
          shouldTrigger = metricValue > threshold.condition.value;
          break;
        case 'gte':
          shouldTrigger = metricValue >= threshold.condition.value;
          break;
        case 'lt':
          shouldTrigger = metricValue < threshold.condition.value;
          break;
        case 'lte':
          shouldTrigger = metricValue <= threshold.condition.value;
          break;
        case 'eq':
          shouldTrigger = metricValue === threshold.condition.value;
          break;
      }

      if (shouldTrigger) {
        threshold.lastTriggered = new Date().toISOString();
        triggered.push(threshold);

        // Log the threshold alert
        await this.logActivity(
          'threshold_alert',
          `Threshold: ${threshold.name}`,
          `${threshold.description}. Current value: ${metricValue}`,
          {
            details: { threshold, metricValue },
            outcome: 'success',
          }
        );
      }
    }

    return triggered;
  }

  /**
   * Save activities to disk
   */
  private async saveActivities(): Promise<void> {
    const filepath = path.join(AUDIT_DIR, `${this.todayDate}.json`);
    const audit = await this.generateAudit();
    await fs.writeFile(filepath, JSON.stringify(audit, null, 2));
  }

  /**
   * Generate the daily audit report
   */
  async generateAudit(): Promise<DailyAudit> {
    // Get previous audit hash for chain
    const previousHash = await this.getPreviousHash();

    // Calculate summary
    const summary = {
      totalActivities: this.activities.length,
      successful: this.activities.filter(a => a.outcome === 'success').length,
      failed: this.activities.filter(a => a.outcome === 'failure').length,
      notificationsSent: this.activities.filter(a => a.type === 'notification_sent').length,
      notificationsBatched: this.activities.filter(a => a.type === 'notification_batched').length,
      tasksCompleted: this.activities.filter(a => a.type === 'task_completed').length,
      insightsGenerated: this.activities.filter(a => a.type === 'insight_generated').length,
      estimatedCost: this.metrics.get('daily_cost') || 0,
      tokensUsed: this.metrics.get('daily_tokens') || 0,
    };

    // Generate highlights
    const highlights = this.generateHighlights();

    // Identify issues
    const issues = this.identifyIssues();

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    // Create audit object (without hash)
    const auditData = {
      date: this.todayDate,
      generatedAt: new Date().toISOString(),
      previousHash,
      summary,
      activities: this.activities,
      highlights,
      issues,
      recommendations,
    };

    // Calculate hash
    const hash = createHash('sha256')
      .update(JSON.stringify(auditData))
      .digest('hex');

    return {
      ...auditData,
      hash,
    };
  }

  /**
   * Get previous day's audit hash
   */
  private async getPreviousHash(): Promise<string> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    try {
      const filepath = path.join(AUDIT_DIR, `${yesterdayStr}.json`);
      const data = await fs.readFile(filepath, 'utf-8');
      const audit = JSON.parse(data) as DailyAudit;
      return audit.hash;
    } catch {
      return '0'.repeat(64); // Genesis hash
    }
  }

  /**
   * Generate highlights from activities
   */
  private generateHighlights(): string[] {
    const highlights: string[] = [];

    const completed = this.activities.filter(a => a.type === 'task_completed');
    if (completed.length > 0) {
      highlights.push(`Completed ${completed.length} task${completed.length > 1 ? 's' : ''}`);
    }

    const insights = this.activities.filter(a => a.type === 'insight_generated');
    if (insights.length > 0) {
      highlights.push(`Generated ${insights.length} insight${insights.length > 1 ? 's' : ''}`);
    }

    const cost = this.metrics.get('daily_cost') || 0;
    if (cost > 0) {
      highlights.push(`API cost: $${cost.toFixed(2)}`);
    }

    return highlights;
  }

  /**
   * Identify issues from activities
   */
  private identifyIssues(): string[] {
    const issues: string[] = [];

    const failures = this.activities.filter(a => a.outcome === 'failure');
    if (failures.length > 0) {
      issues.push(`${failures.length} failed operation${failures.length > 1 ? 's' : ''}`);
    }

    const errors = this.activities.filter(a => a.type === 'error_occurred');
    if (errors.length >= 3) {
      issues.push(`High error rate: ${errors.length} errors today`);
    }

    return issues;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const cost = this.metrics.get('daily_cost') || 0;
    if (cost > 7) {
      recommendations.push('Consider batching more tasks to reduce API calls');
    }

    const failures = this.activities.filter(a => a.outcome === 'failure').length;
    if (failures > 2) {
      recommendations.push('Review failed tasks for patterns');
    }

    return recommendations;
  }

  /**
   * Get today's audit (for dashboard)
   */
  async getTodayAudit(): Promise<DailyAudit> {
    return this.generateAudit();
  }

  /**
   * Get audit for specific date
   */
  async getAudit(date: string): Promise<DailyAudit | null> {
    try {
      const filepath = path.join(AUDIT_DIR, `${date}.json`);
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data) as DailyAudit;
    } catch {
      return null;
    }
  }

  /**
   * List all available audits
   */
  async listAudits(): Promise<string[]> {
    try {
      const files = await fs.readdir(AUDIT_DIR);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
        .sort()
        .reverse();
    } catch {
      return [];
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Update threshold configuration
   */
  updateThreshold(id: string, updates: Partial<ThresholdConfig>): void {
    const threshold = this.thresholds.find(t => t.id === id);
    if (threshold) {
      Object.assign(threshold, updates);
    }
  }

  /**
   * Add custom threshold
   */
  addThreshold(threshold: ThresholdConfig): void {
    this.thresholds.push(threshold);
  }
}

// Singleton instance
export const dailyAudit = new DailyAuditSystem();
