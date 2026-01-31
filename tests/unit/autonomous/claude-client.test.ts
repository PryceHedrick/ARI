import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a mock messages.create function we can control per test
const mockCreate = vi.fn();

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}));

// Import after mocking
import { ClaudeClient } from '../../../src/autonomous/claude-client.js';

describe('ClaudeClient', () => {
  let client: ClaudeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to return default response
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"type":"query","content":"test","parameters":{},"requiresConfirmation":false}' }],
      id: 'test',
      model: 'claude-sonnet-4-20250514',
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20 },
    });

    client = new ClaudeClient({
      apiKey: 'test-api-key',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 1024,
    });
  });

  describe('constructor', () => {
    it('should create client with provided config', () => {
      expect(client).toBeDefined();
    });

    it('should use default model if not provided', () => {
      const clientWithDefaults = new ClaudeClient({
        apiKey: 'test-key',
      });
      expect(clientWithDefaults).toBeDefined();
    });

    it('should use default maxTokens if not provided', () => {
      const clientWithDefaults = new ClaudeClient({
        apiKey: 'test-key',
      });
      expect(clientWithDefaults).toBeDefined();
    });
  });

  describe('parseCommand()', () => {
    it('should parse a simple query command', async () => {
      const result = await client.parseCommand('what time is it?');

      expect(result).toBeDefined();
      expect(result.type).toBe('query');
      expect(result.content).toBe('test');
    });

    it('should return default query type on parse error', async () => {
      // Mock a parse error
      mockCreate.mockRejectedValueOnce(new Error('Parse error'));

      const result = await client.parseCommand('invalid input');

      expect(result.type).toBe('query');
      expect(result.content).toBe('invalid input');
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should include parameters in result', async () => {
      const result = await client.parseCommand('set timer for 5 minutes');

      expect(result).toBeDefined();
      expect(result.parameters).toBeDefined();
    });
  });

  describe('processCommand()', () => {
    it('should process a query command', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'The current time is 10:30 AM.' }],
        id: 'test',
        model: 'claude-sonnet-4-20250514',
        role: 'assistant',
        type: 'message',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await client.processCommand({
        type: 'query',
        content: 'what time is it?',
        parameters: {},
        requiresConfirmation: false,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API error'));

      const result = await client.processCommand({
        type: 'query',
        content: 'test',
        parameters: {},
        requiresConfirmation: false,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error');
    });

    it('should include duration in response', async () => {
      const result = await client.processCommand({
        type: 'status',
        content: 'system status',
        parameters: {},
        requiresConfirmation: false,
      });

      expect(result.duration).toBeDefined();
    });

    it('should accept context parameter', async () => {
      const result = await client.processCommand(
        {
          type: 'query',
          content: 'test',
          parameters: {},
          requiresConfirmation: false,
        },
        'Previous context information'
      );

      expect(result).toBeDefined();
    });
  });

  describe('query()', () => {
    it('should send a simple query', async () => {
      const result = await client.query('Hello, how are you?');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle query errors', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Query failed'));

      const result = await client.query('test');

      expect(result).toContain('Error');
    });
  });

  describe('summarize()', () => {
    it('should return text as-is if under maxLength', async () => {
      const shortText = 'Short text';
      const result = await client.summarize(shortText, 200);

      expect(result).toBe(shortText);
    });

    it('should summarize long text', async () => {
      const longText = 'A'.repeat(500);
      const result = await client.summarize(longText, 200);

      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should truncate on summarization error', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Summarize failed'));

      const longText = 'A'.repeat(500);
      const result = await client.summarize(longText, 200);

      expect(result.length).toBeLessThanOrEqual(200);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('chat()', () => {
    it('should handle multi-turn conversation', async () => {
      const result = await client.chat([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ]);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should accept custom system prompt', async () => {
      const result = await client.chat(
        [{ role: 'user', content: 'Test' }],
        'Custom system prompt for SMS conversations'
      );

      expect(result).toBeDefined();
    });

    it('should handle chat errors', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Chat failed'));

      const result = await client.chat([{ role: 'user', content: 'test' }]);

      expect(result).toContain('Error');
    });
  });

  describe('testConnection()', () => {
    it('should return true on successful connection', async () => {
      const result = await client.testConnection();

      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });
});
