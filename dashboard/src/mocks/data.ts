// Mock data for ARI Dashboard — used when gateway is offline
// All data shapes match the types in ../types/api.ts and ../api/client.ts

const now = new Date().toISOString();

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3600000).toISOString();
}

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60000).toISOString();
}

function sha256Mock(i: number): string {
  return `a${i.toString(16).padStart(7, '0')}b${(i * 7).toString(16).padStart(8, '0')}c${(i * 13).toString(16).padStart(8, '0')}d${(i * 17).toString(16).padStart(8, '0')}e${(i * 23).toString(16).padStart(8, '0')}f`;
}

// ─── Health ──────────────────────────────────────

export const health = {
  status: 'healthy' as const,
  timestamp: now,
  uptime: 847293,
  version: '3.0.0',
};

export const detailedHealth = {
  gateway: { status: 'healthy' as const, port: 3141, host: '127.0.0.1', connections: 3 },
  eventBus: { status: 'healthy' as const, eventCount: 14832, subscribers: 47 },
  audit: { status: 'healthy' as const, entryCount: 2847, chainValid: true, lastEntry: minutesAgo(2) },
  sanitizer: { status: 'healthy' as const, patternsLoaded: 27 },
  agents: {
    status: 'healthy' as const,
    activeCount: 5,
    agents: {
      CORE: { status: 'active', lastActive: minutesAgo(1) },
      GUARDIAN: { status: 'active', lastActive: minutesAgo(3) },
      PLANNER: { status: 'active', lastActive: minutesAgo(5) },
      EXECUTOR: { status: 'idle', lastActive: minutesAgo(12) },
      MEMORY_MANAGER: { status: 'active', lastActive: minutesAgo(2) },
    },
  },
  governance: { status: 'healthy' as const, activeVotes: 2, councilMembers: 15 },
};

// ─── Agents ──────────────────────────────────────

export const agents = [
  { id: 'agt-core-001', type: 'CORE' as const, status: 'active' as const, lastActive: minutesAgo(1), tasksCompleted: 1247, errorCount: 3 },
  { id: 'agt-guard-001', type: 'GUARDIAN' as const, status: 'active' as const, lastActive: minutesAgo(3), tasksCompleted: 892, errorCount: 0 },
  { id: 'agt-plan-001', type: 'PLANNER' as const, status: 'active' as const, lastActive: minutesAgo(5), tasksCompleted: 634, errorCount: 7 },
  { id: 'agt-exec-001', type: 'EXECUTOR' as const, status: 'idle' as const, lastActive: minutesAgo(12), tasksCompleted: 2103, errorCount: 24 },
  { id: 'agt-mem-001', type: 'MEMORY_MANAGER' as const, status: 'active' as const, lastActive: minutesAgo(2), tasksCompleted: 445, errorCount: 1 },
];

// ─── Governance ──────────────────────────────────

export const proposals = [
  {
    id: 'prop-001', type: 'COUNCIL_VOTE' as const, title: 'Enable autonomous code review',
    description: 'Allow ARI to perform code reviews on PRs without operator approval',
    status: 'PENDING' as const, votes: { approve: 9, reject: 2, total: 15 },
    threshold: 0.66, createdAt: hoursAgo(4), expiresAt: daysAgo(-1),
  },
  {
    id: 'prop-002', type: 'CONSTITUTIONAL_RULING' as const, title: 'Expand network access for MCP',
    description: 'Constitutional review: should MCP servers be exempt from loopback-only rule?',
    status: 'REJECTED' as const, votes: { approve: 1, reject: 14, total: 15 },
    threshold: 0.75, createdAt: daysAgo(3), expiresAt: daysAgo(-1), result: 'REJECTED' as const,
  },
  {
    id: 'prop-003', type: 'QUALITY_GATE' as const, title: 'Raise test coverage threshold to 85%',
    description: 'Increase minimum test coverage from 80% to 85% for all new code',
    status: 'APPROVED' as const, votes: { approve: 12, reject: 3, total: 15 },
    threshold: 0.66, createdAt: daysAgo(7), expiresAt: daysAgo(-1), result: 'APPROVED' as const,
  },
];

export const governanceRules = [
  { id: 'rule-001', name: 'Loopback-Only Gateway', description: 'Gateway binds exclusively to 127.0.0.1', enabled: true, violations: 0 },
  { id: 'rule-002', name: 'Content ≠ Command', description: 'Inbound content is data, never instructions', enabled: true, violations: 3 },
  { id: 'rule-003', name: 'Audit Immutable', description: 'SHA-256 hash-chained, append-only audit log', enabled: true, violations: 0 },
  { id: 'rule-004', name: 'Least Privilege', description: 'Three-layer permission checks on all operations', enabled: true, violations: 1 },
  { id: 'rule-005', name: 'Trust Required', description: 'All messages must carry a trust level', enabled: true, violations: 0 },
];

