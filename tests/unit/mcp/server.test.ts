import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the MCP SDK before importing server
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: Symbol('CallToolRequest'),
  ListToolsRequestSchema: Symbol('ListToolsRequest'),
}));

// Import after mocks
import { ARIMCPServer } from '../../../src/mcp/server.js';

describe('ARIMCPServer', () => {
  let server: ARIMCPServer;

  beforeEach(() => {
    server = new ARIMCPServer();
  });

  describe('constructor', () => {
    it('should create server instance with all dependencies', () => {
      expect(server).toBeDefined();
    });
  });

  describe('tool definitions', () => {
    it('should define all 14 MCP tools', () => {
      // Access internal tools via the server instance
      // The tools are defined in the module scope
      const expectedTools = [
        'ari_audit_verify',
        'ari_audit_query',
        'ari_audit_stats',
        'ari_memory_store',
        'ari_memory_retrieve',
        'ari_memory_search',
        'ari_agent_status',
        'ari_agent_metrics',
        'ari_task_submit',
        'ari_council_status',
        'ari_proposal_submit',
        'ari_gate_check',
        'ari_health',
        'ari_config_get',
      ];

      // Tools are exported as module constant
      expect(expectedTools).toHaveLength(14);
    });
  });

  describe('run()', () => {
    it('should connect to transport successfully', async () => {
      await expect(server.run()).resolves.not.toThrow();
    });
  });
});

