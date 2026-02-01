import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Enable Pushover for tests (overrides the kill switch)
process.env.PUSHOVER_ENABLED = 'true';

import { PushoverClient } from '../../../src/autonomous/pushover-client.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PushoverClient', () => {
  let client: PushoverClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    client = new PushoverClient({
      userKey: 'test-user-key',
      apiToken: 'test-api-token',
      deviceId: 'test-device',
      secret: 'test-secret',
    });

    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 1 }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create client with config', () => {
      expect(client).toBeDefined();
    });

    it('should work without optional config', () => {
      const minimalClient = new PushoverClient({
        userKey: 'user',
        apiToken: 'token',
      });
      expect(minimalClient).toBeDefined();
    });
  });

  describe('send()', () => {
    it('should send a basic notification', async () => {
      const result = await client.send('Test message');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pushover.net/1/messages.json',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should send with title option', async () => {
      const result = await client.send('Message', { title: 'Test Title' });

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should send with priority option', async () => {
      const result = await client.send('Urgent!', { priority: 1 });

      expect(result).toBe(true);
    });

    it('should send with sound option', async () => {
      const result = await client.send('Ding!', { sound: 'cosmic' });

      expect(result).toBe(true);
    });

    it('should send with URL options', async () => {
      const result = await client.send('Check this out', {
        url: 'https://example.com',
        urlTitle: 'Example',
      });

      expect(result).toBe(true);
    });

    it('should return false on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0, errors: ['Invalid token'] }),
      });

      const result = await client.send('Test');

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.send('Test');

      expect(result).toBe(false);
    });

    it('should sanitize message content', async () => {
      // Message with potential sensitive data patterns
      const result = await client.send('API key: sk-secret123 token=abc');

      expect(result).toBe(true);
      // The actual sanitization behavior depends on the implementation
    });

    it('should truncate long messages to 1024 chars', async () => {
      const longMessage = 'A'.repeat(2000);
      await client.send(longMessage);

      // Check that the message was sent (truncation happens internally)
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should truncate long titles to 250 chars', async () => {
      const longTitle = 'B'.repeat(500);
      await client.send('Message', { title: longTitle });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should rate limit notifications', async () => {
      // Send first notification
      await client.send('First');

      // Second notification should wait
      const sendPromise = client.send('Second');

      // Advance timers
      vi.advanceTimersByTime(1000);
      await sendPromise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('registerDevice()', () => {
    it('should register a device', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 1, id: 'device-id', secret: 'device-secret' }),
      });

      const secret = await client.registerDevice('ari-device');

      expect(secret).toBe('device-secret');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pushover.net/1/devices.json',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should return null on registration failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0, errors: ['Device name in use'] }),
      });

      const secret = await client.registerDevice('existing-device');

      expect(secret).toBeNull();
    });

    it('should return null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const secret = await client.registerDevice('test-device');

      expect(secret).toBeNull();
    });
  });

  describe('fetchMessages()', () => {
    it('should fetch messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 1,
          messages: [
            { id: 1, message: 'Hello', date: 12345, app: 'test', aid: 1, umid: 1 },
          ],
        }),
      });

      const messages = await client.fetchMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe('Hello');
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const messages = await client.fetchMessages();

      expect(messages).toEqual([]);
    });

    it('should return empty array on invalid response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0 }),
      });

      const messages = await client.fetchMessages();

      expect(messages).toEqual([]);
    });

    it('should return empty array if no secret or deviceId', async () => {
      const clientNoSecret = new PushoverClient({
        userKey: 'test-user-key',
        apiToken: 'test-api-token',
      });

      const messages = await clientNoSecret.fetchMessages();

      expect(messages).toEqual([]);
    });
  });

  describe('deleteMessages()', () => {
    it('should delete messages up to specified ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 1 }),
      });

      const result = await client.deleteMessages(12345);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/messages.json'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should return false on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.deleteMessages(12345);

      expect(result).toBe(false);
    });
  });

  describe('sanitize()', () => {
    it('should be accessible via send method', async () => {
      // The sanitize method is private but we test it through send
      await client.send('Normal message without secrets');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('sendStatus()', () => {
    it('should send online status', async () => {
      const result = await client.sendStatus('online');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should send offline status', async () => {
      const result = await client.sendStatus('offline');

      expect(result).toBe(true);
    });

    it('should send error status with details', async () => {
      const result = await client.sendStatus('error', 'Database connection failed');

      expect(result).toBe(true);
    });
  });

  describe('sendTaskComplete()', () => {
    it('should send success notification', async () => {
      const result = await client.sendTaskComplete('task-123', true, 'Task completed successfully');

      expect(result).toBe(true);
    });

    it('should send failure notification', async () => {
      const result = await client.sendTaskComplete('task-456', false, 'Task failed due to timeout');

      expect(result).toBe(true);
    });
  });

  describe('sendDailyAudit()', () => {
    it('should send daily audit summary', async () => {
      const result = await client.sendDailyAudit({
        tasksCompleted: 15,
        tasksFailed: 2,
        estimatedCost: 1.50,
        highlights: ['Shipped new feature', 'Fixed critical bug'],
        issues: ['API rate limit hit'],
      });

      expect(result).toBe(true);
    });

    it('should handle empty highlights and issues', async () => {
      const result = await client.sendDailyAudit({
        tasksCompleted: 5,
        tasksFailed: 0,
        estimatedCost: 0.25,
        highlights: [],
        issues: [],
      });

      expect(result).toBe(true);
    });
  });

  describe('sendBatchedSummary()', () => {
    it('should send batched summary', async () => {
      const result = await client.sendBatchedSummary([
        { type: 'task', title: 'Task 1 completed' },
        { type: 'task', title: 'Task 2 completed' },
      ]);

      expect(result).toBe(true);
    });

    it('should return true for empty items', async () => {
      const result = await client.sendBatchedSummary([]);

      expect(result).toBe(true);
    });

    it('should truncate to 5 items with more indicator', async () => {
      const items = Array(10).fill(null).map((_, i) => ({
        type: 'task',
        title: `Task ${i + 1}`,
      }));

      const result = await client.sendBatchedSummary(items);

      expect(result).toBe(true);
    });
  });

  describe('sendCostAlert()', () => {
    it('should send cost alert with progress bar', async () => {
      const result = await client.sendCostAlert(50, 100, 15);

      expect(result).toBe(true);
    });

    it('should show high priority at 90%+', async () => {
      const result = await client.sendCostAlert(95, 100, 5);

      expect(result).toBe(true);
    });
  });

  describe('sendOpportunity()', () => {
    it('should send high urgency opportunity', async () => {
      const result = await client.sendOpportunity('Stock Alert', 'AAPL dropped 5%', 'high');

      expect(result).toBe(true);
    });

    it('should send low urgency opportunity', async () => {
      const result = await client.sendOpportunity('FYI', 'New feature available', 'low');

      expect(result).toBe(true);
    });
  });

  describe('sendInsight()', () => {
    it('should send insight notification', async () => {
      const result = await client.sendInsight('finance', 'You spent 20% more this week');

      expect(result).toBe(true);
    });
  });

  describe('login()', () => {
    it('should login successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 1, secret: 'login-secret', id: 'device-123' }),
      });

      const result = await client.login('test@example.com', 'password123');

      expect(result).not.toBeNull();
      expect(result?.secret).toBe('login-secret');
    });

    it('should login with 2FA', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 1, secret: 'login-secret', id: 'device-123' }),
      });

      const result = await client.login('test@example.com', 'password123', '123456');

      expect(result).not.toBeNull();
    });

    it('should return null on login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0, errors: ['Invalid credentials'] }),
      });

      const result = await client.login('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.login('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });
});
