/**
 * ARI SMS Bridge via Twilio
 *
 * Two-way text messaging with ARI:
 * - Receives incoming SMS via webhook
 * - Processes through Claude
 * - Sends response back via SMS
 */

import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import Anthropic from '@anthropic-ai/sdk';
import type { TextBlock } from '@anthropic-ai/sdk/resources/messages';

// Configuration from environment
const config = {
  port: parseInt(process.env.ARI_SMS_PORT || '3142'),
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  allowedNumbers: (process.env.ARI_ALLOWED_NUMBERS || '').split(',').filter(Boolean),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
};

// Validate config
function validateConfig(): void {
  const missing: string[] = [];
  if (!config.twilioAccountSid) missing.push('TWILIO_ACCOUNT_SID');
  if (!config.twilioAuthToken) missing.push('TWILIO_AUTH_TOKEN');
  if (!config.twilioPhoneNumber) missing.push('TWILIO_PHONE_NUMBER');
  if (!config.anthropicApiKey) missing.push('ANTHROPIC_API_KEY');
  if (config.allowedNumbers.length === 0) missing.push('ARI_ALLOWED_NUMBERS');

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error('Missing required environment variables:', missing.join(', '));
    // eslint-disable-next-line no-console
    console.error('\nCreate ~/.ari/sms.env with required values');
    process.exit(1);
  }
}

// Initialize Anthropic client
let anthropic: Anthropic;

// Conversation history (simple in-memory for now)
const conversations: Map<string, Array<{ role: 'user' | 'assistant'; content: string }>> = new Map();

// Send SMS via Twilio
async function sendSMS(to: string, body: string): Promise<void> {
  const accountSid = config.twilioAccountSid;
  const authToken = config.twilioAuthToken;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: config.twilioPhoneNumber,
      Body: body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio error: ${errorText}`);
  }
}

// Process message through Claude
async function processWithClaude(from: string, message: string): Promise<string> {
  // Get or create conversation history
  if (!conversations.has(from)) {
    conversations.set(from, []);
  }
  const history = conversations.get(from)!;

  // Add user message
  history.push({ role: 'user', content: message });

  // Keep last 20 messages for context
  const recentHistory = history.slice(-20);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: `You are ARI, a personal AI assistant. You're responding via text message, so keep responses concise (under 160 chars if possible, max 300). Be helpful, direct, and conversational. You help manage life - career, health, finances, schedule, and projects.

Current time: ${new Date().toLocaleString()}

Keep it brief - this is texting, not email.`,
      messages: recentHistory,
    });

    const textContent = response.content.find((c): c is TextBlock => c.type === 'text');
    const assistantMessage = textContent?.text ?? 'I had trouble processing that.';

    // Add assistant response to history
    history.push({ role: 'assistant', content: assistantMessage });

    return assistantMessage;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error('Claude error:', errorMessage);
    return 'Sorry, I had trouble thinking. Try again?';
  }
}

// Create and start server
async function startServer(): Promise<void> {
  validateConfig();

  anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

  const app = Fastify({ logger: true });

  // Register form body parser for Twilio webhooks
  await app.register(formbody);

  // Health check
  app.get('/health', () => {
    return { status: 'ok', service: 'ari-sms-bridge' };
  });

  // Twilio webhook for incoming SMS
  app.post('/sms/incoming', async (request, reply) => {
    const body = request.body as Record<string, string>;

    const from = body.From;
    const message = body.Body;

    app.log.info(`[SMS] Received from ${from}: ${message}`);

    // Security: Only allow configured numbers
    if (!config.allowedNumbers.includes(from)) {
      app.log.warn(`[SMS] Blocked message from unauthorized number: ${from}`);
      reply.type('text/xml');
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    try {
      // Process through Claude
      const response = await processWithClaude(from, message);

      app.log.info(`[SMS] Responding to ${from}: ${response}`);

      // Send response via Twilio API
      await sendSMS(from, response);

      reply.type('text/xml');
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      app.log.error(`[SMS] Error processing message: ${errorMessage}`);

      await sendSMS(from, 'Sorry, something went wrong. Try again in a bit.');

      reply.type('text/xml');
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }
  });

  // Status endpoint
  app.get('/sms/status', () => {
    return {
      status: 'running',
      twilioNumber: config.twilioPhoneNumber,
      allowedNumbers: config.allowedNumbers.length,
      activeConversations: conversations.size,
    };
  });

  // Clear conversation history for a number
  app.post('/sms/clear', (request) => {
    const body = request.body as Record<string, string>;
    const number = body.number;

    if (number && conversations.has(number)) {
      conversations.delete(number);
      return { cleared: true, number };
    }
    return { cleared: false };
  });

  // Start listening
  await app.listen({ port: config.port, host: '127.0.0.1' });

  // eslint-disable-next-line no-console
  console.log(`ARI SMS Bridge running on port ${config.port}`);
}

// Run
startServer().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start SMS bridge:', err);
  process.exit(1);
});
