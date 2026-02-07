import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';

const mockChat = vi.fn().mockResolvedValue(
  'Here is your plan for today:\n- Focus on task A\n- Review task B',
);
const mockShutdown = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/ai/orchestrator.js', () => ({
  AIOrchestrator: vi.fn().mockImplementation(() => ({
    chat: mockChat,
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

import { registerPlanCommand } from '../../../src/cli/commands/plan.js';

const TASKS_PATH = path.join(homedir(), '.ari', 'tasks.json');
const NOTES_PATH = path.join(homedir(), '.ari', 'notes.json');
const REMINDERS_PATH = path.join(homedir(), '.ari', 'reminders.json');

describe('Plan CLI', () => {
  let logOutput: string[];
  let errorOutput: string[];
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let originalTasks: string | null = null;
  let originalNotes: string | null = null;
  let originalReminders: string | null = null;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(async () => {
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

    process.env.ANTHROPIC_API_KEY = 'test-key-for-plan';
    mockChat.mockClear();
    mockShutdown.mockClear();

    const dir = path.dirname(TASKS_PATH);
    await fs.mkdir(dir, { recursive: true });

    try { originalTasks = await fs.readFile(TASKS_PATH, 'utf-8'); } catch { originalTasks = null; }
    try { originalNotes = await fs.readFile(NOTES_PATH, 'utf-8'); } catch { originalNotes = null; }
    try { originalReminders = await fs.readFile(REMINDERS_PATH, 'utf-8'); } catch { originalReminders = null; }

    await fs.writeFile(TASKS_PATH, JSON.stringify({
      tasks: [
        { id: 1, text: 'Review PR', priority: 'high', status: 'open', createdAt: new Date().toISOString() },
        { id: 2, text: 'Buy groceries', priority: 'normal', status: 'open', createdAt: new Date().toISOString() },
      ],
    }, null, 2));
    await fs.writeFile(NOTES_PATH, JSON.stringify([
      { id: 1, text: 'Meeting at 3pm', tags: ['work'], createdAt: new Date().toISOString() },
    ], null, 2));
    await fs.writeFile(REMINDERS_PATH, JSON.stringify([
      { id: 1, text: 'Take medication', scheduledAt: new Date().toISOString(), recurring: true, recurrence: 'daily', active: true, createdAt: new Date().toISOString() },
    ], null, 2));
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();

    if (originalApiKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }

    if (originalTasks !== null) await fs.writeFile(TASKS_PATH, originalTasks);
    else try { await fs.unlink(TASKS_PATH); } catch { /* ignore */ }

    if (originalNotes !== null) await fs.writeFile(NOTES_PATH, originalNotes);
    else try { await fs.unlink(NOTES_PATH); } catch { /* ignore */ }

    if (originalReminders !== null) await fs.writeFile(REMINDERS_PATH, originalReminders);
    else try { await fs.unlink(REMINDERS_PATH); } catch { /* ignore */ }
  });

  async function run(args: string[]): Promise<void> {
    const program = new Command();
    program.exitOverride();
    registerPlanCommand(program);
    try {
      await program.parseAsync(args);
    } catch { /* process.exit throws */ }
  }

  it('should generate a daily plan', async () => {
    await run(['node', 'test', 'plan', 'today']);

    expect(mockChat).toHaveBeenCalled();
    const output = logOutput.join('\n');
    expect(output).toContain('Daily Plan');
    expect(output).toContain('Focus on task A');
  });

  it('should generate a weekly overview', async () => {
    await run(['node', 'test', 'plan', 'week']);

    expect(mockChat).toHaveBeenCalled();
    const output = logOutput.join('\n');
    expect(output).toContain('Weekly Overview');
  });

  it('should generate a daily review', async () => {
    await run(['node', 'test', 'plan', 'review']);

    expect(mockChat).toHaveBeenCalled();
    const output = logOutput.join('\n');
    expect(output).toContain('Daily Review');
  });

  it('should output JSON with --json flag', async () => {
    await run(['node', 'test', 'plan', 'today', '--json']);

    const jsonStr = logOutput.find((line) => {
      try { return JSON.parse(line).mode === 'today'; } catch { return false; }
    });
    expect(jsonStr).toBeDefined();

    const parsed = JSON.parse(jsonStr!);
    expect(parsed.context.openTasks).toBe(2);
    expect(parsed.context.recentNotes).toBe(1);
    expect(parsed.context.activeReminders).toBe(1);
  });

  it('should show gathering context message', async () => {
    await run(['node', 'test', 'plan', 'today']);

    const output = logOutput.join('\n');
    expect(output).toContain('Gathering context');
    expect(output).toContain('2 tasks');
  });

  it('should fail without ANTHROPIC_API_KEY', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await run(['node', 'test', 'plan', 'today']);

    expect(mockChat).not.toHaveBeenCalled();
    const errStr = errorOutput.join('\n');
    expect(errStr).toContain('ANTHROPIC_API_KEY');
  });

  it('should handle empty data gracefully', async () => {
    await fs.writeFile(TASKS_PATH, JSON.stringify({ tasks: [] }, null, 2));
    await fs.writeFile(NOTES_PATH, JSON.stringify([], null, 2));
    await fs.writeFile(REMINDERS_PATH, JSON.stringify([], null, 2));

    await run(['node', 'test', 'plan', 'today']);

    expect(mockChat).toHaveBeenCalled();
    const output = logOutput.join('\n');
    expect(output).toContain('Daily Plan');
  });
});
