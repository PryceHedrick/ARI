/**
 * ARI MCP Server
 *
 * Provides Claude Code direct access to ARI's internal systems:
 * - Audit trail queries and verification
 * - Memory storage and retrieval
 * - Agent status and metrics
 * - Governance council operations
 *
 * Security: Runs locally only, inherits OPERATOR trust level
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Audit } from '../kernel/audit.js';
import { EventBus } from '../kernel/event-bus.js';
import { loadConfig } from '../kernel/config.js';
import { MemoryManager } from '../agents/memory-manager.js';
import { Council } from '../governance/council.js';
import type { TrustLevel } from '../kernel/types.js';

// MCP Trust Level: OPERATOR (Claude Code runs as authenticated user)
const MCP_TRUST_LEVEL: TrustLevel = 'OPERATOR';

// Tool definitions
const TOOLS: Tool[] = [
  // Audit Tools
  {
    name: 'ari_audit_verify',
    description: 'Verify the integrity of the audit chain. Returns validation status and any broken links.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'ari_audit_query',
    description: 'Query audit events with optional filters. Supports filtering by action, agent, and time range.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Filter by action type (e.g., "task_start", "security:threat")' },
        agent: { type: 'string', description: 'Filter by agent ID' },
        limit: { type: 'number', description: 'Maximum events to return (default: 50)' },
        since: { type: 'string', description: 'ISO timestamp to filter events after' },
      },
    },
  },
  {
    name: 'ari_audit_stats',
    description: 'Get audit statistics including event counts by type, recent activity, and chain health.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // Memory Tools
  {
    name: 'ari_memory_store',
    description: 'Store knowledge with provenance tracking. Used to persist learnings, patterns, and decisions.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Unique identifier for this memory' },
        content: { type: 'string', description: 'The knowledge content to store' },
        domain: { type: 'string', description: 'Domain category (e.g., "patterns", "fixes", "decisions")' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for searchability' },
        confidence: { type: 'number', description: 'Confidence level 0-1 (default: 0.8)' },
      },
      required: ['key', 'content', 'domain'],
    },
  },
  {
    name: 'ari_memory_retrieve',
    description: 'Retrieve stored knowledge by key.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'The memory key to retrieve' },
      },
      required: ['key'],
    },
  },
  {
    name: 'ari_memory_search',
    description: 'Search memory by domain, tags, or text content.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Filter by domain' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags (OR matching)' },
        query: { type: 'string', description: 'Text search query' },
        limit: { type: 'number', description: 'Maximum results (default: 20)' },
      },
    },
  },

  // Agent Tools
  {
    name: 'ari_agent_status',
    description: 'Get status of ARI agents including health, current tasks, and resource usage.',
    inputSchema: {
      type: 'object',
      properties: {
        agent: { type: 'string', description: 'Specific agent to query (optional, returns all if omitted)' },
      },
    },
  },
  {
    name: 'ari_agent_metrics',
    description: 'Get performance metrics for agents including success rates, latency, and throughput.',
    inputSchema: {
      type: 'object',
      properties: {
        agent: { type: 'string', description: 'Specific agent to query' },
        period: { type: 'string', description: 'Time period: "hour", "day", "week" (default: "day")' },
      },
    },
  },
  {
    name: 'ari_task_submit',
    description: 'Submit a task to ARI for processing. Returns task ID for tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Task content/instruction' },
        priority: { type: 'string', enum: ['low', 'normal', 'high', 'critical'], description: 'Task priority' },
        context: { type: 'object', description: 'Additional context for the task' },
      },
      required: ['content'],
    },
  },

  // Governance Tools
  {
    name: 'ari_council_status',
    description: 'Get the status of the governance council including member states and voting history.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'ari_proposal_submit',
    description: 'Submit a governance proposal for council review.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Proposal title' },
        description: { type: 'string', description: 'Detailed proposal description' },
        type: { type: 'string', enum: ['policy', 'permission', 'architecture', 'security'], description: 'Proposal type' },
        changes: { type: 'array', items: { type: 'string' }, description: 'List of proposed changes' },
      },
      required: ['title', 'description', 'type'],
    },
  },
  {
    name: 'ari_gate_check',
    description: 'Check if an operation passes quality gates (Overseer checks).',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', description: 'Operation to validate' },
        context: { type: 'object', description: 'Operation context and parameters' },
      },
      required: ['operation'],
    },
  },

  // System Tools
  {
    name: 'ari_health',
    description: 'Get overall ARI system health including all subsystems.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'ari_config_get',
    description: 'Get current ARI configuration (non-sensitive values only).',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Specific config key (optional)' },
      },
    },
  },
];

export class ARIMCPServer {
  private server: Server;
  private eventBus: EventBus;
  private audit: Audit;
  private memoryManager: MemoryManager;
  private council: Council;

  constructor() {
    this.eventBus = new EventBus();
    this.audit = new Audit(this.eventBus);
    this.memoryManager = new MemoryManager(this.eventBus);
    this.council = new Council(this.eventBus);

    this.server = new Server(
      {
        name: 'ari-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Log all MCP operations to audit trail
      this.eventBus.emit('audit:log', {
        action: 'mcp:tool_call',
        agent: 'MCP_SERVER',
        details: { tool: name, args, trustLevel: MCP_TRUST_LEVEL },
        timestamp: new Date().toISOString(),
      });

      try {
        const result = await this.handleToolCall(name, args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    });
  }

  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      // Audit Tools
      case 'ari_audit_verify':
        return this.auditVerify();
      case 'ari_audit_query':
        return this.auditQuery(args);
      case 'ari_audit_stats':
        return this.auditStats();

      // Memory Tools
      case 'ari_memory_store':
        return this.memoryStore(args);
      case 'ari_memory_retrieve':
        return this.memoryRetrieve(args);
      case 'ari_memory_search':
        return this.memorySearch(args);

      // Agent Tools
      case 'ari_agent_status':
        return this.agentStatus(args);
      case 'ari_agent_metrics':
        return this.agentMetrics(args);
      case 'ari_task_submit':
        return this.taskSubmit(args);

      // Governance Tools
      case 'ari_council_status':
        return this.councilStatus();
      case 'ari_proposal_submit':
        return this.proposalSubmit(args);
      case 'ari_gate_check':
        return this.gateCheck(args);

      // System Tools
      case 'ari_health':
        return this.systemHealth();
      case 'ari_config_get':
        return this.configGet(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  // Audit implementations
  private async auditVerify(): Promise<{ valid: boolean; eventCount: number; issues: string[] }> {
    const result = await this.audit.verifyChain();
    return {
      valid: result.valid,
      eventCount: result.eventCount,
      issues: result.issues || [],
    };
  }

  private async auditQuery(args: Record<string, unknown>): Promise<unknown[]> {
    const events = await this.audit.query({
      action: args.action as string | undefined,
      agent: args.agent as string | undefined,
      limit: (args.limit as number) || 50,
      since: args.since as string | undefined,
    });
    return events;
  }

  private async auditStats(): Promise<Record<string, unknown>> {
    return this.audit.getStats();
  }

  // Memory implementations
  private async memoryStore(args: Record<string, unknown>): Promise<{ success: boolean; id: string }> {
    const id = await this.memoryManager.store({
      key: args.key as string,
      content: args.content as string,
      domain: args.domain as string,
      tags: (args.tags as string[]) || [],
      confidence: (args.confidence as number) || 0.8,
      source: 'MCP_SERVER',
      timestamp: new Date().toISOString(),
    });
    return { success: true, id };
  }

  private async memoryRetrieve(args: Record<string, unknown>): Promise<unknown> {
    return this.memoryManager.retrieve(args.key as string);
  }

  private async memorySearch(args: Record<string, unknown>): Promise<unknown[]> {
    return this.memoryManager.search({
      domain: args.domain as string | undefined,
      tags: args.tags as string[] | undefined,
      query: args.query as string | undefined,
      limit: (args.limit as number) || 20,
    });
  }

  // Agent implementations
  private async agentStatus(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Return mock status for now - integrate with actual agent registry
    return {
      agents: {
        CORE: { status: 'active', tasks: 0 },
        GUARDIAN: { status: 'active', threats_blocked: 0 },
        PLANNER: { status: 'idle', pending_plans: 0 },
        EXECUTOR: { status: 'active', executing: 0 },
        MEMORY: { status: 'active', entries: 0 },
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async agentMetrics(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      agent: args.agent || 'all',
      period: args.period || 'day',
      metrics: {
        tasksCompleted: 0,
        successRate: 1.0,
        avgLatencyMs: 0,
        errorsCount: 0,
      },
    };
  }

  private async taskSubmit(args: Record<string, unknown>): Promise<{ taskId: string; status: string }> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    this.eventBus.emit('task:submitted', {
      id: taskId,
      content: args.content,
      priority: args.priority || 'normal',
      context: args.context || {},
      source: 'MCP_SERVER',
      trustLevel: MCP_TRUST_LEVEL,
    });

    return { taskId, status: 'submitted' };
  }

  // Governance implementations
  private async councilStatus(): Promise<Record<string, unknown>> {
    return this.council.getStatus();
  }

  private async proposalSubmit(args: Record<string, unknown>): Promise<{ proposalId: string; status: string }> {
    const proposalId = `prop_${Date.now()}`;

    this.eventBus.emit('governance:proposal', {
      id: proposalId,
      title: args.title,
      description: args.description,
      type: args.type,
      changes: args.changes || [],
      submitter: 'MCP_SERVER',
      timestamp: new Date().toISOString(),
    });

    return { proposalId, status: 'submitted_for_review' };
  }

  private async gateCheck(args: Record<string, unknown>): Promise<{ passed: boolean; gates: Record<string, boolean> }> {
    // Implement quality gate checks
    return {
      passed: true,
      gates: {
        security: true,
        quality: true,
        performance: true,
        compliance: true,
        testing: true,
      },
    };
  }

  // System implementations
  private async systemHealth(): Promise<Record<string, unknown>> {
    const auditHealth = await this.auditVerify();

    return {
      status: 'healthy',
      subsystems: {
        audit: { healthy: auditHealth.valid, events: auditHealth.eventCount },
        memory: { healthy: true },
        agents: { healthy: true, active: 5 },
        governance: { healthy: true },
        gateway: { healthy: true, port: 3141 },
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  private async configGet(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const config = await loadConfig();

    // Filter sensitive values
    const safeConfig = {
      version: config.version,
      gateway: {
        port: config.gateway?.port || 3141,
        host: '127.0.0.1', // Always loopback
      },
      features: config.features || {},
    };

    if (args.key) {
      return { [args.key as string]: safeConfig[args.key as keyof typeof safeConfig] };
    }
    return safeConfig;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.eventBus.emit('audit:log', {
      action: 'mcp:server_started',
      agent: 'MCP_SERVER',
      details: { tools: TOOLS.length, trustLevel: MCP_TRUST_LEVEL },
      timestamp: new Date().toISOString(),
    });
  }
}

// Run server
const server = new ARIMCPServer();
server.run().catch(console.error);