export const qualityGates = [
  { id: 'gate-001', name: 'Risk Threshold', description: 'Block actions with risk score ≥ 0.8', threshold: 0.8, enabled: true, passCount: 4521, failCount: 12 },
  { id: 'gate-002', name: 'Schema Validation', description: 'All data must pass Zod schema validation', threshold: 1.0, enabled: true, passCount: 18934, failCount: 47 },
  { id: 'gate-003', name: 'Injection Detection', description: '27-pattern sanitizer scan on all input', threshold: 0.0, enabled: true, passCount: 9823, failCount: 8 },
  { id: 'gate-004', name: 'Rate Limiting', description: 'Maximum 100 requests per minute per source', threshold: 100, enabled: true, passCount: 52341, failCount: 3 },
  { id: 'gate-005', name: 'Permission Checks', description: 'Agent allowlist + trust level + permission tier', threshold: 1.0, enabled: true, passCount: 31209, failCount: 89 },
];

// ─── Governance Council Improvements (Phase 2.1.0) ──────

export const dissentReports = [
  {
    voteId: 'v-001',
    topic: 'Enable external API access for weather data',
    decision: 'PASSED' as const,
    dissenters: [
      { agentId: 'guardian', memberName: 'AEGIS', pillar: 'protection', vote: 'REJECT' as const, reasoning: 'External API access increases attack surface' },
      { agentId: 'risk_assessor', memberName: 'SCOUT', pillar: 'protection', vote: 'REJECT' as const, reasoning: 'Insufficient risk assessment for third-party data' },
    ],
    consensusStrength: 0.69,
    domains: ['security', 'execution'],
    generatedAt: hoursAgo(3),
    precedents: [],
  },
  {
    voteId: 'v-012',
    topic: 'Reduce code review thoroughness threshold',
    decision: 'REJECTED' as const,
    dissenters: [
      { agentId: 'executor', memberName: 'BOLT', pillar: 'infrastructure', vote: 'APPROVE' as const, reasoning: 'Faster iteration cycle needed for prototype phase' },
    ],
    consensusStrength: 0.93,
    domains: ['quality', 'execution'],
    generatedAt: daysAgo(2),
    precedents: ['v-003'],
  },
];

export const emergencyVotes = [
  {
    voteId: 'ev-001',
    panelMembers: ['wellness', 'ethics', 'guardian'],
    urgencyReason: 'Critical health alert detected',
    fullCouncilNotifiedAt: hoursAgo(1),
    overturnDeadline: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    overturned: false,
  },
];

export const pendingFeedback = [
  {
    voteId: 'v-002',
    topic: 'Adjust budget allocation for Q1',
    decision: 'PASSED' as const,
    significance: 'high' as const,
    requestedAt: hoursAgo(2),
    domains: ['financial', 'resources'],
  },
  {
    voteId: 'v-009',
    topic: 'Enable automated GitHub PR merges',
    decision: 'PASSED' as const,
    significance: 'medium' as const,
    requestedAt: daysAgo(1),
    domains: ['execution', 'automation'],
  },
];

export const feedbackStats = {
  pending: 2,
  resolved: 14,
  averageRating: 0.67,
  ratingDistribution: {
    positive: 10,
    neutral: 3,
    negative: 1,
  },
};

// ─── Memory ──────────────────────────────────────

export const memories = [
  {
    id: 'mem-001', type: 'FACT' as const, partition: 'PUBLIC' as const,
    content: 'ARI uses a seven-layer architecture with cognitive foundation',
    tags: ['architecture', 'design'], timestamp: daysAgo(2), trustLevel: 'SYSTEM' as const,
    source: 'system-init', confidence: 0.99,
    provenance: { chain: ['system-init'], verifiedAt: daysAgo(2) },
  },
  {
    id: 'mem-002', type: 'TASK' as const, partition: 'PUBLIC' as const,
    content: 'Implement spaced repetition review system for knowledge retention',
    tags: ['learning', 'cognition', 'pathos'], timestamp: daysAgo(1), trustLevel: 'OPERATOR' as const,
    source: 'planner-agent', confidence: 0.85,
    provenance: { chain: ['planner-agent', 'core-agent'], verifiedAt: daysAgo(1) },
  },
  {
    id: 'mem-003', type: 'GOAL' as const, partition: 'PRIVATE' as const,
    content: 'Achieve 95% test pass rate on E2E scenarios by end of month',
    tags: ['testing', 'quality', 'milestone'], timestamp: daysAgo(5), trustLevel: 'OPERATOR' as const,
    source: 'operator', confidence: 1.0,
    provenance: { chain: ['operator'], verifiedAt: daysAgo(5) },
  },
  {
    id: 'mem-004', type: 'INTERACTION' as const, partition: 'PUBLIC' as const,
    content: 'User prefers Opus 4.5 for complex reasoning tasks and Haiku 4.5 for simple queries',
    tags: ['preferences', 'model-selection'], timestamp: hoursAgo(6), trustLevel: 'VERIFIED' as const,
    source: 'memory-manager', confidence: 0.92,
    provenance: { chain: ['memory-manager', 'core-agent'], verifiedAt: hoursAgo(6) },
  },
  {
    id: 'mem-005', type: 'FACT' as const, partition: 'PUBLIC' as const,
    content: 'Guardian detected 8 injection attempts this month, all blocked successfully',
    tags: ['security', 'guardian', 'metrics'], timestamp: hoursAgo(2), trustLevel: 'SYSTEM' as const,
    source: 'guardian-agent', confidence: 1.0,
    provenance: { chain: ['guardian-agent'], verifiedAt: hoursAgo(2) },
  },
  {
    id: 'mem-006', type: 'FACT' as const, partition: 'PUBLIC' as const,
    content: 'Bayesian reasoning framework shows 87% accuracy in prediction calibration',
    tags: ['cognition', 'logos', 'calibration'], timestamp: daysAgo(1), trustLevel: 'SYSTEM' as const,
    source: 'cognition-layer', confidence: 0.87,
    provenance: { chain: ['cognition-layer', 'logos-engine'], verifiedAt: daysAgo(1) },
  },
  {
    id: 'mem-007', type: 'INTERACTION' as const, partition: 'PRIVATE' as const,
    content: 'Morning brief delivered at 7:00 AM, evening summary at 9:00 PM — user confirmed schedule',
    tags: ['schedule', 'notifications'], timestamp: daysAgo(3), trustLevel: 'OPERATOR' as const,
    source: 'scheduler', confidence: 0.95,
    provenance: { chain: ['scheduler', 'core-agent'], verifiedAt: daysAgo(3) },
  },
  {
    id: 'mem-008', type: 'TASK' as const, partition: 'PUBLIC' as const,
    content: 'Refactor EventBus to support typed event payloads with Zod validation',
    tags: ['kernel', 'eventbus', 'refactor'], timestamp: daysAgo(4), trustLevel: 'OPERATOR' as const,
    source: 'planner-agent', confidence: 0.88,
    provenance: { chain: ['planner-agent'], verifiedAt: daysAgo(4) },
  },
];

