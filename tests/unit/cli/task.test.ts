import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerTaskCommand } from '../../../src/cli/commands/task.js';
import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';

const TASKS_PATH = path.join(homedir(), '.ari', 'tasks.json');

describe('Task CLI', () => {
  let program: Command;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let originalTasks: string | null = null;

  beforeEach(async () => {
    program = new Command();
    program.exitOverride();
    registerTaskCommand(program);
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Backup existing tasks file
    try {
      originalTasks = await fs.readFile(TASKS_PATH, 'utf-8');
    } catch {
      originalTasks = null;
    }
    // Start with empty tasks
    await fs.mkdir(path.dirname(TASKS_PATH), { recursive: true });
    await fs.writeFile(TASKS_PATH, JSON.stringify({ tasks: [] }, null, 2));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // Restore original tasks
    if (originalTasks !== null) {
      await fs.writeFile(TASKS_PATH, originalTasks);
    } else {
      try { await fs.unlink(TASKS_PATH); } catch { /* ignore */ }
    }
  });

  it('should add a task', async () => {
    await program.parseAsync(['node', 'test', 'task', 'add', 'Buy groceries']);
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('#1');
    expect(output).toContain('Added');
  });

  it('should add a high-priority task', async () => {
    await program.parseAsync(['node', 'test', 'task', 'add', 'Urgent fix', '-p', 'high']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('#1');
    expect(output).toContain('Added');
  });

  it('should list tasks', async () => {
    await program.parseAsync(['node', 'test', 'task', 'add', 'Task one']);
    consoleSpy.mockClear();
    await program.parseAsync(['node', 'test', 'task', 'list']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Task one');
  });

  it('should show empty message when no tasks', async () => {
    await program.parseAsync(['node', 'test', 'task', 'list']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('No tasks');
  });

  it('should mark task as done', async () => {
    await program.parseAsync(['node', 'test', 'task', 'add', 'Complete me']);
    consoleSpy.mockClear();
    await program.parseAsync(['node', 'test', 'task', 'done', '1']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('complete');
  });

  it('should remove a task', async () => {
    await program.parseAsync(['node', 'test', 'task', 'add', 'Remove me']);
    consoleSpy.mockClear();
    await program.parseAsync(['node', 'test', 'task', 'remove', '1']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Removed');
  });

  it('should output JSON with --json flag', async () => {
    await program.parseAsync(['node', 'test', 'task', 'add', 'JSON test']);
    consoleSpy.mockClear();
    await program.parseAsync(['node', 'test', 'task', 'list', '--json']);
    const jsonCall = consoleSpy.mock.calls.find(c => {
      try {
        const parsed = JSON.parse(c[0]);
        return Array.isArray(parsed);
      } catch { return false; }
    });
    expect(jsonCall).toBeDefined();
  });

  it('should filter tasks by --today flag', async () => {
    await program.parseAsync(['node', 'test', 'task', 'add', 'Today task']);
    consoleSpy.mockClear();
    await program.parseAsync(['node', 'test', 'task', 'list', '--today']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Today task');
  });

  it('should include completed tasks with --all flag', async () => {
    await program.parseAsync(['node', 'test', 'task', 'add', 'Task to complete']);
    await program.parseAsync(['node', 'test', 'task', 'done', '1']);
    consoleSpy.mockClear();
    await program.parseAsync(['node', 'test', 'task', 'list', '--all']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Task to complete');
  });

  it('should reject invalid priority', async () => {
    let exitCalled = false;
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      exitCalled = true;
      throw new Error(`process.exit(${code})`);
    }) as never);

    await expect(
      program.parseAsync(['node', 'test', 'task', 'add', 'Task', '-p', 'invalid'])
    ).rejects.toThrow();

    expect(errorSpy).toHaveBeenCalled();
    const errorOutput = errorSpy.mock.calls.map(c => c[0]).join('\n');
    expect(errorOutput).toContain('Invalid priority');
  });

  it('should handle task not found', async () => {
    let exitCalled = false;
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      exitCalled = true;
      throw new Error(`process.exit(${code})`);
    }) as never);

    await expect(
      program.parseAsync(['node', 'test', 'task', 'done', '999'])
    ).rejects.toThrow();

    expect(errorSpy).toHaveBeenCalled();
    const errorOutput = errorSpy.mock.calls.map(c => c[0]).join('\n');
    expect(errorOutput).toContain('not found');
  });

  it('should handle invalid task ID', async () => {
    let exitCalled = false;
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      exitCalled = true;
      throw new Error(`process.exit(${code})`);
    }) as never);

    await expect(
      program.parseAsync(['node', 'test', 'task', 'done', 'abc'])
    ).rejects.toThrow();

    expect(errorSpy).toHaveBeenCalled();
    const errorOutput = errorSpy.mock.calls.map(c => c[0]).join('\n');
    expect(errorOutput).toContain('Invalid task ID');
  });
});
