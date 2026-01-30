#!/usr/bin/env npx tsx
/**
 * ARI SMS Daemon
 *
 * Standalone service that enables two-way SMS communication.
 * - Polls Gmail for incoming SMS replies
 * - Processes messages through Claude
 * - Sends responses back via SMS
 *
 * Run: npx tsx scripts/sms-daemon.ts
 * Or as daemon: pm2 start scripts/sms-daemon.ts --interpreter="npx tsx"
 */

import { SMSConversation, createSMSConversation } from '../src/integrations/sms/index.js';
import { notificationManager } from '../src/autonomous/notification-manager.js';
import { dailyAudit } from '../src/autonomous/daily-audit.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const CONFIG_PATH = path.join(process.env.HOME || '~', '.ari', 'notification.env');
const CLAUDE_CONFIG_PATH = path.join(process.env.HOME || '~', '.ari', 'claude.env');

interface EnvConfig {
  GMAIL_USER?: string;
  GMAIL_APP_PASSWORD?: string;
  PHONE_NUMBER?: string;
  CARRIER_GATEWAY?: string;
  ANTHROPIC_API_KEY?: string;
  CLAUDE_MODEL?: string;
  POLL_INTERVAL_MS?: string;
}

async function loadEnvFile(filePath: string): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const vars: Record<string, string> = {};

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        let value = trimmed.substring(eqIndex + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        vars[key] = value;
      }
    }

    return vars;
  } catch {
    return {};
  }
}

async function loadConfig(): Promise<EnvConfig> {
  // Load from multiple sources
  const notificationEnv = await loadEnvFile(CONFIG_PATH);
  const claudeEnv = await loadEnvFile(CLAUDE_CONFIG_PATH);

  // Also check process.env
  return {
    GMAIL_USER: process.env.GMAIL_USER || notificationEnv.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || notificationEnv.GMAIL_APP_PASSWORD,
    PHONE_NUMBER: process.env.PHONE_NUMBER || notificationEnv.PHONE_NUMBER,
    CARRIER_GATEWAY: process.env.CARRIER_GATEWAY || notificationEnv.CARRIER_GATEWAY || 'vtext.com',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || claudeEnv.ANTHROPIC_API_KEY || notificationEnv.ANTHROPIC_API_KEY,
    CLAUDE_MODEL: process.env.CLAUDE_MODEL || claudeEnv.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    POLL_INTERVAL_MS: process.env.POLL_INTERVAL_MS || notificationEnv.POLL_INTERVAL_MS || '30000',
  };
}

function validateConfig(config: EnvConfig): string[] {
  const errors: string[] = [];

  if (!config.GMAIL_USER) errors.push('GMAIL_USER is required');
  if (!config.GMAIL_APP_PASSWORD) errors.push('GMAIL_APP_PASSWORD is required');
  if (!config.PHONE_NUMBER) errors.push('PHONE_NUMBER is required');
  if (!config.ANTHROPIC_API_KEY) errors.push('ANTHROPIC_API_KEY is required');

  return errors;
}

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    ARI SMS Daemon                              ║');
  console.log('║               Two-Way SMS Communication                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Load configuration
  console.log('▶ Loading configuration...');
  const config = await loadConfig();

  const errors = validateConfig(config);
  if (errors.length > 0) {
    console.error('\n✗ Configuration errors:');
    errors.forEach((e) => console.error(`  - ${e}`));
    console.error('\nSet these in ~/.ari/notification.env or ~/.ari/claude.env');
    process.exit(1);
  }

  console.log('  ✓ Configuration loaded');
  console.log(`    Gmail: ${config.GMAIL_USER}`);
  console.log(`    Phone: ${config.PHONE_NUMBER}@${config.CARRIER_GATEWAY}`);
  console.log(`    Model: ${config.CLAUDE_MODEL}`);
  console.log(`    Poll: ${config.POLL_INTERVAL_MS}ms`);
  console.log();

  // Create SMS conversation handler
  const conversation = createSMSConversation({
    sms: {
      enabled: true,
      gmailUser: config.GMAIL_USER!,
      gmailAppPassword: config.GMAIL_APP_PASSWORD!,
      phoneNumber: config.PHONE_NUMBER!,
      carrierGateway: config.CARRIER_GATEWAY!,
      quietHoursStart: 23, // Less strict for interactive use
      quietHoursEnd: 6,
      maxPerHour: 30, // Higher limit for conversations
      timezone: 'America/Indiana/Indianapolis',
    },
    claude: {
      apiKey: config.ANTHROPIC_API_KEY!,
      model: config.CLAUDE_MODEL,
      maxTokens: 256, // Short responses for SMS
    },
    maxContextMessages: 10,
    contextTimeoutMinutes: 30,
  });

  // Set up event handlers
  conversation.on('initialized', () => {
    console.log('▶ SMS Conversation initialized');
  });

  conversation.on('started', () => {
    console.log('▶ Listening for SMS messages...\n');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('  Text your phone to talk to ARI!');
    console.log('  Commands: STATUS, HELP, CLEAR');
    console.log('  Or just text naturally.');
    console.log('─────────────────────────────────────────────────────────────────\n');
  });

  conversation.on('message_received', (msg: { body: string; from: string }) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 📱 RECEIVED: "${msg.body}"`);
  });

  conversation.on('message_sent', ({ response }: { response: string }) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🤖 SENT: "${response}"`);
    console.log();
  });

  conversation.on('error', (err: Error) => {
    console.error(`[ERROR] ${err.message}`);
  });

  // Initialize and start
  console.log('▶ Initializing...');
  const initOk = await conversation.init();
  if (!initOk) {
    console.error('✗ Failed to initialize SMS conversation');
    process.exit(1);
  }

  await conversation.start();

  // Log startup
  await dailyAudit.logActivity(
    'system_event',
    'SMS Daemon Started',
    'Two-way SMS communication active',
    { outcome: 'success' }
  );

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n▶ Received ${signal}, shutting down...`);

    await conversation.stop();

    await dailyAudit.logActivity(
      'system_event',
      'SMS Daemon Stopped',
      `Shutdown signal: ${signal}`,
      { outcome: 'success' }
    );

    console.log('✓ Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // Keep alive
  console.log('▶ Daemon running. Press Ctrl+C to stop.\n');

  // Heartbeat log every 5 minutes
  setInterval(() => {
    const stats = conversation.getStats();
    console.log(
      `[HEARTBEAT] Context: ${stats.contextMessages} msgs | ` +
      `SMS: ${stats.smsStats.sentThisHour}/${stats.smsStats.rateLimitRemaining + stats.smsStats.sentThisHour} | ` +
      `Receiver: ${stats.receiverRunning ? 'OK' : 'DOWN'}`
    );
  }, 5 * 60 * 1000);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