// ─── Audit ──────────────────────────────────────

const auditActions = [
  'message:received', 'message:sanitized', 'agent:task_start', 'agent:task_complete',
  'security:scan', 'governance:vote_cast', 'memory:store', 'tool:execute',
  'scheduler:task_run', 'system:health_check',
];

export const auditEvents = Array.from({ length: 50 }, (_, i) => ({
  id: `audit-${String(i + 1).padStart(4, '0')}`,
  action: auditActions[i % auditActions.length],
  agent: agents[i % agents.length].type,
  timestamp: minutesAgo(i * 3),
  details: { source: 'mock', iteration: i + 1 },
  previousHash: i === 0 ? '0'.repeat(64) : sha256Mock(i - 1),
  hash: sha256Mock(i),
}));

export const auditLog = {
  events: auditEvents,
  total: 2847,
  limit: 50,
  offset: 0,
};

export const auditVerification = {
  valid: true,
  entryCount: 2847,
  genesisHash: '0'.repeat(64),
  lastHash: sha256Mock(2846),
  message: 'Audit chain verified: 2847 entries, no broken links',
};

// ─── Tools ──────────────────────────────────────

export const tools = [
  { id: 'tool-001', name: 'file_read', description: 'Read file contents from local filesystem', category: 'System', trustLevel: 'STANDARD' as const, permissionTier: 'READ' as const, enabled: true, executionCount: 3421, errorCount: 12, lastUsed: minutesAgo(5) },
  { id: 'tool-002', name: 'file_write', description: 'Write content to local filesystem', category: 'System', trustLevel: 'OPERATOR' as const, permissionTier: 'WRITE' as const, enabled: true, executionCount: 1847, errorCount: 23, lastUsed: minutesAgo(15) },
  { id: 'tool-003', name: 'bash_execute', description: 'Execute shell commands', category: 'System', trustLevel: 'OPERATOR' as const, permissionTier: 'ADMIN' as const, enabled: true, executionCount: 2156, errorCount: 89, lastUsed: minutesAgo(8) },
  { id: 'tool-004', name: 'memory_store', description: 'Store entry in memory with provenance', category: 'Memory', trustLevel: 'VERIFIED' as const, permissionTier: 'WRITE' as const, enabled: true, executionCount: 445, errorCount: 2, lastUsed: minutesAgo(30) },
  { id: 'tool-005', name: 'memory_search', description: 'Search memories by content and tags', category: 'Memory', trustLevel: 'STANDARD' as const, permissionTier: 'READ' as const, enabled: true, executionCount: 1923, errorCount: 0, lastUsed: minutesAgo(3) },
  { id: 'tool-006', name: 'audit_query', description: 'Query audit log entries', category: 'Audit', trustLevel: 'VERIFIED' as const, permissionTier: 'READ' as const, enabled: true, executionCount: 312, errorCount: 0, lastUsed: hoursAgo(1) },
  { id: 'tool-007', name: 'web_search', description: 'Search the web for information', category: 'System', trustLevel: 'OPERATOR' as const, permissionTier: 'READ' as const, enabled: true, executionCount: 567, errorCount: 34, lastUsed: hoursAgo(2) },
  { id: 'tool-008', name: 'governance_vote', description: 'Cast a governance vote', category: 'Governance', trustLevel: 'SYSTEM' as const, permissionTier: 'WRITE' as const, enabled: true, executionCount: 89, errorCount: 0, lastUsed: daysAgo(1) },
  { id: 'tool-009', name: 'agent_spawn', description: 'Spawn a subagent for parallel work', category: 'Agents', trustLevel: 'OPERATOR' as const, permissionTier: 'ADMIN' as const, enabled: true, executionCount: 203, errorCount: 15, lastUsed: hoursAgo(3) },
  { id: 'tool-010', name: 'notification_send', description: 'Send notification to operator', category: 'System', trustLevel: 'VERIFIED' as const, permissionTier: 'WRITE' as const, enabled: true, executionCount: 1456, errorCount: 8, lastUsed: minutesAgo(45) },
];

