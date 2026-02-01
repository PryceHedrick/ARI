// ARI API Client
// Connects to the Fastify gateway at 127.0.0.1:3141 (proxied by Vite)

import type {
  HealthStatus,
  DetailedHealth,
  Agent,
  AgentStats,
  Proposal,
  ConstitutionalRule,
  QualityGate,
  MemoryEntry,
  AuditLogResponse,
  AuditVerification,
  Tool,
  Context,
  SchedulerStatus,
  ScheduledTask,
  Subagent,
  SubagentStats,
  SystemMetrics,
} from '../types/api';

const API_BASE = '/api';

class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);

  if (!response.ok) {
    throw new APIError(
      response.status,
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

// Health Endpoints
export const getHealth = (): Promise<HealthStatus> => fetchAPI('/health');

export const getDetailedHealth = (): Promise<DetailedHealth> =>
  fetchAPI('/health/detailed');

// Agent Endpoints
export const getAgents = (): Promise<Agent[]> => fetchAPI('/agents');

export const getAgentStats = (agentId: string): Promise<AgentStats> =>
  fetchAPI(`/agents/${agentId}/stats`);

// Governance Endpoints
export const getProposals = (): Promise<Proposal[]> => fetchAPI('/proposals');

export const getProposal = (id: string): Promise<Proposal> =>
  fetchAPI(`/proposals/${id}`);

export const getGovernanceRules = (): Promise<ConstitutionalRule[]> =>
  fetchAPI('/governance/rules');

export const getQualityGates = (): Promise<QualityGate[]> =>
  fetchAPI('/governance/gates');

// Memory Endpoints
export const getMemories = (params?: {
  type?: string;
  partition?: string;
  limit?: number;
}): Promise<MemoryEntry[]> => {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.partition) query.set('partition', params.partition);
  if (params?.limit) query.set('limit', params.limit.toString());

  const queryString = query.toString();
  return fetchAPI(`/memory${queryString ? `?${queryString}` : ''}`);
};

export const getMemory = (id: string): Promise<MemoryEntry> =>
  fetchAPI(`/memory/${id}`);

// Audit Endpoints
export const getAuditLog = (params?: {
  limit?: number;
  offset?: number;
}): Promise<AuditLogResponse> => {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.offset) query.set('offset', params.offset.toString());

  const queryString = query.toString();
  return fetchAPI(`/audit${queryString ? `?${queryString}` : ''}`);
};

export const verifyAuditChain = (): Promise<AuditVerification> =>
  fetchAPI('/audit/verify');

// Tool Endpoints
export const getTools = (): Promise<Tool[]> => fetchAPI('/tools');

// Context Endpoints
export const getContexts = (): Promise<Context[]> => fetchAPI('/contexts');

export const getActiveContext = (): Promise<Context> =>
  fetchAPI('/contexts/active');

// Scheduler Endpoints
export const getSchedulerStatus = (): Promise<SchedulerStatus> =>
  fetchAPI('/scheduler/status');

export const getSchedulerTasks = (): Promise<ScheduledTask[]> =>
  fetchAPI('/scheduler/tasks');

export const triggerSchedulerTask = async (taskId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  const response = await fetch(`${API_BASE}/scheduler/tasks/${taskId}/trigger`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new APIError(response.status, errorData.error || 'Failed to trigger task');
  }
  return response.json();
};

export const toggleSchedulerTask = async (taskId: string): Promise<{ success: boolean; taskId: string; enabled: boolean }> => {
  const response = await fetch(`${API_BASE}/scheduler/tasks/${taskId}/toggle`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new APIError(response.status, errorData.error || 'Failed to toggle task');
  }
  return response.json();
};

// Subagent Endpoints
export const getSubagents = (): Promise<Subagent[]> => fetchAPI('/subagents');

export const getSubagentStats = (): Promise<SubagentStats> =>
  fetchAPI('/subagents/stats');

export const getSubagent = (agentId: string): Promise<Subagent> =>
  fetchAPI(`/subagents/${agentId}`);

export const deleteSubagent = async (agentId: string): Promise<{ success: boolean; message?: string }> => {
  const response = await fetch(`${API_BASE}/subagents/${agentId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new APIError(response.status, errorData.error || 'Failed to delete subagent');
  }
  return response.json();
};

// System Metrics
export const getSystemMetrics = (): Promise<SystemMetrics> =>
  fetchAPI('/system/metrics');

// WebSocket Connection
export function connectWebSocket(
  onMessage: (event: MessageEvent) => void,
  onError?: (event: Event) => void,
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

  ws.onmessage = onMessage;
  if (onError) {
    ws.onerror = onError;
  }

  return ws;
}
