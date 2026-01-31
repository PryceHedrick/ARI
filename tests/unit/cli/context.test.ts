import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerContextCommand } from '../../../src/cli/commands/context.js';

// Mock storage functions
vi.mock('../../../src/system/storage.js', () => ({
  listContexts: vi.fn().mockResolvedValue([]),
  getContext: vi.fn().mockResolvedValue(null),
  saveContext: vi.fn().mockResolvedValue(undefined),
  getActiveContext: vi.fn().mockResolvedValue({ contextId: null }),
  setActiveContext: vi.fn().mockResolvedValue(undefined),
  ensureContextsDir: vi.fn().mockResolvedValue(undefined),
}));

describe('Context Command', () => {
  let program: Command;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('registerContextCommand()', () => {
    it('should register the context command', () => {
      registerContextCommand(program);

      const contextCmd = program.commands.find(cmd => cmd.name() === 'context');
      expect(contextCmd).toBeDefined();
      expect(contextCmd?.description()).toBe('Manage ARI contexts (ventures + life domains)');
    });

    it('should register init subcommand', () => {
      registerContextCommand(program);

      const contextCmd = program.commands.find(cmd => cmd.name() === 'context');
      const initCmd = contextCmd?.commands.find(cmd => cmd.name() === 'init');
      expect(initCmd).toBeDefined();
      expect(initCmd?.description()).toBe('Initialize the contexts directory');
    });

    it('should register list subcommand', () => {
      registerContextCommand(program);

      const contextCmd = program.commands.find(cmd => cmd.name() === 'context');
      const listCmd = contextCmd?.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd).toBeDefined();
      expect(listCmd?.description()).toBe('List all available contexts');
    });

    it('should register create subcommand with required options', () => {
      registerContextCommand(program);

      const contextCmd = program.commands.find(cmd => cmd.name() === 'context');
      const createCmd = contextCmd?.commands.find(cmd => cmd.name() === 'create');
      expect(createCmd).toBeDefined();
      expect(createCmd?.description()).toBe('Create a new context');

      // Check for required options
      const nameOption = createCmd?.options.find(opt => opt.long === '--name');
      const typeOption = createCmd?.options.find(opt => opt.long === '--type');
      expect(nameOption).toBeDefined();
      expect(typeOption).toBeDefined();
    });

    it('should register select subcommand with argument', () => {
      registerContextCommand(program);

      const contextCmd = program.commands.find(cmd => cmd.name() === 'context');
      const selectCmd = contextCmd?.commands.find(cmd => cmd.name() === 'select');
      expect(selectCmd).toBeDefined();
      expect(selectCmd?.description()).toBe('Set the active context');
    });

    it('should register show subcommand with argument', () => {
      registerContextCommand(program);

      const contextCmd = program.commands.find(cmd => cmd.name() === 'context');
      const showCmd = contextCmd?.commands.find(cmd => cmd.name() === 'show');
      expect(showCmd).toBeDefined();
      expect(showCmd?.description()).toBe('Show details of a context');
    });

    it('should have 5 subcommands', () => {
      registerContextCommand(program);

      const contextCmd = program.commands.find(cmd => cmd.name() === 'context');
      expect(contextCmd?.commands.length).toBe(5);
    });
  });
});