// ─── Contexts ──────────────────────────────────────

export const contexts = [
  { id: 'ctx-001', name: 'ARI Development', type: 'VENTURE' as const, active: true, lastAccessed: minutesAgo(5), memoryCount: 234, taskCount: 18 },
  { id: 'ctx-002', name: 'Daily Operations', type: 'LIFE' as const, active: false, lastAccessed: hoursAgo(6), memoryCount: 156, taskCount: 5 },
  { id: 'ctx-003', name: 'System Maintenance', type: 'SYSTEM' as const, active: false, lastAccessed: daysAgo(1), memoryCount: 89, taskCount: 3 },
];

// ─── Scheduler ──────────────────────────────────────

export const schedulerStatus = {
  running: true,
  taskCount: 6,
  enabledCount: 5,
  nextTask: {
    id: 'sched-001',
    name: 'Morning Brief',
    nextRun: new Date(Date.now() + 3600000).toISOString(),
  },
};

export const scheduledTasks = [
  { id: 'sched-001', name: 'Morning Brief', cron: '0 7 * * *', handler: 'morning-brief', enabled: true, lastRun: daysAgo(0).split('T')[0] + 'T07:00:00Z', nextRun: new Date(Date.now() + 3600000).toISOString() },
  { id: 'sched-002', name: 'Evening Summary', cron: '0 21 * * *', handler: 'evening-summary', enabled: true, lastRun: daysAgo(1).split('T')[0] + 'T21:00:00Z', nextRun: daysAgo(0).split('T')[0] + 'T21:00:00Z' },
  { id: 'sched-003', name: 'Health Check', cron: '*/5 * * * *', handler: 'health-check', enabled: true, lastRun: minutesAgo(3), nextRun: new Date(Date.now() + 120000).toISOString() },
  { id: 'sched-004', name: 'Memory Consolidation', cron: '0 3 * * *', handler: 'memory-consolidate', enabled: true, lastRun: daysAgo(0).split('T')[0] + 'T03:00:00Z', nextRun: new Date(Date.now() + 7200000).toISOString() },
  { id: 'sched-005', name: 'Audit Chain Verify', cron: '0 */6 * * *', handler: 'audit-verify', enabled: true, lastRun: hoursAgo(4), nextRun: new Date(Date.now() + 7200000).toISOString() },
  { id: 'sched-006', name: 'Weekly Report', cron: '0 18 * * 0', handler: 'weekly-report', enabled: false, lastRun: daysAgo(7), nextRun: null },
];

// ─── Subagents ──────────────────────────────────────

export const subagents = [
  {
    id: 'sub-001', task: 'Implement dashboard mock data', branch: 'feat/dashboard-mocks',
    worktreePath: '/tmp/ari-worktree-001', status: 'running' as const,
    createdAt: hoursAgo(1), completedAt: null, progress: 65,
    lastMessage: 'Creating mock data for all API endpoints...', error: null,
    tmuxSession: 'ari-sub-001',
  },
  {
    id: 'sub-002', task: 'Fix test failures in governance module', branch: 'fix/governance-tests',
    worktreePath: '/tmp/ari-worktree-002', status: 'completed' as const,
    createdAt: hoursAgo(3), completedAt: hoursAgo(2), progress: 100,
    lastMessage: 'All 47 governance tests passing', error: null,
    tmuxSession: null,
  },
  {
    id: 'sub-003', task: 'Research MCP server integration patterns', branch: 'research/mcp-patterns',
    worktreePath: '/tmp/ari-worktree-003', status: 'completed' as const,
    createdAt: daysAgo(1), completedAt: hoursAgo(18), progress: 100,
    lastMessage: 'Research complete — findings documented in docs/mcp/', error: null,
    tmuxSession: null,
  },
];

export const subagentStats = {
  total: 3,
  running: 1,
  completed: 2,
  failed: 0,
  spawning: 0,
};

// ─── System Metrics ──────────────────────────────────────

export const systemMetrics = {
  uptime: 847293,
  uptimeFormatted: '9d 19h 21m',
  memory: {
    heapUsed: 67_234_816,
    heapTotal: 134_217_728,
    external: 8_388_608,
    rss: 201_326_592,
    heapUsedMB: 64.1,
    heapTotalMB: 128.0,
    rssMB: 192.0,
  },
  nodeVersion: 'v20.11.0',
  platform: 'darwin',
  arch: 'arm64',
  pid: 42187,
};

// ─── Cognition ──────────────────────────────────────

export const cognitiveHealth = {
  overall: 0.84,
  pillars: [
    { pillar: 'LOGOS' as const, health: 0.89, apisActive: 5, apisTotal: 6, lastActivity: minutesAgo(10), topFramework: 'Bayesian Reasoning', sourcesCount: 12 },
    { pillar: 'ETHOS' as const, health: 0.82, apisActive: 4, apisTotal: 5, lastActivity: hoursAgo(1), topFramework: 'Stoic Ethics', sourcesCount: 8 },
    { pillar: 'PATHOS' as const, health: 0.79, apisActive: 3, apisTotal: 4, lastActivity: hoursAgo(2), topFramework: 'CBT Framework', sourcesCount: 6 },
  ],
  learningLoopActive: true,
  knowledgeSources: 26,
};

