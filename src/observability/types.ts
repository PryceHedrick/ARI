import { z } from 'zod';

// ── Metrics Types ────────────────────────────────────────────────────────────

export const MetricValueSchema = z.object({
  timestamp: z.string().datetime(),
  value: z.number(),
});

export type MetricValue = z.infer<typeof MetricValueSchema>;

export const MetricDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  unit: z.enum(['bytes', 'count', 'percent', 'ms', 'per_second']),
  type: z.enum(['gauge', 'counter', 'histogram']),
});

export type MetricDefinition = z.infer<typeof MetricDefinitionSchema>;

export const MetricTimeSeriesSchema = z.object({
  name: z.string(),
  values: z.array(MetricValueSchema),
  min: z.number().optional(),
  max: z.number().optional(),
  avg: z.number().optional(),
  latest: z.number().optional(),
});

export type MetricTimeSeries = z.infer<typeof MetricTimeSeriesSchema>;

export const MetricsSnapshotSchema = z.object({
  timestamp: z.string().datetime(),
  metrics: z.record(z.string(), z.number()),
});

export type MetricsSnapshot = z.infer<typeof MetricsSnapshotSchema>;

// ── Alert Types ──────────────────────────────────────────────────────────────

export const AlertSeveritySchema = z.enum(['info', 'warning', 'critical']);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertStatusSchema = z.enum(['active', 'acknowledged', 'resolved']);
export type AlertStatus = z.infer<typeof AlertStatusSchema>;

export const AlertSchema = z.object({
  id: z.string(),
  severity: AlertSeveritySchema,
  status: AlertStatusSchema,
  title: z.string(),
  message: z.string(),
  source: z.string(), // EventBus event type that triggered
  details: z.record(z.string(), z.unknown()).optional(),
  count: z.number().default(1), // Deduplication count
  firstSeenAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().optional(),
  acknowledgedBy: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
  resolvedBy: z.string().optional(),
});

export type Alert = z.infer<typeof AlertSchema>;

export const AlertSummarySchema = z.object({
  total: z.number(),
  active: z.number(),
  acknowledged: z.number(),
  resolved: z.number(),
  bySeverity: z.object({
    info: z.number(),
    warning: z.number(),
    critical: z.number(),
  }),
});

export type AlertSummary = z.infer<typeof AlertSummarySchema>;

export const AlertRuleSchema = z.object({
  eventType: z.string(),
  severity: AlertSeveritySchema,
  titleTemplate: z.string(),
  messageTemplate: z.string(),
  dedupKey: z.string().optional(), // Field in payload to use for deduplication
});

export type AlertRule = z.infer<typeof AlertRuleSchema>;

// ── Execution History Types ──────────────────────────────────────────────────

export const ExecutionResultSchema = z.enum(['success', 'failure', 'skipped', 'timeout']);
export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

export const ExecutionRecordSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  taskName: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  duration: z.number(), // milliseconds
  result: ExecutionResultSchema,
  error: z.string().optional(),
  triggeredBy: z.enum(['scheduler', 'manual', 'api', 'subagent']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ExecutionRecord = z.infer<typeof ExecutionRecordSchema>;

export const TaskExecutionStatsSchema = z.object({
  taskId: z.string(),
  taskName: z.string(),
  totalExecutions: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  successRate: z.number(), // 0-100
  avgDuration: z.number(),
  minDuration: z.number(),
  maxDuration: z.number(),
  lastExecution: ExecutionRecordSchema.optional(),
});

export type TaskExecutionStats = z.infer<typeof TaskExecutionStatsSchema>;

// ── Persisted State Schemas ──────────────────────────────────────────────────

export const MetricsHistoryFileSchema = z.object({
  version: z.literal(1),
  snapshots: z.array(MetricsSnapshotSchema),
});

export type MetricsHistoryFile = z.infer<typeof MetricsHistoryFileSchema>;

export const AlertsFileSchema = z.object({
  version: z.literal(1),
  alerts: z.array(AlertSchema),
});

export type AlertsFile = z.infer<typeof AlertsFileSchema>;

export const ExecutionHistoryFileSchema = z.object({
  version: z.literal(1),
  executions: z.array(ExecutionRecordSchema),
});

export type ExecutionHistoryFile = z.infer<typeof ExecutionHistoryFileSchema>;
