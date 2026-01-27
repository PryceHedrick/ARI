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
  AuditEntry,
  AuditVerification,
  Tool,
  Context,
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
}): Promise<AuditEntry[]> => {
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
