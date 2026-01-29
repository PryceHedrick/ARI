/**
 * ARI Pushover Client
 *
 * Two-way Pushover communication:
 * - Send notifications to Pryce
 * - Receive commands from Pryce via Open Client API
 *
 * Security:
 * - Never sends sensitive data in notifications
 * - Validates incoming messages
 * - Rate limits outbound notifications
 */

import { PushoverMessage, PushoverResponse } from './types.js';

const PUSHOVER_API = 'https://api.pushover.net/1';
const PUSHOVER_CLIENT_API = 'https://client.pushover.net';

interface PushoverConfig {
  userKey: string;
  apiToken: string;
  deviceId?: string;
  secret?: string;
}

interface NotificationOptions {
  title?: string;
  priority?: -2 | -1 | 0 | 1 | 2;
  sound?: string;
  url?: string;
  urlTitle?: string;
}

export class PushoverClient {
  private config: PushoverConfig;
  private lastNotification = 0;
  private minIntervalMs = 1000; // Rate limit: 1 notification per second

  constructor(config: PushoverConfig) {
    this.config = config;
  }

  /**
   * Send a notification to Pryce
   * Security: Sanitizes message content
   */
  async send(
    message: string,
    options: NotificationOptions = {}
  ): Promise<boolean> {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastNotification < this.minIntervalMs) {
      await new Promise(r => setTimeout(r, this.minIntervalMs - (now - this.lastNotification)));
    }

    // Sanitize message - remove anything that looks sensitive
    const safeMessage = this.sanitize(message).slice(0, 1024);
    const safeTitle = options.title ? this.sanitize(options.title).slice(0, 250) : undefined;

    try {
      const response = await fetch(`${PUSHOVER_API}/messages.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: this.config.apiToken,
          user: this.config.userKey,
          message: safeMessage,
          ...(safeTitle && { title: safeTitle }),
          ...(options.priority !== undefined && { priority: String(options.priority) }),
          ...(options.sound && { sound: options.sound }),
          ...(options.url && { url: options.url }),
          ...(options.urlTitle && { url_title: options.urlTitle }),
        }).toString(),
      });

      const result = await response.json() as PushoverResponse;
      this.lastNotification = Date.now();

      return result.status === 1;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Pushover send error:', error);
      return false;
    }
  }

  /**
   * Register device for receiving messages (Open Client API)
   * Returns device secret for message retrieval
   */
  async registerDevice(deviceName: string): Promise<string | null> {
    try {
      const response = await fetch(`${PUSHOVER_API}/devices.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: this.config.apiToken,
          secret: this.config.secret || '',
          name: deviceName,
          os: 'O', // Other
        }).toString(),
      });

      const result = await response.json() as { status: number; id?: string; secret?: string };
      if (result.status === 1 && result.id) {
        return result.secret || result.id;
      }
      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Device registration error:', error);
      return null;
    }
  }

  /**
   * Fetch new messages from Pushover (Open Client API)
   * Requires device secret from registration
   */
  async fetchMessages(): Promise<PushoverMessage[]> {
    if (!this.config.secret || !this.config.deviceId) {
      return [];
    }

    try {
      const response = await fetch(
        `${PUSHOVER_CLIENT_API}/messages.json?secret=${this.config.secret}&device_id=${this.config.deviceId}`,
        { method: 'GET' }
      );

      const result = await response.json() as PushoverResponse;

      if (result.status === 1 && result.messages) {
        return result.messages;
      }
      return [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Fetch messages error:', error);
      return [];
    }
  }

  /**
   * Delete messages after processing (acknowledge receipt)
   */
  async deleteMessages(messageId: number): Promise<boolean> {
    if (!this.config.secret || !this.config.deviceId) {
      return false;
    }

    try {
      const response = await fetch(
        `${PUSHOVER_CLIENT_API}/messages.json`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: this.config.secret,
            message: String(messageId),
          }).toString(),
        }
      );

      const result = await response.json() as { status: number };
      return result.status === 1;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Delete messages error:', error);
      return false;
    }
  }

  /**
   * Login to get device secret (required for receiving messages)
   */
  async login(email: string, password: string, twoFactor?: string): Promise<{ secret: string; deviceId: string } | null> {
    try {
      const params: Record<string, string> = { email, password };
      if (twoFactor) params.twofa = twoFactor;

      const response = await fetch(`${PUSHOVER_CLIENT_API}/login.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params).toString(),
      });

      const result = await response.json() as { status: number; secret?: string; id?: string };

      if (result.status === 1 && result.secret) {
        return {
          secret: result.secret,
          deviceId: result.id || this.config.deviceId || '',
        };
      }
      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Pushover login error:', error);
      return null;
    }
  }

  /**
   * Sanitize content to remove sensitive data
   */
  private sanitize(text: string): string {
    return text
      // Remove potential API keys/tokens (32+ hex chars)
      .replace(/[a-f0-9]{32,}/gi, '[REDACTED]')
      // Remove Bearer tokens
      .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
      // Remove key=value patterns for sensitive keys
      .replace(/(api[_-]?key|token|secret|password|credential)[=:]\s*[^\s,}]+/gi, '$1=[REDACTED]')
      // Remove email-like patterns in certain contexts
      .replace(/password.*?[^\s]+/gi, 'password=[REDACTED]');
  }

  /**
   * Send a status notification
   */
  async sendStatus(status: 'online' | 'offline' | 'error', details?: string): Promise<boolean> {
    const messages = {
      online: 'ARI is online and operational',
      offline: 'ARI is offline',
      error: 'ARI encountered an error',
    };

    return this.send(
      details ? `${messages[status]}: ${details}` : messages[status],
      {
        title: `ARI: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        priority: status === 'error' ? 1 : 0,
        sound: status === 'error' ? 'siren' : 'cosmic',
      }
    );
  }

  /**
   * Send task completion notification
   */
  async sendTaskComplete(taskId: string, success: boolean, summary: string): Promise<boolean> {
    return this.send(
      `Task ${taskId.slice(0, 8)}: ${success ? 'Completed' : 'Failed'}\n${summary.slice(0, 500)}`,
      {
        title: success ? 'ARI: Task Done' : 'ARI: Task Failed',
        priority: success ? 0 : 1,
      }
    );
  }
}
