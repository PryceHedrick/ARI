#!/usr/bin/env npx tsx
/**
 * ARI Notification System Test Script
 *
 * Tests all notification priority paths:
 * 1. P0 (critical) → immediate SMS + Notion
 * 2. P1 (high) → SMS + Notion during work hours, queue during quiet
 * 3. P2 (normal) → Notion only
 * 4. P3/P4 (low) → Batched to Notion
 * 5. Escalation: 3 same P1 errors → P0
 *
 * Run: npx tsx scripts/test-notifications.ts
 */

import { NotificationManager } from '../src/autonomous/notification-manager.js';
import type { SMSConfig, NotionConfig } from '../src/autonomous/types.js';

// Test configuration (dry run - no actual sending without env vars)
const smsConfig: SMSConfig = {
  enabled: !!process.env.GMAIL_USER,
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  carrierGateway: process.env.CARRIER_GATEWAY ?? 'vtext.com',
  phoneNumber: process.env.PHONE_NUMBER,
  quietHoursStart: 22,
  quietHoursEnd: 7,
  maxPerHour: 5,
  timezone: 'America/Indiana/Indianapolis',
};

const notionConfig: NotionConfig = {
  enabled: !!process.env.NOTION_API_KEY,
  apiKey: process.env.NOTION_API_KEY,
  inboxDatabaseId: process.env.NOTION_INBOX_DB_ID,
  dailyLogParentId: process.env.NOTION_DAILY_LOG_PARENT_ID,
};

async function testNotifications(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           ARI Notification System Test Suite                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const manager = new NotificationManager();

  // Initialize
  console.log('▶ Initializing notification manager...');
  const initResult = await manager.init({ sms: smsConfig, notion: notionConfig });
  console.log(`  SMS: ${initResult.sms ? '✓ Ready' : '✗ Not configured'}`);
  console.log(`  Notion: ${initResult.notion ? '✓ Ready' : '✗ Not configured'}`);
  console.log();

  if (!manager.isReady()) {
    console.log('⚠ No channels configured. Set environment variables:');
    console.log('  GMAIL_USER, GMAIL_APP_PASSWORD, PHONE_NUMBER for SMS');
    console.log('  NOTION_API_KEY, NOTION_INBOX_DB_ID for Notion');
    console.log('\nRunning in dry-run mode (testing routing logic only)...\n');
    manager.initLegacy();
  }

  // Test 1: P0 Critical
  console.log('─── Test 1: P0 Critical (Security Alert) ───');
  const p0Result = await manager.security('Test Security Alert', 'This is a test P0 notification');
  console.log(`  Result: ${p0Result.sent ? '✓ SENT' : '○ QUEUED'}`);
  console.log(`  Reason: ${p0Result.reason}`);
  console.log();

  // Test 2: P1 High (Error)
  console.log('─── Test 2: P1 High (Error) ───');
  const p1Result = await manager.error('Test Error', 'This is a test P1 error notification', 'test-error');
  console.log(`  Result: ${p1Result.sent ? '✓ SENT' : '○ QUEUED'}`);
  console.log(`  Reason: ${p1Result.reason}`);
  console.log();

  // Test 3: P2 Normal (Milestone)
  console.log('─── Test 3: P2 Normal (Milestone) ───');
  const p2Result = await manager.milestone('Test Milestone', 'This is a test P2 notification');
  console.log(`  Result: ${p2Result.sent ? '✓ SENT' : '○ QUEUED'}`);
  console.log(`  Reason: ${p2Result.reason}`);
  console.log();

  // Test 4: P3 Low (Insight)
  console.log('─── Test 4: P3 Low (Insight) ───');
  const p3Result = await manager.insight('Testing', 'This is a test P3 insight notification');
  console.log(`  Result: ${p3Result.sent ? '✓ SENT' : '○ QUEUED'}`);
  console.log(`  Reason: ${p3Result.reason}`);
  console.log();

  // Test 5: Escalation (3 same P1 errors → P0)
  console.log('─── Test 5: Escalation (3x same P1 → P0) ───');
  console.log('  Sending 3 identical P1 errors...');
  for (let i = 1; i <= 3; i++) {
    const escResult = await manager.error(
      'Repeated Error',
      `This error triggers escalation (attempt ${i})`,
      'escalation-test-key'
    );
    console.log(`  #${i}: ${escResult.sent ? '✓ SENT' : '○ QUEUED'} - ${escResult.reason}`);
  }
  console.log();

  // Test 6: Queue processing
  console.log('─── Test 6: Queue Status ───');
  const status = manager.getStatus();
  console.log(`  SMS Ready: ${status.sms.ready}`);
  console.log(`  Notion Ready: ${status.notion.ready}`);
  console.log(`  Queue Size: ${status.queueSize}`);
  console.log();

  // Test 7: Daily summary
  console.log('─── Test 7: Daily Summary ───');
  const summaryResult = await manager.dailySummary({
    tasksCompleted: 42,
    tasksFailed: 3,
    estimatedCost: 4.50,
    highlights: ['Completed notification system', 'Fixed 5 bugs'],
    issues: ['One test failing'],
    efficiency: { tasksPerApiDollar: 9.3, trend: 'improving' },
  });
  console.log(`  Result: ${summaryResult.sent ? '✓ SENT' : '○ QUEUED'}`);
  console.log(`  Reason: ${summaryResult.reason}`);
  console.log();

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    Test Suite Complete                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
}

testNotifications().catch(console.error);
