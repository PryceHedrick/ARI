/**
 * ARI Autonomous Agent Types
 *
 * These types define the autonomous operation layer that allows ARI
 * to work independently and receive commands via Pushover.
 */

import { z } from 'zod';

// ── Task Types ─────────────────────────────────────────────────────────────

export const TaskPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskSourceSchema = z.enum(['pushover', 'queue', 'schedule', 'internal', 'api']);
export type TaskSource = z.infer<typeof TaskSourceSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(10000),
  source: TaskSourceSchema,
  priority: TaskPrioritySchema.default('normal'),
  status: TaskStatusSchema.default('pending'),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  result: z.string().optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// ── Pushover Types ─────────────────────────────────────────────────────────

export const PushoverMessageSchema = z.object({
  id: z.number(),
  message: z.string(),
  app: z.string(),
  aid: z.number(),
  date: z.number(),
  priority: z.number().optional(),
  acked: z.number().optional(),
  umid: z.number(),
});

export type PushoverMessage = z.infer<typeof PushoverMessageSchema>;

export const PushoverResponseSchema = z.object({
  status: z.number(),
  request: z.string(),
  messages: z.array(PushoverMessageSchema).optional(),
  errors: z.array(z.string()).optional(),
});

export type PushoverResponse = z.infer<typeof PushoverResponseSchema>;

// ── Agent Config ───────────────────────────────────────────────────────────

export const AutonomousConfigSchema = z.object({
  enabled: z.boolean().default(false),
  pollIntervalMs: z.number().min(1000).default(5000),
  maxConcurrentTasks: z.number().min(1).max(5).default(1),
  pushover: z.object({
    enabled: z.boolean().default(false),
    userKey: z.string().optional(),
    apiToken: z.string().optional(),
    deviceId: z.string().optional(),
    secret: z.string().optional(),
  }).optional(),
  claude: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('claude-sonnet-4-20250514'),
    maxTokens: z.number().default(4096),
  }).optional(),
  security: z.object({
    requireConfirmation: z.boolean().default(true),
    allowedCommands: z.array(z.string()).default([]),
    blockedPatterns: z.array(z.string()).default([]),
  }).optional(),
});

export type AutonomousConfig = z.infer<typeof AutonomousConfigSchema>;

// ── Command Types ──────────────────────────────────────────────────────────

export const CommandTypeSchema = z.enum([
  'query',      // Ask a question, get information
  'execute',    // Run a command/task
  'status',     // Check system status
  'config',     // Configuration change
  'cancel',     // Cancel a task
  'help',       // Get help
]);

export type CommandType = z.infer<typeof CommandTypeSchema>;

export interface ParsedCommand {
  type: CommandType;
  content: string;
  parameters: Record<string, unknown>;
  requiresConfirmation: boolean;
}

// ── Response Types ─────────────────────────────────────────────────────────

export interface AgentResponse {
  success: boolean;
  message: string;
  data?: unknown;
  taskId?: string;
  duration?: number;
}