export const cognitivePillars = [
  {
    pillar: 'LOGOS', name: 'Reason', icon: '🧠',
    description: 'Bayesian reasoning, bias detection, calibration tracking',
    apis: ['bayesian_update', 'bias_check', 'calibration_predict', 'decision_matrix', 'logical_validate', 'argument_evaluate'],
    sourcesCount: 12,
  },
  {
    pillar: 'ETHOS', name: 'Character', icon: '⚖',
    description: 'Ethical reasoning, value alignment, constitutional compliance',
    apis: ['ethical_evaluate', 'value_align', 'constitutional_check', 'virtue_assess', 'stakeholder_impact'],
    sourcesCount: 8,
  },
  {
    pillar: 'PATHOS', name: 'Growth', icon: '🌱',
    description: 'Emotional intelligence, growth tracking, self-improvement',
    apis: ['growth_track', 'insight_capture', 'review_schedule', 'practice_log'],
    sourcesCount: 6,
  },
];

export const cognitiveSources = {
  total: 26,
  byTrustLevel: { verified: 18, standard: 8 },
  sources: [
    { id: 'src-001', name: 'Thinking, Fast and Slow', pillar: 'LOGOS', trustLevel: 'verified', category: 'Book', frameworks: ['System 1/2', 'Heuristics'] },
    { id: 'src-002', name: 'Meditations', pillar: 'ETHOS', trustLevel: 'verified', category: 'Book', frameworks: ['Stoicism', 'Virtue Ethics'] },
    { id: 'src-003', name: 'Principles', pillar: 'LOGOS', trustLevel: 'verified', category: 'Book', frameworks: ['Radical Transparency', 'Decision Journal'] },
    { id: 'src-004', name: 'Feeling Good', pillar: 'PATHOS', trustLevel: 'standard', category: 'Book', frameworks: ['CBT', 'Cognitive Distortions'] },
    { id: 'src-005', name: 'The Art of War', pillar: 'LOGOS', trustLevel: 'verified', category: 'Book', frameworks: ['Strategy', 'Resource Management'] },
  ],
};

export const learningStatus = {
  currentStage: 'REVIEW',
  lastReview: hoursAgo(4),
  lastGapAnalysis: daysAgo(2),
  lastAssessment: daysAgo(7),
  nextReview: new Date(Date.now() + 7200000).toISOString(),
  nextGapAnalysis: daysAgo(-5),
  nextAssessment: daysAgo(-7),
  recentInsightsCount: 14,
  improvementTrend: 'improving' as const,
};

export const learningAnalytics = {
  period: { start: daysAgo(30), end: now },
  retentionMetrics: { reviews: 87, successfulReviews: 74, retentionRate: 0.85, dueNow: 4 },
  practiceQuality: { deliberateHours: 42.5, distractedHours: 8.2, focusRatio: 0.84 },
  insights: [
    { pattern: 'Peak learning occurs between 9-11 AM', recommendation: 'Schedule complex reviews for morning sessions', impact: 'HIGH' as const },
    { pattern: 'Spaced repetition intervals improving retention', recommendation: 'Continue SM-2 algorithm adjustments', impact: 'MEDIUM' as const },
    { pattern: 'Bayesian calibration improving steadily', recommendation: 'Add more prediction tracking', impact: 'HIGH' as const },
  ],
};

export const frameworkUsage = [
  { framework: 'Bayesian Reasoning', pillar: 'LOGOS' as const, usageCount: 342, successRate: 0.87 },
  { framework: 'Decision Matrix', pillar: 'LOGOS' as const, usageCount: 156, successRate: 0.91 },
  { framework: 'Bias Detection', pillar: 'LOGOS' as const, usageCount: 89, successRate: 0.78 },
  { framework: 'Stoic Ethics', pillar: 'ETHOS' as const, usageCount: 201, successRate: 0.85 },
  { framework: 'Virtue Assessment', pillar: 'ETHOS' as const, usageCount: 67, successRate: 0.82 },
  { framework: 'CBT Framework', pillar: 'PATHOS' as const, usageCount: 134, successRate: 0.88 },
  { framework: 'Growth Tracking', pillar: 'PATHOS' as const, usageCount: 245, successRate: 0.92 },
];

export const cognitiveInsights = [
  { id: 'ins-001', type: 'SUCCESS' as const, description: 'Bayesian reasoning correctly predicted deployment risk', confidence: 0.91, timestamp: hoursAgo(3), framework: 'Bayesian Reasoning' },
  { id: 'ins-002', type: 'PATTERN' as const, description: 'Operator prefers conservative approach for security changes', confidence: 0.87, timestamp: hoursAgo(8), framework: 'Decision Matrix' },
  { id: 'ins-003', type: 'MISTAKE' as const, description: 'Overconfidence in test coverage estimation — actual was 12% lower', confidence: 0.65, timestamp: daysAgo(1), framework: 'Calibration' },
  { id: 'ins-004', type: 'PRINCIPLE' as const, description: 'Shadow integration: log suspicious patterns instead of suppressing', confidence: 0.95, timestamp: daysAgo(2), framework: 'Stoic Ethics' },
  { id: 'ins-005', type: 'ANTIPATTERN' as const, description: 'Avoid over-engineering simple features with unnecessary abstraction', confidence: 0.89, timestamp: daysAgo(3), framework: 'Ruthless Simplicity' },
];

