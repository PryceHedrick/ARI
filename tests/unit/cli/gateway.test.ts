import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerGatewayCommand } from '../../../src/cli/commands/gateway.js';

// Mock all heavy dependencies
vi.mock('../../../src/kernel/gateway.js', () => ({
  Gateway: vi.fn().mockImplementation(() => ({
    registerPlugin: vi.fn().mockResolvedValue(undefined),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    getAddress: vi.fn().mockReturnValue('http://127.0.0.1:3141'),
    getHttpServer: vi.fn().mockReturnValue({}),
  })),
}));

vi.mock('../../../src/kernel/audit.js', () => ({
  AuditLogger: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../../src/kernel/event-bus.js', () => ({
  EventBus: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../../src/agents/guardian.js', () => ({
  Guardian: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../../src/agents/memory-manager.js', () => ({
  MemoryManager: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../../src/agents/executor.js', () => ({
  Executor: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../../src/agents/planner.js', () => ({
  Planner: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../../src/agents/core.js', () => ({
  Core: vi.fn().mockImplementation(() => ({
    setGovernance: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../../src/governance/council.js', () => ({
  Council: vi.fn().mockImplementation(() => ({
    expireOverdueVotes: vi.fn().mockReturnValue(0),
  })),
}));

vi.mock('../../../src/governance/arbiter.js', () => ({
  Arbiter: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock('../../../src/governance/overseer.js', () => ({
  Overseer: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock('../../../src/system/router.js', () => ({
  SystemRouter: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock('../../../src/api/routes.js', () => ({
  apiRoutes: vi.fn(),
}));

vi.mock('../../../src/api/ws.js', () => ({
  WebSocketBroadcaster: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
  })),
}));

vi.mock('../../../src/system/storage.js', () => ({}));

vi.mock('../../../src/autonomous/agent.js', () => ({
  AutonomousAgent: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../../src/autonomous/daily-audit.js', () => ({
  dailyAudit: {
    init: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Gateway Command', () => {
  let program: Command;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('registerGatewayCommand()', () => {
    it('should register the gateway command', () => {
      registerGatewayCommand(program);

      const gatewayCmd = program.commands.find(cmd => cmd.name() === 'gateway');
      expect(gatewayCmd).toBeDefined();
      expect(gatewayCmd?.description()).toBe('Manage ARI Gateway server');
    });

    it('should register start subcommand', () => {
      registerGatewayCommand(program);

      const gatewayCmd = program.commands.find(cmd => cmd.name() === 'gateway');
      const startCmd = gatewayCmd?.commands.find(cmd => cmd.name() === 'start');
      expect(startCmd).toBeDefined();
      expect(startCmd?.description()).toBe('Start the ARI Gateway server with full system');
    });

    it('should register status subcommand', () => {
      registerGatewayCommand(program);

      const gatewayCmd = program.commands.find(cmd => cmd.name() === 'gateway');
      const statusCmd = gatewayCmd?.commands.find(cmd => cmd.name() === 'status');
      expect(statusCmd).toBeDefined();
      expect(statusCmd?.description()).toBe('Check if the ARI Gateway is running');
    });

    it('should have port option on start command', () => {
      registerGatewayCommand(program);

      const gatewayCmd = program.commands.find(cmd => cmd.name() === 'gateway');
      const startCmd = gatewayCmd?.commands.find(cmd => cmd.name() === 'start');
      const portOption = startCmd?.options.find(opt => opt.long === '--port');
      expect(portOption).toBeDefined();
    });

    it('should have port option on status command', () => {
      registerGatewayCommand(program);

      const gatewayCmd = program.commands.find(cmd => cmd.name() === 'gateway');
      const statusCmd = gatewayCmd?.commands.find(cmd => cmd.name() === 'status');
      const portOption = statusCmd?.options.find(opt => opt.long === '--port');
      expect(portOption).toBeDefined();
    });

    it('should have 2 subcommands', () => {
      registerGatewayCommand(program);

      const gatewayCmd = program.commands.find(cmd => cmd.name() === 'gateway');
      expect(gatewayCmd?.commands.length).toBe(2);
    });
  });
});
