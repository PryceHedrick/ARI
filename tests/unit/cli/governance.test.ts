import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerGovernanceCommand } from '../../../src/cli/commands/governance.js';

describe('Governance Command', () => {
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

  describe('registerGovernanceCommand()', () => {
    it('should register the governance command', () => {
      registerGovernanceCommand(program);

      const govCmd = program.commands.find(cmd => cmd.name() === 'governance');
      expect(govCmd).toBeDefined();
      expect(govCmd?.description()).toBe('View ARI governance documents (read-only)');
    });

    it('should register show subcommand', () => {
      registerGovernanceCommand(program);

      const govCmd = program.commands.find(cmd => cmd.name() === 'governance');
      const showCmd = govCmd?.commands.find(cmd => cmd.name() === 'show');
      expect(showCmd).toBeDefined();
      expect(showCmd?.description()).toBe('Show a governance document');
    });

    it('should register list subcommand', () => {
      registerGovernanceCommand(program);

      const govCmd = program.commands.find(cmd => cmd.name() === 'governance');
      const listCmd = govCmd?.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd).toBeDefined();
      expect(listCmd?.description()).toBe('List all governance documents');
    });

    it('should have 2 subcommands', () => {
      registerGovernanceCommand(program);

      const govCmd = program.commands.find(cmd => cmd.name() === 'governance');
      expect(govCmd?.commands.length).toBe(2);
    });

    it('should have default argument for show command', () => {
      registerGovernanceCommand(program);

      const govCmd = program.commands.find(cmd => cmd.name() === 'governance');
      const showCmd = govCmd?.commands.find(cmd => cmd.name() === 'show');

      // Command should have registeredArguments for the doc argument
      expect(showCmd?.registeredArguments).toBeDefined();
    });
  });
});
