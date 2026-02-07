import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

const mockExecute = vi.fn().mockResolvedValue({
  content: 'The answer is 42.',
  model: 'claude-sonnet-4',
  inputTokens: 15,
  outputTokens: 8,
  cost: 0.0001,
  duration: 350,
  cached: false,
  qualityScore: 0.95,
  escalated: false,
});
const mockShutdown = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/ai/orchestrator.js', () => ({
  AIOrchestrator: vi.fn().mockImplementation(() => ({
    execute: mockExecute,
    shutdown: mockShutdown,
  })),
}));

vi.mock('../../../src/kernel/event-bus.js', () => ({
  EventBus: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
  })),
}));

import { registerAskCommand } from '../../../src/cli/commands/ask.js';

describe('Ask CLI', () => {
  let logOutput: string[];
  let errorOutput: string[];
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    logOutput = [];
    errorOutput = [];

    logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logOutput.push(args.map(String).join(' '));
    });
    errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errorOutput.push(args.map(String).join(' '));
    });
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);

    process.env.ANTHROPIC_API_KEY = 'test-key-for-ask';
    mockExecute.mockClear();
    mockShutdown.mockClear();
  });

  afterEach(() => {
    // Only restore the spies we created — NOT vi.restoreAllMocks()
    // which would also clear the module mocks
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();

    if (originalApiKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  async function run(args: string[]): Promise<void> {
    const program = new Command();
    program.exitOverride();
    registerAskCommand(program);
    try {
      await program.parseAsync(args);
    } catch { /* process.exit throws */ }
  }

  it('should answer a question', async () => {
    await run(['node', 'test', 'ask', 'What is the meaning of life?']);

    expect(mockExecute).toHaveBeenCalled();
    const output = logOutput.join('\n');
    expect(output).toContain('The answer is 42');
  });

  it('should show model and cost metadata', async () => {
    await run(['node', 'test', 'ask', 'Quick question']);

    const output = logOutput.join('\n');
    expect(output).toContain('claude-sonnet-4');
    expect(output).toContain('$0.0001');
  });

  it('should output JSON with --json flag', async () => {
    await run(['node', 'test', 'ask', 'JSON question', '--json']);

    const jsonStr = logOutput.find((line) => {
      try { return JSON.parse(line).answer !== undefined; } catch { return false; }
    });
    expect(jsonStr).toBeDefined();

    const parsed = JSON.parse(jsonStr!);
    expect(parsed.answer).toBe('The answer is 42.');
    expect(parsed.model).toBe('claude-sonnet-4');
    expect(parsed.tokens.input).toBe(15);
  });

  it('should fail without ANTHROPIC_API_KEY', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await run(['node', 'test', 'ask', 'No key question']);

    expect(mockExecute).not.toHaveBeenCalled();
    const errStr = errorOutput.join('\n');
    expect(errStr).toContain('ANTHROPIC_API_KEY');
  });

  it('should reject invalid model', async () => {
    await run(['node', 'test', 'ask', 'Model test', '--model', 'gpt-5-turbo']);

    expect(mockExecute).not.toHaveBeenCalled();
    const errStr = errorOutput.join('\n');
    expect(errStr).toContain('Invalid model');
  });

  it('should accept valid model override', async () => {
    await run(['node', 'test', 'ask', 'Opus question', '--model', 'claude-opus-4.6']);

    expect(mockExecute).toHaveBeenCalled();
    const output = logOutput.join('\n');
    expect(output).toContain('The answer is 42');
  });
});