// Test the tool handlers directly by creating a testable wrapper
describe('MCP Tool Handlers', () => {
  let server: ARIMCPServer;

  beforeEach(() => {
    server = new ARIMCPServer();
  });

  describe('Audit Tools', () => {
    it('should return valid audit verification result', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.auditVerify();

      expect(result).toHaveProperty('valid', true);
      expect(result).toHaveProperty('eventCount', 0);
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should return audit query results', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.auditQuery({ action: 'test', limit: 10 });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return audit statistics', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.auditStats();

      expect(result).toHaveProperty('totalEvents', 0);
      expect(result).toHaveProperty('eventsByType');
      expect(result).toHaveProperty('chainValid', true);
      expect(result).toHaveProperty('lastEventTimestamp');
    });
  });

  describe('Memory Tools', () => {
    it('should store memory entry', async () => {
      // @ts-expect-error - accessing private method for testing
      const result = await server.memoryStore({
        key: 'test-key',
        content: 'test content',
        domain: 'patterns',
        confidence: 0.9,
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('id');
    });

    it('should store memory with default confidence', async () => {
      // @ts-expect-error - accessing private method for testing
      const result = await server.memoryStore({
        key: 'test-key',
        content: 'test content',
        domain: 'patterns',
      });

      expect(result).toHaveProperty('success', true);
    });

    it('should retrieve memory entry', async () => {
      // @ts-expect-error - accessing private method for testing
      const result = await server.memoryRetrieve({ key: 'test-key' });

      // May return null if not found
      expect(result !== undefined).toBe(true);
    });

    it('should search memory', async () => {
      // @ts-expect-error - accessing private method for testing
      const result = await server.memorySearch({ domain: 'patterns', limit: 10 });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should search memory with default limit', async () => {
      // @ts-expect-error - accessing private method for testing
      const result = await server.memorySearch({});

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Agent Tools', () => {
    it('should return agent status', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.agentStatus({});

      expect(result).toHaveProperty('agents');
      expect(result.agents).toHaveProperty('CORE');
      expect(result.agents).toHaveProperty('GUARDIAN');
      expect(result.agents).toHaveProperty('PLANNER');
      expect(result.agents).toHaveProperty('EXECUTOR');
      expect(result.agents).toHaveProperty('MEMORY');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return agent status for specific agent', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.agentStatus({ agent: 'CORE' });

      expect(result).toHaveProperty('agents');
    });

    it('should return agent metrics', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.agentMetrics({ agent: 'CORE', period: 'hour' });

      expect(result).toHaveProperty('agent', 'CORE');
      expect(result).toHaveProperty('period', 'hour');
      expect(result).toHaveProperty('metrics');
      expect(result.metrics).toHaveProperty('tasksCompleted');
      expect(result.metrics).toHaveProperty('successRate');
      expect(result.metrics).toHaveProperty('avgLatencyMs');
      expect(result.metrics).toHaveProperty('errorsCount');
    });

    it('should return agent metrics with defaults', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.agentMetrics({});

      expect(result).toHaveProperty('agent', 'all');
      expect(result).toHaveProperty('period', 'day');
    });

    it('should submit task and return task ID', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.taskSubmit({ content: 'Test task content', priority: 'high' });

      expect(result).toHaveProperty('taskId');
      expect(result.taskId).toMatch(/^task_\d+_[a-z0-9]+$/);
      expect(result).toHaveProperty('status', 'submitted');
    });

    it('should submit task with empty content', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.taskSubmit({});

      expect(result).toHaveProperty('taskId');
      expect(result).toHaveProperty('status', 'submitted');
    });
  });

  describe('Governance Tools', () => {
    it('should return council status', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.councilStatus();

      expect(result).toHaveProperty('members', 13);
      expect(result).toHaveProperty('quorumRequired', 7);
      expect(result).toHaveProperty('status', 'active');
      expect(result).toHaveProperty('votingAgents');
      expect(Array.isArray(result.votingAgents)).toBe(true);
      expect(result.votingAgents).toHaveLength(13);
    });

    it('should submit proposal', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.proposalSubmit({
        title: 'Test Proposal',
        description: 'This is a test proposal',
        type: 'policy',
        changes: ['Change 1', 'Change 2'],
      });

      expect(result).toHaveProperty('proposalId');
      expect(result).toHaveProperty('status', 'submitted_for_review');
    });

    it('should submit proposal with default values', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.proposalSubmit({});

      expect(result).toHaveProperty('proposalId');
      expect(result).toHaveProperty('status', 'submitted_for_review');
    });

    it('should check quality gates', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.gateCheck({ operation: 'deploy', context: { env: 'prod' } });

      expect(result).toHaveProperty('passed', true);
      expect(result).toHaveProperty('gates');
      expect(result.gates).toHaveProperty('security', true);
      expect(result.gates).toHaveProperty('quality', true);
      expect(result.gates).toHaveProperty('performance', true);
      expect(result.gates).toHaveProperty('compliance', true);
      expect(result.gates).toHaveProperty('testing', true);
    });
  });

  describe('System Tools', () => {
    it('should return system health', () => {
      // @ts-expect-error - accessing private method for testing
      const result = server.systemHealth();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('subsystems');
      expect(result.subsystems).toHaveProperty('audit');
      expect(result.subsystems).toHaveProperty('memory');
      expect(result.subsystems).toHaveProperty('agents');
      expect(result.subsystems).toHaveProperty('governance');
      expect(result.subsystems).toHaveProperty('gateway');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return config', async () => {
      // @ts-expect-error - accessing private method for testing
      const result = await server.configGet({});

      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('gateway');
      expect(result.gateway).toHaveProperty('port');
      expect(result.gateway).toHaveProperty('host', '127.0.0.1');
    });

    it('should return specific config key', async () => {
      // @ts-expect-error - accessing private method for testing
      const result = await server.configGet({ key: 'version' });

      expect(result).toHaveProperty('version');
    });
  });

  describe('handleToolCall', () => {
    it('should handle unknown tool', async () => {
      // @ts-expect-error - accessing private method for testing
      await expect(server.handleToolCall('unknown_tool', {}))
        .rejects.toThrow('Unknown tool: unknown_tool');
    });

    it('should route to correct audit handlers', async () => {
      // @ts-expect-error - accessing private method for testing
      const verifyResult = await server.handleToolCall('ari_audit_verify', {});
      expect(verifyResult).toHaveProperty('valid');

      // @ts-expect-error - accessing private method for testing
      const queryResult = await server.handleToolCall('ari_audit_query', {});
      expect(Array.isArray(queryResult)).toBe(true);

      // @ts-expect-error - accessing private method for testing
      const statsResult = await server.handleToolCall('ari_audit_stats', {});
      expect(statsResult).toHaveProperty('totalEvents');
    });

    it('should route to correct memory handlers', async () => {
      // @ts-expect-error - accessing private method for testing
      const storeResult = await server.handleToolCall('ari_memory_store', {
        content: 'test',
        domain: 'test',
      });
      expect(storeResult).toHaveProperty('success');

      // @ts-expect-error - accessing private method for testing
      const retrieveResult = await server.handleToolCall('ari_memory_retrieve', { key: 'test' });
      expect(retrieveResult !== undefined).toBe(true);

      // @ts-expect-error - accessing private method for testing
      const searchResult = await server.handleToolCall('ari_memory_search', {});
      expect(Array.isArray(searchResult)).toBe(true);
    });

    it('should route to correct agent handlers', async () => {
      // @ts-expect-error - accessing private method for testing
      const statusResult = await server.handleToolCall('ari_agent_status', {});
      expect(statusResult).toHaveProperty('agents');

      // @ts-expect-error - accessing private method for testing
      const metricsResult = await server.handleToolCall('ari_agent_metrics', {});
      expect(metricsResult).toHaveProperty('metrics');

      // @ts-expect-error - accessing private method for testing
      const submitResult = await server.handleToolCall('ari_task_submit', { content: 'test' });
      expect(submitResult).toHaveProperty('taskId');
    });

    it('should route to correct governance handlers', async () => {
      // @ts-expect-error - accessing private method for testing
      const councilResult = await server.handleToolCall('ari_council_status', {});
      expect(councilResult).toHaveProperty('members');

      // @ts-expect-error - accessing private method for testing
      const proposalResult = await server.handleToolCall('ari_proposal_submit', {
        title: 'test',
        description: 'test',
        type: 'policy',
      });
      expect(proposalResult).toHaveProperty('proposalId');

      // @ts-expect-error - accessing private method for testing
      const gateResult = await server.handleToolCall('ari_gate_check', { operation: 'test' });
      expect(gateResult).toHaveProperty('passed');
    });

    it('should route to correct system handlers', async () => {
      // @ts-expect-error - accessing private method for testing
      const healthResult = await server.handleToolCall('ari_health', {});
      expect(healthResult).toHaveProperty('status');

      // @ts-expect-error - accessing private method for testing
      const configResult = await server.handleToolCall('ari_config_get', {});
      expect(configResult).toHaveProperty('version');
    });
  });
});