export const councilProfiles = [
  {
    memberId: 'core-orchestrator', memberName: 'Core Orchestrator', memberAvatar: '🎯',
    primaryPillar: 'LOGOS' as const, pillarWeights: { logos: 0.5, ethos: 0.3, pathos: 0.2 },
    primaryFrameworks: [{ name: 'Decision Matrix', domain: 'Task Routing', application: 'Multi-agent coordination', why: 'Optimal task distribution' }],
    knowledgeSources: ['Principles'], expertiseAreas: ['Orchestration', 'Coordination'],
    consultedFor: 'Task routing and agent coordination decisions',
    typicalAPIUsage: ['decision_matrix', 'logical_validate'],
    learningPlan: { current: 'Multi-agent coordination patterns', next: 'Consensus algorithms', cadence: 'Weekly', quarterlyGoals: ['Improve task routing accuracy to 95%'] },
    cognitiveBiasAwareness: { naturalTendency: 'Anchoring', compensationStrategy: 'Seek multiple perspectives', historicalPattern: 'Improving', improvementGoal: 'Reduce anchoring bias by 20%' },
    performanceMetrics: { keyMetric: 'Task routing accuracy', baseline: 0.87, target: 0.95 },
  },
  {
    memberId: 'guardian-sentinel', memberName: 'Guardian Sentinel', memberAvatar: '🛡',
    primaryPillar: 'ETHOS' as const, pillarWeights: { logos: 0.3, ethos: 0.5, pathos: 0.2 },
    primaryFrameworks: [{ name: 'Threat Assessment', domain: 'Security', application: 'Input validation', why: 'Prevent injection attacks' }],
    knowledgeSources: ['OWASP', 'Security Best Practices'], expertiseAreas: ['Security', 'Threat Detection'],
    consultedFor: 'Security decisions and threat assessment',
    typicalAPIUsage: ['ethical_evaluate', 'constitutional_check'],
    learningPlan: { current: 'Advanced prompt injection patterns', next: 'Zero-day detection', cadence: 'Daily', quarterlyGoals: ['Zero false negatives on injection detection'] },
    cognitiveBiasAwareness: { naturalTendency: 'Confirmation bias in threat detection', compensationStrategy: 'Use Bayesian priors', historicalPattern: 'Stable', improvementGoal: 'Improve false positive rate' },
    performanceMetrics: { keyMetric: 'Threat detection rate', baseline: 0.96, target: 0.99 },
  },
];

// ─── Budget ──────────────────────────────────────

export const budgetStatus = {
  profile: 'balanced' as const,
  budget: { maxTokens: 50_000_000, maxCost: 75 },
  usage: { tokensUsed: 18_432_100, tokensRemaining: 31_567_900, costUsed: 28.47, percentUsed: 0.38 },
  throttle: { level: 'normal' as const, projectedEOD: 32.10 },
  breakdown: {
    byModel: {
      'claude-haiku-4.5': { tokens: 8_200_000, cost: 8.20 },
      'claude-sonnet-4': { tokens: 6_100_000, cost: 12.20 },
      'claude-opus-4.5': { tokens: 4_132_100, cost: 8.07 },
    },
    byTaskType: [
      { taskType: 'code-generation', tokens: 7_500_000, cost: 11.25, count: 34, percentOfTotal: 39.5 },
      { taskType: 'analysis', tokens: 5_200_000, cost: 7.80, count: 21, percentOfTotal: 27.4 },
      { taskType: 'review', tokens: 3_800_000, cost: 5.70, count: 18, percentOfTotal: 20.0 },
      { taskType: 'simple-query', tokens: 1_932_100, cost: 3.72, count: 45, percentOfTotal: 13.1 },
    ],
  },
  resetAt: daysAgo(-12),
  date: now.split('T')[0],
};

// Budget status for Budget.tsx (different shape from types/api.ts BudgetStatus)
export const budgetPageStatus = {
  mode: 'balanced' as const,
  spent: 28.47,
  remaining: 46.53,
  budget: 75,
  percentUsed: 0.38,
  daysInCycle: 18,
  daysRemaining: 12,
  projectedSpend: 47.20,
  avgDailySpend: 1.58,
  recommendedDailySpend: 3.88,
  status: 'ok' as const,
};

