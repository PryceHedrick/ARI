import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerAuditCommand } from '../../../src/cli/commands/audit.js';

// Mock AuditLogger
vi.mock('../../../src/kernel/audit.js', () => ({
  AuditLogger: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(undefined),
    getEvents: vi.fn().mockReturnValue([]),
    verify: vi.fn().mockReturnValue({ valid: true, details: 'Chain valid' }),
    getSecurityEvents: vi.fn().mockReturnValue([]),
  })),
}));

describe('Audit Command', () => {
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

  describe('registerAuditCommand()', () => {
    it('should register the audit command', () => {
      registerAuditCommand(program);

      const auditCmd = program.commands.find(cmd => cmd.name() === 'audit');
      expect(auditCmd).toBeDefined();
      expect(auditCmd?.description()).toBe('Audit log management and verification');
    });

    it('should register list subcommand', () => {
      registerAuditCommand(program);

      const auditCmd = program.commands.find(cmd => cmd.name() === 'audit');
      const listCmd = auditCmd?.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd).toBeDefined();
      expect(listCmd?.description()).toBe('List recent audit events');
    });

    it('should register verify subcommand', () => {
      registerAuditCommand(program);

      const auditCmd = program.commands.find(cmd => cmd.name() === 'audit');
      const verifyCmd = auditCmd?.commands.find(cmd => cmd.name() === 'verify');
      expect(verifyCmd).toBeDefined();
      expect(verifyCmd?.description()).toBe('Verify the integrity of the audit chain');
    });

    it('should register security subcommand', () => {
      registerAuditCommand(program);

      const auditCmd = program.commands.find(cmd => cmd.name() === 'audit');
      const securityCmd = auditCmd?.commands.find(cmd => cmd.name() === 'security');
      expect(securityCmd).toBeDefined();
      expect(securityCmd?.description()).toBe('Show security events from the audit log');
    });

    it('should have count option on list subcommand', () => {
      registerAuditCommand(program);

      const auditCmd = program.commands.find(cmd => cmd.name() === 'audit');
      const listCmd = auditCmd?.commands.find(cmd => cmd.name() === 'list');

      const countOption = listCmd?.options.find(opt => opt.long === '--count');
      expect(countOption).toBeDefined();
    });

    it('should have 3 subcommands', () => {
      registerAuditCommand(program);

      const auditCmd = program.commands.find(cmd => cmd.name() === 'audit');
      expect(auditCmd?.commands.length).toBe(3);
    });
  });
});
