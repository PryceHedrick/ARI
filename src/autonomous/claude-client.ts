/**
 * ARI Claude API Client
 *
 * Integrates with Anthropic's Claude API for autonomous task processing.
 * Handles natural language understanding and command execution.
 *
 * Security:
 * - Never logs sensitive data
 * - Validates all responses
 * - Enforces token limits
 */

import Anthropic from '@anthropic-ai/sdk';
import { ParsedCommand, CommandType, AgentResponse } from './types.js';

interface ClaudeConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

const SYSTEM_PROMPT = `You are ARI (Artificial Reasoning Intelligence), a personal AI assistant running on a local machine.

Your capabilities:
- Answer questions and provide information
- Execute system commands when authorized
- Manage tasks and schedules
- Monitor system health
- Report status

Your constraints:
- You run locally at 127.0.0.1:3141 - loopback only
- All operations are audited
- Destructive operations require confirmation
- You never expose sensitive data (keys, tokens, passwords)
- You follow constitutional governance rules

When responding to commands:
1. Parse the intent (query, execute, status, config, cancel, help)
2. Identify required parameters
3. Determine if confirmation is needed
4. Execute or request confirmation
5. Report results concisely

Keep responses brief - they may be sent via push notification.
Maximum response: 500 characters unless specifically asked for detail.`;

export class ClaudeClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(config: ClaudeConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens || 1024;
  }

  /**
   * Parse a natural language command into structured format
   */
  async parseCommand(input: string): Promise<ParsedCommand> {
    const parsePrompt = `Parse this command and return JSON only:
Input: "${input}"

Return format:
{
  "type": "query|execute|status|config|cancel|help",
  "content": "the core request",
  "parameters": {},
  "requiresConfirmation": true/false
}

Rules:
- "query" = asking questions, getting info
- "execute" = running commands, doing tasks
- "status" = checking system/task status
- "config" = changing settings
- "cancel" = stopping a task
- "help" = getting help

requiresConfirmation = true for:
- File deletions
- System changes
- Sending emails/messages
- Any destructive action

JSON only, no explanation:`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 256,
        messages: [{ role: 'user', content: parsePrompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(text.trim()) as {
        type?: string;
        content?: string;
        parameters?: Record<string, unknown>;
        requiresConfirmation?: boolean;
      };

      return {
        type: (parsed.type as CommandType) || 'query',
        content: parsed.content || input,
        parameters: parsed.parameters || {},
        requiresConfirmation: parsed.requiresConfirmation ?? true,
      };
    } catch {
      // Default to query if parsing fails
      return {
        type: 'query',
        content: input,
        parameters: {},
        requiresConfirmation: false,
      };
    }
  }

  /**
   * Process a command and generate response
   */
  async processCommand(command: ParsedCommand, context?: string): Promise<AgentResponse> {
    const contextInfo = context ? `\nContext: ${context}` : '';

    const prompt = `${SYSTEM_PROMPT}${contextInfo}

Command type: ${command.type}
Request: ${command.content}
Parameters: ${JSON.stringify(command.parameters)}

Respond concisely (max 500 chars). If this requires system execution, describe what would be done.`;

    try {
      const startTime = Date.now();

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const duration = Date.now() - startTime;

      return {
        success: true,
        message: text.slice(0, 1000), // Truncate for safety
        duration,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Simple query without full command processing
   */
  async query(question: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: question }],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Summarize text for notification
   */
  async summarize(text: string, maxLength: number = 200): Promise<string> {
    if (text.length <= maxLength) return text;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Summarize in under ${maxLength} characters:\n\n${text}`,
        }],
      });

      const summary = response.content[0].type === 'text' ? response.content[0].text : text;
      return summary.slice(0, maxLength);
    } catch {
      return text.slice(0, maxLength - 3) + '...';
    }
  }

  /**
   * Multi-turn chat with custom system prompt
   * Used for SMS conversations with context
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt ?? SYSTEM_PROMPT,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