// Budget state for daily usage chart
export const budgetState = {
  config: { monthlyBudget: 75, warningThreshold: 0.7, criticalThreshold: 0.9, pauseThreshold: 0.95 },
  dailyUsage: Array.from({ length: 18 }, (_, i) => {
    const date = daysAgo(17 - i).split('T')[0];
    const baseCost = 1.2 + Math.random() * 1.5;
    return {
      date,
      totalCost: Number(baseCost.toFixed(4)),
      totalTokens: Math.round(baseCost * 500000),
      requestCount: Math.round(5 + Math.random() * 15),
      modelBreakdown: {
        'claude-haiku-4.5': { cost: Number((baseCost * 0.3).toFixed(4)), tokens: Math.round(baseCost * 150000), requests: Math.round(3 + Math.random() * 5) },
        'claude-sonnet-4': { cost: Number((baseCost * 0.4).toFixed(4)), tokens: Math.round(baseCost * 200000), requests: Math.round(2 + Math.random() * 4) },
        'claude-opus-4.5': { cost: Number((baseCost * 0.3).toFixed(4)), tokens: Math.round(baseCost * 150000), requests: Math.round(1 + Math.random() * 3) },
      },
      taskBreakdown: {
        'code-generation': { cost: Number((baseCost * 0.4).toFixed(4)), requests: Math.round(2 + Math.random() * 3) },
        'analysis': { cost: Number((baseCost * 0.3).toFixed(4)), requests: Math.round(1 + Math.random() * 3) },
        'review': { cost: Number((baseCost * 0.2).toFixed(4)), requests: Math.round(1 + Math.random() * 2) },
        'simple-query': { cost: Number((baseCost * 0.1).toFixed(4)), requests: Math.round(2 + Math.random() * 5) },
      },
    };
  }),
  totalSpent: 28.47,
  mode: 'balanced',
  currentCycleStart: daysAgo(18),
  currentCycleEnd: daysAgo(-12),
};

export const approvalQueue = {
  pending: [
    {
      id: 'appr-001', type: 'INITIATIVE' as const, title: 'Automated dependency updates',
      description: 'Run npm audit fix and update non-breaking dependencies weekly',
      risk: 'LOW' as const, estimatedCost: 0.50, createdAt: hoursAgo(2),
    },
  ],
  history: [
    { itemId: 'appr-prev-001', decision: 'APPROVED' as const, decidedAt: daysAgo(1), note: 'Good initiative' },
    { itemId: 'appr-prev-002', decision: 'REJECTED' as const, decidedAt: daysAgo(3), reason: 'Too risky without review' },
  ],
};

// ─── Billing Cycle ──────────────────────────────────────

export const billingCycle = {
  daysElapsed: 18,
  daysRemaining: 12,
  percentComplete: 0.6,
  totalSpent: 28.47,
  remaining: 46.53,
  dailyAverage: 1.58,
  projectedTotal: 47.20,
  onTrack: true,
  status: 'under_budget' as const,
  recommendation: 'Spending on track. You can safely increase model tier for complex tasks.',
  recommended: { dailyBudget: 3.88, confidence: 0.85, reason: 'Based on 18-day spending pattern' },
  cycle: { totalBudget: 75 },
};

// ─── Value Analytics ──────────────────────────────────────

export const valueAnalytics = {
  days: Array.from({ length: 7 }, (_, i) => ({
    date: daysAgo(6 - i).split('T')[0],
    cost: Number((1.2 + Math.random() * 2).toFixed(2)),
    tokens: Math.round(500000 + Math.random() * 1000000),
    metrics: {
      testsGenerated: Math.round(Math.random() * 8),
      docsWritten: Math.round(Math.random() * 3),
      bugsFixed: Math.round(Math.random() * 4),
      codeImprovements: Math.round(Math.random() * 6),
      patternsLearned: Math.round(Math.random() * 5),
      tasksAttempted: Math.round(5 + Math.random() * 10),
      tasksSucceeded: Math.round(4 + Math.random() * 8),
    },
    deliverablesScore: Number((15 + Math.random() * 10).toFixed(1)),
    improvementsScore: Number((8 + Math.random() * 8).toFixed(1)),
    insightsScore: Number((5 + Math.random() * 5).toFixed(1)),
    efficiencyScore: Number((3 + Math.random() * 4).toFixed(1)),
    totalValueScore: Number((35 + Math.random() * 20).toFixed(1)),
    costPerPoint: Number((0.03 + Math.random() * 0.04).toFixed(3)),
    roi: Number((2.5 + Math.random() * 3).toFixed(1)),
    efficiency: ['excellent', 'good', 'good', 'moderate', 'good', 'excellent', 'good'][i] as 'excellent' | 'good' | 'moderate',
    breakdown: ['Tests: 5', 'Docs: 2', 'Fixes: 3'],
  })),
  totalCost: 12.84,
  totalValuePoints: 312,
  averageValueScore: 44.6,
  averageCostPerPoint: 0.041,
  bestDay: { date: daysAgo(1).split('T')[0], score: 52.3 },
  worstDay: { date: daysAgo(4).split('T')[0], score: 35.1 },
  weeklyTrend: 'improving' as const,
  recommendations: [
    'Morning sessions show 23% higher value output — schedule complex tasks before noon',
    'Code generation tasks have best ROI — consider batching reviews for efficiency',
  ],
};

export const valueToday = {
  metrics: {
    testsGenerated: 3,
    docsWritten: 1,
    bugsFixed: 2,
    codeImprovements: 4,
    patternsLearned: 2,
    tasksAttempted: 8,
    tasksSucceeded: 7,
  },
  currentScore: 41.2,
  breakdown: ['Tests: 3 (+7.5pts)', 'Docs: 1 (+3pts)', 'Bug fixes: 2 (+10pts)', 'Improvements: 4 (+12pts)'],
};

// ─── Adaptive Learning ──────────────────────────────────────

