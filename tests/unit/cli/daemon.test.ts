import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerDaemonCommand } from '../../../src/cli/commands/daemon.js';

// Mock daemon operations
vi.mock('../../../src/ops/daemon.js', () => ({
  installDaemon: vi.fn().mockResolvedValue(undefined),
  uninstallDaemon: vi.fn().mockResolvedValue(undefined),
  getDaemonStatus: vi.fn().mockResolvedValue({
    installed: true,
    running: true,
    plistPath: '/path/to/plist',
  }),
  getLogPaths: vi.fn().mockReturnValue({
    stdout: '/path/to/stdout.log',
    stderr: '/path/to/stderr.log',
  }),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('log line 1\nlog line 2\nlog line 3'),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

vi.mock('child_process', () => ({
  spawn: vi.fn().mockReturnValue({
    on: vi.fn(),
    kill: vi.fn(),
  }),
}));

describe('Daemon Command', () => {
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

  describe('registerDaemonCommand()', () => {
    it('should register the daemon command', () => {
      registerDaemonCommand(program);

      const daemonCmd = program.commands.find(cmd => cmd.name() === 'daemon');
      expect(daemonCmd).toBeDefined();
      expect(daemonCmd?.description()).toBe('Manage ARI Gateway launchd daemon');
    });

    it('should register install subcommand', () => {
      registerDaemonCommand(program);

      const daemonCmd = program.commands.find(cmd => cmd.name() === 'daemon');
      const installCmd = daemonCmd?.commands.find(cmd => cmd.name() === 'install');
      expect(installCmd).toBeDefined();
      expect(installCmd?.description()).toBe('Install and start the ARI Gateway as a launchd daemon');
    });

    it('should register uninstall subcommand', () => {
      registerDaemonCommand(program);

      const daemonCmd = program.commands.find(cmd => cmd.name() === 'daemon');
      const uninstallCmd = daemonCmd?.commands.find(cmd => cmd.name() === 'uninstall');
      expect(uninstallCmd).toBeDefined();
      expect(uninstallCmd?.description()).toBe('Stop and remove the ARI Gateway launchd daemon');
    });

    it('should register status subcommand', () => {
      registerDaemonCommand(program);

      const daemonCmd = program.commands.find(cmd => cmd.name() === 'daemon');
      const statusCmd = daemonCmd?.commands.find(cmd => cmd.name() === 'status');
      expect(statusCmd).toBeDefined();
      expect(statusCmd?.description()).toBe('Check if the ARI Gateway daemon is installed and running');
    });

    it('should register logs subcommand', () => {
      registerDaemonCommand(program);

      const daemonCmd = program.commands.find(cmd => cmd.name() === 'daemon');
      const logsCmd = daemonCmd?.commands.find(cmd => cmd.name() === 'logs');
      expect(logsCmd).toBeDefined();
      expect(logsCmd?.description()).toBe('View gateway log files');
    });

    it('should have port option on install command', () => {
      registerDaemonCommand(program);

      const daemonCmd = program.commands.find(cmd => cmd.name() === 'daemon');
      const installCmd = daemonCmd?.commands.find(cmd => cmd.name() === 'install');
      const portOption = installCmd?.options.find(opt => opt.long === '--port');
      expect(portOption).toBeDefined();
    });

    it('should have production option on install command', () => {
      registerDaemonCommand(program);

      const daemonCmd = program.commands.find(cmd => cmd.name() === 'daemon');
      const installCmd = daemonCmd?.commands.find(cmd => cmd.name() === 'install');
      const prodOption = installCmd?.options.find(opt => opt.long === '--production');
      expect(prodOption).toBeDefined();
    });

    it('should have follow option on logs command', () => {
      registerDaemonCommand(program);

      const daemonCmd = program.commands.find(cmd => cmd.name() === 'daemon');
      const logsCmd = daemonCmd?.commands.find(cmd => cmd.name() === 'logs');
      const followOption = logsCmd?.options.find(opt => opt.long === '--follow');
      expect(followOption).toBeDefined();
    });

    it('should have lines option on logs command', () => {
      registerDaemonCommand(program);

      const daemonCmd = program.commands.find(cmd => cmd.name() === 'daemon');
      const logsCmd = daemonCmd?.commands.find(cmd => cmd.name() === 'logs');
      const linesOption = logsCmd?.options.find(opt => opt.long === '--lines');
      expect(linesOption).toBeDefined();
    });

    it('should have 4 subcommands', () => {
      registerDaemonCommand(program);

      const daemonCmd = program.commands.find(cmd => cmd.name() === 'daemon');
      expect(daemonCmd?.commands.length).toBe(4);
    });
  });
});
