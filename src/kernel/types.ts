import { z } from 'zod';
import { randomUUID } from 'crypto';

// TrustLevel enum schema
export const TrustLevelSchema = z.enum(['system', 'verified', 'standard', 'untrusted']);
export type TrustLevel = z.infer<typeof TrustLevelSchema>;

// Message schema
export const MessageSchema = z.object({
  id: z.string().uuid().default(() => randomUUID()),
  content: z.string(),
  source: TrustLevelSchema,
  timestamp: z.date().default(() => new Date()),
  metadata: z.record(z.unknown()).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

// AuditEvent schema
export const AuditEventSchema = z.object({
  id: z.string().uuid().default(() => randomUUID()),
  timestamp: z.date().default(() => new Date()),
  action: z.string(),
  actor: z.string(),
  trustLevel: TrustLevelSchema,
  details: z.record(z.unknown()).optional(),
  hash: z.string(),
  previousHash: z.string(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// SecurityEvent schema
export const SecurityEventSchema = z.object({
  id: z.string().uuid().default(() => randomUUID()),
  timestamp: z.date().default(() => new Date()),
  eventType: z.enum(['injection_detected', 'trust_violation', 'unauthorized_access', 'chain_tamper']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  source: z.string(),
  details: z.record(z.unknown()),
  mitigated: z.boolean(),
});
export type SecurityEvent = z.infer<typeof SecurityEventSchema>;

// Config schema
export const ConfigSchema = z.object({
  version: z.string(),
  auditPath: z.string().default('~/.ari/audit.json'),
  gatewayPort: z.number().default(3141),
  trustDefaults: z.object({
    defaultLevel: TrustLevelSchema.default('untrusted'),
    allowEscalation: z.boolean().default(false),
  }),
});
export type Config = z.infer<typeof ConfigSchema>;

// SanitizeResult schema
export const SanitizeResultSchema = z.object({
  safe: z.boolean(),
  threats: z.array(z.object({
    pattern: z.string(),
    category: z.string(),
    severity: z.string(),
  })),
  sanitizedContent: z.string(),
  riskScore: z.number(),
});
export type SanitizeResult = z.infer<typeof SanitizeResultSchema>;