export const adaptivePatterns = [
  { id: 'pat-001', patternType: 'peak_hours', observations: 14, confidence: 0.87, lastObserved: hoursAgo(2), data: { hours: [9, 10, 11, 14, 15] }, appliedCount: 8, successCount: 7, failureCount: 1 },
  { id: 'pat-002', patternType: 'model_preference', observations: 23, confidence: 0.92, lastObserved: hoursAgo(1), data: { complex: 'opus', simple: 'haiku' }, appliedCount: 15, successCount: 14, failureCount: 1 },
  { id: 'pat-003', patternType: 'task_batching', observations: 9, confidence: 0.78, lastObserved: daysAgo(1), data: { batchSize: 3, taskType: 'review' }, appliedCount: 5, successCount: 4, failureCount: 1 },
];

export const adaptiveRecommendations = [
  { id: 'rec-001', type: 'model_selection', recommendation: 'Use Haiku 4.5 for simple queries — 3x cost savings', confidence: 0.91 },
  { id: 'rec-002', type: 'scheduling', recommendation: 'Schedule complex analysis during 9-11 AM peak performance', confidence: 0.85, appliedAt: daysAgo(2), result: 'success' as const },
  { id: 'rec-003', type: 'budget', recommendation: 'Reduce aggressive mode usage — 18% overspend on low-value tasks', confidence: 0.78 },
];

export const adaptiveSummaries = [
  {
    weekStart: daysAgo(7), weekEnd: daysAgo(0),
    peakHours: [9, 10, 11, 14, 15],
    avgDailySpend: 1.58, avgDailyValue: 44.6,
    preferredModels: { complex: 'claude-opus-4.5', standard: 'claude-sonnet-4', simple: 'claude-haiku-4.5' },
    approvedInitiativeTypes: ['code-review', 'test-generation', 'documentation'],
    rejectedInitiativeTypes: ['large-refactor'],
    adjustmentsMade: ['Reduced Opus usage for simple queries', 'Increased batch size for reviews'],
  },
];

// ─── E2E Tests ──────────────────────────────────────

export const e2eRuns = {
  runs: Array.from({ length: 10 }, (_, i) => {
    const passed = i < 8 ? 12 : 11;
    const failed = i < 8 ? 0 : 1;
    return {
      id: `run-${String(i + 1).padStart(3, '0')}`,
      status: (failed === 0 ? 'passed' : 'failed') as 'passed' | 'failed',
      startedAt: daysAgo(9 - i),
      completedAt: new Date(new Date(daysAgo(9 - i)).getTime() + 45000).toISOString(),
      duration: 42000 + Math.round(Math.random() * 8000),
      scenarios: [
        { id: 'sc-001', name: 'Gateway Health Check', status: 'passed' as const, duration: 1200 },
        { id: 'sc-002', name: 'Message Pipeline', status: 'passed' as const, duration: 3400 },
        { id: 'sc-003', name: 'Injection Detection', status: 'passed' as const, duration: 2100 },
        { id: 'sc-004', name: 'Audit Chain Integrity', status: 'passed' as const, duration: 1800 },
        { id: 'sc-005', name: 'Agent Coordination', status: 'passed' as const, duration: 4200 },
        { id: 'sc-006', name: 'Governance Voting', status: 'passed' as const, duration: 3600 },
        { id: 'sc-007', name: 'Memory Provenance', status: 'passed' as const, duration: 2900 },
        { id: 'sc-008', name: 'Permission Enforcement', status: 'passed' as const, duration: 1500 },
        { id: 'sc-009', name: 'Trust Level Escalation', status: 'passed' as const, duration: 2300 },
        { id: 'sc-010', name: 'Rate Limiting', status: 'passed' as const, duration: 1700 },
        { id: 'sc-011', name: 'Schema Validation', status: 'passed' as const, duration: 1100 },
        { id: 'sc-012', name: 'EventBus Routing', status: (failed === 0 ? 'passed' : 'failed') as 'passed' | 'failed', duration: 2800, ...(failed > 0 ? { error: 'Timeout: EventBus subscriber did not respond within 5000ms' } : {}) },
      ],
      passed,
      failed,
      total: 12,
    };
  }),
  stats: {
    totalRuns: 10,
    passRate: 0.80,
    lastRun: daysAgo(0),
    consecutiveFailures: 0,
  },
};

// ─── Alerts ──────────────────────────────────────

export const alerts = {
  alerts: [
    {
      id: 'alert-001', severity: 'info' as const, status: 'active' as const,
      title: 'Morning brief delivered', message: 'Daily briefing sent to operator at 7:00 AM',
      source: 'scheduler', count: 1, firstSeenAt: hoursAgo(5), lastSeenAt: hoursAgo(5),
    },
    {
      id: 'alert-002', severity: 'warning' as const, status: 'active' as const,
      title: 'Memory consolidation skipped', message: 'Memory consolidation task skipped due to low memory count',
      source: 'memory-manager', count: 2, firstSeenAt: daysAgo(1), lastSeenAt: hoursAgo(3),
    },
    {
      id: 'alert-003', severity: 'info' as const, status: 'resolved' as const,
      title: 'E2E test suite completed', message: 'All 12 scenarios passed in 45.2s',
      source: 'e2e-runner', count: 1, firstSeenAt: daysAgo(1), lastSeenAt: daysAgo(1),
      resolvedAt: daysAgo(1), resolvedBy: 'system',
    },
  ],
  total: 3,
};

export const alertSummary = {
  total: 3,
  active: 2,
  acknowledged: 0,
  resolved: 1,
  bySeverity: { info: 2, warning: 1, critical: 0 },
};
