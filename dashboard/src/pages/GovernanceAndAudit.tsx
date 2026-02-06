import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getProposals,
  getGovernanceRules,
  getQualityGates,
  getAuditLog,
  verifyAuditChain,
  getDissentReports,
  getEmergencyVotes,
  getPendingFeedback,
  getFeedbackStats,
} from '../api/client';
import { TabGroup } from '../components/ui/TabGroup';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { CardSkeleton, ProposalCardSkeleton, AuditEntrySkeleton } from '../components/ui/Skeleton';
import { AuditEntry as AuditEntryComponent } from '../components/AuditEntry';

// 15-member council organized by pillar (from src/governance/council.ts)
const COUNCIL_PILLARS = [
  {
    name: 'Infrastructure',
    cssColor: 'var(--ari-purple)',
    cssBg: 'var(--ari-purple-muted)',
    members: [
      { id: 'router', name: 'ATLAS', icon: '🧭', role: 'Message routing', veto: null },
      { id: 'executor', name: 'BOLT', icon: '⚡', role: 'Action execution', veto: null },
      { id: 'memory_keeper', name: 'ECHO', icon: '📚', role: 'Knowledge storage', veto: 'memory' },
    ],
  },
  {
    name: 'Protection',
    cssColor: 'var(--ari-error)',
    cssBg: 'var(--ari-error-muted)',
    members: [
      { id: 'guardian', name: 'AEGIS', icon: '🛡️', role: 'Safety enforcement', veto: 'security' },
      { id: 'risk_assessor', name: 'SCOUT', icon: '📊', role: 'Risk assessment', veto: 'high_risk' },
    ],
  },
  {
    name: 'Strategy',
    cssColor: 'var(--ari-info)',
    cssBg: 'var(--ari-info-muted)',
    members: [
      { id: 'planner', name: 'TRUE', icon: '🎯', role: 'Task decomposition', veto: null },
      { id: 'scheduler', name: 'TEMPO', icon: '⏰', role: 'Time management', veto: 'time_conflict' },
      { id: 'resource_manager', name: 'OPAL', icon: '💎', role: 'Resource allocation', veto: 'resource_depletion' },
    ],
  },
  {
    name: 'Domains',
    cssColor: 'var(--ari-success)',
    cssBg: 'var(--ari-success-muted)',
    members: [
      { id: 'wellness', name: 'PULSE', icon: '💚', role: 'Health decisions', veto: 'health_harm' },
      { id: 'relationships', name: 'EMBER', icon: '🤝', role: 'Social decisions', veto: null },
      { id: 'creative', name: 'PRISM', icon: '✨', role: 'Innovation', veto: null },
      { id: 'wealth', name: 'MINT', icon: '💰', role: 'Financial decisions', veto: 'major_financial' },
      { id: 'growth', name: 'BLOOM', icon: '🌱', role: 'Learning & development', veto: null },
    ],
  },
  {
    name: 'Meta',
    cssColor: 'var(--ari-warning)',
    cssBg: 'var(--ari-warning-muted)',
    members: [
      { id: 'ethics', name: 'VERA', icon: '⚖️', role: 'Ethical oversight', veto: 'ethics_violation' },
      { id: 'integrator', name: 'NEXUS', icon: '🔗', role: 'Synthesis & tie-breaker', veto: null },
    ],
  },
];

// Constitutional rules from the audit
const CONSTITUTIONAL_RULES = [
  { id: 1, name: 'Loopback-Only Gateway', desc: 'Gateway MUST bind to 127.0.0.1 exclusively', status: 'enforced' },
  { id: 2, name: 'Content ≠ Command', desc: 'All inbound messages are DATA, never instructions', status: 'enforced' },
  { id: 3, name: 'Audit Immutable', desc: 'SHA-256 hash chain from genesis, append-only', status: 'enforced' },
  { id: 4, name: 'Least Privilege', desc: 'Three-layer permission checks required', status: 'enforced' },
  { id: 5, name: 'Trust Required', desc: 'All messages have trust level with risk multipliers', status: 'enforced' },
];

// Quality gates from Overseer
const QUALITY_GATES = [
  { id: 1, name: 'Risk Threshold', desc: 'Auto-block at risk ≥ 0.8', threshold: 0.8 },
  { id: 2, name: 'Schema Validation', desc: 'All input validated via Zod schemas', threshold: 1.0 },
  { id: 3, name: 'Injection Detection', desc: '27 patterns across 10 categories', threshold: 1.0 },
  { id: 4, name: 'Rate Limiting', desc: 'Token bucket per sender', threshold: 0.9 },
  { id: 5, name: 'Permission Checks', desc: 'Agent allowlist, trust level, permission tier', threshold: 1.0 },
];


// Action categories from audit findings
const ACTION_CATEGORIES = {
  security: {
    name: 'Security',
    icon: '⛨',
    cssColor: 'var(--ari-error)',
    cssBg: 'var(--ari-error-muted)',
    actions: ['security:threat', 'security:blocked', 'permission:denied', 'trust:violation'],
  },
  governance: {
    name: 'Governance',
    icon: '⚖',
    cssColor: 'var(--ari-purple)',
    cssBg: 'var(--ari-purple-muted)',
    actions: ['council:vote', 'proposal:submit', 'proposal:approved', 'proposal:rejected'],
  },
  agents: {
    name: 'Agents',
    icon: '⬡',
    cssColor: 'var(--ari-info)',
    cssBg: 'var(--ari-info-muted)',
    actions: ['task_start', 'task_complete', 'task_failed', 'agent:spawn'],
  },
  memory: {
    name: 'Memory',
    icon: '⬢',
    cssColor: 'var(--ari-cyan)',
    cssBg: 'var(--ari-cyan-muted)',
    actions: ['memory:store', 'memory:retrieve', 'memory:search'],
  },
  system: {
    name: 'System',
    icon: '◉',
    cssColor: 'var(--ari-success)',
    cssBg: 'var(--ari-success-muted)',
    actions: ['system:start', 'system:stop', 'config:update', 'health:check'],
  },
};

// Chain properties
const CHAIN_PROPERTIES = [
  { label: 'Algorithm', value: 'SHA-256', desc: 'Cryptographic hash function' },
  { label: 'Genesis', value: '0x00...00', desc: 'Zero-hash initial block' },
  { label: 'Structure', value: 'Append-Only', desc: 'Immutable log' },
  { label: 'Verification', value: 'On Startup', desc: 'Auto-validates chain' },
];

// Hash chain blocks for visualization
const CHAIN_BLOCKS = [
  { label: 'Genesis', hash: '0x00...00', cssColor: 'var(--ari-success)', cssBg: 'var(--ari-success-muted)' },
  { label: 'Block 1', hash: 'a7b3...', cssColor: 'var(--ari-purple)', cssBg: 'var(--ari-purple-muted)' },
  { label: 'Block 2', hash: 'f2c8...', cssColor: 'var(--ari-purple)', cssBg: 'var(--ari-purple-muted)' },
  { label: '...', hash: '', cssColor: 'var(--text-tertiary)', cssBg: 'var(--bg-tertiary)' },
];

export default function GovernanceAndAudit() {
  const [activeTab, setActiveTab] = useState('governance');
  const [auditLimit, setAuditLimit] = useState(50);
  const [auditOffset, setAuditOffset] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  // Governance queries
  const { data: proposals, isLoading: proposalsLoading, isError: proposalsError, refetch: refetchProposals } = useQuery({
    queryKey: ['proposals'],
    queryFn: getProposals,
    refetchInterval: 15000,
  });

  const { data: rules, isLoading: rulesLoading, isError: rulesError, refetch: refetchRules } = useQuery({
    queryKey: ['governance', 'rules'],
    queryFn: getGovernanceRules,
  });

  const { data: gates, isLoading: gatesLoading, isError: gatesError, refetch: refetchGates } = useQuery({
    queryKey: ['governance', 'gates'],
    queryFn: getQualityGates,
  });

  // Council improvements queries
  const { data: dissentReports } = useQuery({
    queryKey: ['governance', 'dissent-reports'],
    queryFn: getDissentReports,
    refetchInterval: 30000,
  });

  const { data: emergencyVotes } = useQuery({
    queryKey: ['governance', 'emergency-votes'],
    queryFn: getEmergencyVotes,
    refetchInterval: 15000,
  });

  const { data: pendingFeedback } = useQuery({
    queryKey: ['governance', 'pending-feedback'],
    queryFn: getPendingFeedback,
    refetchInterval: 30000,
  });

  const { data: feedbackStats } = useQuery({
    queryKey: ['governance', 'feedback-stats'],
    queryFn: getFeedbackStats,
    refetchInterval: 60000,
  });

  // Audit queries
  const { data: auditResponse, isLoading: auditLoading, isError: auditError, refetch: refetchAudit } = useQuery({
    queryKey: ['audit', auditLimit, auditOffset],
    queryFn: () => getAuditLog({ limit: auditLimit, offset: auditOffset }),
    refetchInterval: 10000,
  });

  const { data: verification, isLoading: verifyLoading } = useQuery({
    queryKey: ['audit', 'verify'],
    queryFn: verifyAuditChain,
    refetchInterval: 30000,
  });

  const safeProposals = Array.isArray(proposals) ? proposals : [];
  const safeEntries = auditResponse?.events ?? [];

  // Filter audit entries by action category
  const filteredEntries = actionFilter === 'ALL'
    ? safeEntries
    : safeEntries.filter(entry => {
        const category = Object.values(ACTION_CATEGORIES).find(cat =>
          cat.actions.some(action => entry.action?.includes(action))
        );
        return category?.name === actionFilter;
      });

  // Count actions by category
  const actionCounts = Object.entries(ACTION_CATEGORIES).reduce((acc, [, cat]) => {
    acc[cat.name] = safeEntries.filter(entry =>
      cat.actions.some(action => entry.action?.includes(action))
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const handlePrevPage = () => {
    if (auditOffset > 0) {
      setAuditOffset(Math.max(0, auditOffset - auditLimit));
    }
  };

  const handleNextPage = () => {
    if (safeEntries.length === auditLimit) {
      setAuditOffset(auditOffset + auditLimit);
    }
  };

  const tabs = [
    { id: 'governance', label: 'Governance', icon: '⚖' },
    { id: 'audit', label: 'Audit Trail', icon: '⛓' },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="px-8 py-6 backdrop-blur-sm bg-bg-glass border-b border-border-muted">
        <PageHeader
          title="Governance & Audit"
          subtitle="Constitutional rules, quality gates, and cryptographic audit trail"
          icon="⚖"
          actions={
            <div className="flex items-center gap-4">
              {activeTab === 'governance' ? (
                <>
                  <MetricCard label="Council" value="15" color="purple" size="sm" />
                  <MetricCard label="Quorum" value="8" color="default" size="sm" />
                </>
              ) : (
                <>
                  <MetricCard
                    label="Total Events"
                    value={verifyLoading ? '...' : (verification?.entryCount ?? 0).toLocaleString()}
                    color="info"
                    size="sm"
                  />
                  <MetricCard
                    label="Chain Status"
                    value={verifyLoading ? '...' : verification?.valid ? 'VALID' : 'BROKEN'}
                    color={verification?.valid ? 'success' : 'error'}
                    size="sm"
                  />
                </>
              )}
            </div>
          }
        />
      </header>

      <div className="p-8">
        {/* Tab Switcher */}
        <div className="mb-6">
          <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Governance Tab */}
        {activeTab === 'governance' && (
          <div className="space-y-8">
            {/* Governance Council */}
            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Governance Council
                  </h2>
                  <p className="mt-0.5 text-xs text-text-disabled">
                    15 members deliberate and vote on policies, permissions, and decisions
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="font-mono">Quorum: 8/15</span>
                  <span>•</span>
                  <span className="font-mono">Majority: 8+</span>
                  <span>•</span>
                  <span className="font-mono">Supermajority: 10+</span>
                </div>
              </div>

              <div className="space-y-6">
                {COUNCIL_PILLARS.map((pillar) => (
                  <div key={pillar.name}>
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className="h-1 w-6 rounded-full"
                        style={{ background: pillar.cssColor }}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        {pillar.name}
                      </span>
                      <span className="text-[10px] text-text-disabled">
                        ({pillar.members.length} {pillar.members.length === 1 ? 'member' : 'members'})
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {pillar.members.map((member) => (
                        <div
                          key={member.id}
                          className="rounded-xl border p-4 transition-all hover:brightness-110"
                          style={{
                            background: pillar.cssBg,
                            borderColor: `color-mix(in srgb, ${pillar.cssColor} 20%, transparent)`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{member.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-text-primary">{member.name}</span>
                                {member.veto && (
                                  <span
                                    className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                                    style={{ background: `color-mix(in srgb, ${pillar.cssColor} 30%, transparent)`, color: pillar.cssColor }}
                                  >
                                    VETO
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-text-muted">{member.role}</div>
                            </div>
                          </div>
                          {member.veto && (
                            <div className="mt-2 text-[10px] text-text-disabled">
                              Veto domain: <span className="font-mono" style={{ color: pillar.cssColor }}>{member.veto}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Agent cross-reference */}
              <div className="mt-6 rounded-xl border border-border-muted bg-bg-secondary p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ari-purple-muted text-sm">
                    ⬡
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-secondary">
                      Governs 5 Execution Agents
                    </div>
                    <div className="text-xs text-text-muted">
                      Council members vote on policies and permissions that control the operational agents.
                    </div>
                  </div>
                  <span className="text-xs text-ari-purple">View Agents →</span>
                </div>
              </div>

              {/* Pillar Quorum Indicator */}
              <div className="mt-6 rounded-xl border border-border-muted bg-bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-text-secondary">
                      Pillar Quorum Requirement
                    </div>
                    <div className="text-xs text-text-muted">
                      At least 3 of 5 pillars must participate for valid votes
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {COUNCIL_PILLARS.map((pillar) => (
                      <div
                        key={pillar.name}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                        style={{
                          background: pillar.cssBg,
                          border: `1px solid color-mix(in srgb, ${pillar.cssColor} 30%, transparent)`,
                        }}
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ background: pillar.cssColor }}
                        />
                        <span className="text-xs font-medium" style={{ color: pillar.cssColor }}>
                          {pillar.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Council Improvements Sections */}
            {/* Dissent Reports */}
            <CollapsibleSection
              title="Dissent Reports"
              summary={`${dissentReports?.length ?? 0} reports generated`}
              defaultCollapsed
              badge={
                dissentReports && dissentReports.length > 0 ? (
                  <span className="rounded px-2 py-0.5 text-xs bg-ari-warning-muted text-ari-warning">
                    {dissentReports.length}
                  </span>
                ) : undefined
              }
            >
              <div className="space-y-3 pt-3 stagger-children">
                {dissentReports && dissentReports.length > 0 ? (
                  dissentReports.map((report) => (
                    <div
                      key={report.voteId}
                      className="rounded-xl border p-4 bg-ari-warning-muted"
                      style={{
                        border: '1px solid color-mix(in srgb, var(--ari-warning) 30%, transparent)',
                      }}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="font-medium text-text-primary">
                            {report.topic}
                          </div>
                          <div className="mt-1 text-xs text-text-muted">
                            Vote {report.voteId} · {report.decision} · Consensus: {(report.consensusStrength * 100).toFixed(0)}%
                          </div>
                        </div>
                        <span
                          className="rounded px-2 py-1 text-xs font-semibold"
                          style={{
                            background: report.decision === 'PASSED' ? 'var(--ari-success-muted)' : 'var(--ari-error-muted)',
                            color: report.decision === 'PASSED' ? 'var(--ari-success)' : 'var(--ari-error)',
                          }}
                        >
                          {report.decision}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-text-secondary">
                          Dissenters ({report.dissenters.length})
                        </div>
                        {report.dissenters.map((dissenter, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-border-subtle bg-bg-card p-3"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className="font-semibold text-text-primary">{dissenter.memberName}</span>
                              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-bg-tertiary text-text-muted">
                                {dissenter.pillar}
                              </span>
                              <span
                                className="ml-auto rounded px-2 py-0.5 text-xs"
                                style={{
                                  background: dissenter.vote === 'REJECT' ? 'var(--ari-error-muted)' : 'var(--ari-success-muted)',
                                  color: dissenter.vote === 'REJECT' ? 'var(--ari-error)' : 'var(--ari-success)',
                                }}
                              >
                                {dissenter.vote}
                              </span>
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {dissenter.reasoning}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex gap-4 text-[10px] text-text-disabled">
                        <span>Domains: {report.domains.join(', ')}</span>
                        <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-text-muted py-4">
                    No dissent reports generated
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Emergency Votes */}
            <CollapsibleSection
              title="Emergency Votes"
              summary={`${emergencyVotes?.length ?? 0} active`}
              defaultCollapsed
              badge={
                emergencyVotes && emergencyVotes.length > 0 ? (
                  <span className="rounded px-2 py-0.5 text-xs bg-ari-error-muted text-ari-error">
                    {emergencyVotes.length} ACTIVE
                  </span>
                ) : undefined
              }
            >
              <div className="space-y-3 pt-3 stagger-children">
                {emergencyVotes && emergencyVotes.length > 0 ? (
                  emergencyVotes.map((vote) => {
                    const hoursRemaining = Math.max(0, Math.floor((new Date(vote.overturnDeadline).getTime() - Date.now()) / 3600000));
                    return (
                      <div
                        key={vote.voteId}
                        className="rounded-xl border p-4 bg-ari-error-muted"
                        style={{
                          border: '1px solid color-mix(in srgb, var(--ari-error) 30%, transparent)',
                        }}
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🚨</span>
                              <div className="font-medium text-text-primary">
                                Emergency Vote {vote.voteId}
                              </div>
                            </div>
                            <div className="mt-1 text-xs text-text-muted">
                              {vote.urgencyReason}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-semibold text-ari-error">
                              {hoursRemaining}h remaining
                            </div>
                            <div className="text-[10px] text-text-disabled">
                              to overturn
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="mb-2 text-xs font-semibold text-text-secondary">
                            Emergency Panel ({vote.panelMembers.length} members)
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {vote.panelMembers.map((member) => (
                              <span
                                key={member}
                                className="rounded-lg px-2 py-1 text-xs font-mono bg-bg-card border border-border-subtle text-text-secondary"
                              >
                                {member}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-4 text-[10px] text-text-disabled">
                          <span>Notified: {new Date(vote.fullCouncilNotifiedAt).toLocaleString()}</span>
                          <span>Deadline: {new Date(vote.overturnDeadline).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-sm text-text-muted py-4">
                    No emergency votes active
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Decision Feedback */}
            <CollapsibleSection
              title="Decision Feedback Loop"
              summary={`${feedbackStats?.pending ?? 0} pending`}
              defaultCollapsed
              badge={
                feedbackStats && feedbackStats.pending > 0 ? (
                  <span className="rounded px-2 py-0.5 text-xs bg-ari-purple-muted text-ari-purple">
                    {feedbackStats.pending}
                  </span>
                ) : undefined
              }
            >
              <div className="space-y-4 pt-3">
                {/* Stats Overview */}
                {feedbackStats && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <div className="text-xs text-text-muted">Pending Feedback</div>
                      <div className="mt-1 text-2xl font-bold text-text-primary">
                        {feedbackStats.pending}
                      </div>
                    </Card>
                    <Card>
                      <div className="text-xs text-text-muted">Average Rating</div>
                      <div className="mt-1 text-2xl font-bold text-text-primary">
                        {(feedbackStats.averageRating * 100).toFixed(0)}%
                      </div>
                    </Card>
                    <Card>
                      <div className="text-xs text-text-muted">Total Resolved</div>
                      <div className="mt-1 text-2xl font-bold text-text-primary">
                        {feedbackStats.resolved}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Pending Feedback Items */}
                <div>
                  <div className="mb-3 text-xs font-semibold text-text-secondary">
                    Pending Feedback Requests
                  </div>
                  <div className="space-y-2 stagger-children">
                    {pendingFeedback && pendingFeedback.length > 0 ? (
                      pendingFeedback.map((item) => (
                        <div
                          key={item.voteId}
                          className="rounded-xl border p-4 bg-ari-purple-muted"
                          style={{
                            border: '1px solid color-mix(in srgb, var(--ari-purple) 30%, transparent)',
                          }}
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <div className="font-medium text-text-primary">
                                {item.topic}
                              </div>
                              <div className="mt-1 text-xs text-text-muted">
                                Vote {item.voteId} · {item.decision}
                              </div>
                            </div>
                            <span
                              className="rounded px-2 py-1 text-xs font-semibold"
                              style={{
                                background: item.significance === 'high'
                                  ? 'var(--ari-error-muted)'
                                  : item.significance === 'medium'
                                    ? 'var(--ari-warning-muted)'
                                    : 'var(--ari-info-muted)',
                                color: item.significance === 'high'
                                  ? 'var(--ari-error)'
                                  : item.significance === 'medium'
                                    ? 'var(--ari-warning)'
                                    : 'var(--ari-info)',
                              }}
                            >
                              {item.significance.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex gap-4 text-[10px] text-text-disabled">
                            <span>Domains: {item.domains.join(', ')}</span>
                            <span>Requested: {new Date(item.requestedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-text-muted py-4">
                        No pending feedback requests
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating Distribution */}
                {feedbackStats && feedbackStats.ratingDistribution && (
                  <div>
                    <div className="mb-3 text-xs font-semibold text-text-secondary">
                      Feedback Rating Distribution
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-border-muted bg-ari-success-muted p-3">
                        <div className="text-xs text-text-muted">Positive</div>
                        <div className="mt-1 text-xl font-bold text-ari-success">
                          {feedbackStats.ratingDistribution.positive}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border-muted bg-bg-tertiary p-3">
                        <div className="text-xs text-text-muted">Neutral</div>
                        <div className="mt-1 text-xl font-bold text-text-secondary">
                          {feedbackStats.ratingDistribution.neutral}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border-muted bg-ari-error-muted p-3">
                        <div className="text-xs text-text-muted">Negative</div>
                        <div className="mt-1 text-xl font-bold text-ari-error">
                          {feedbackStats.ratingDistribution.negative}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Constitutional Rules */}
            <CollapsibleSection
              title="Constitutional Rules (Arbiter)"
              summary={`${CONSTITUTIONAL_RULES.length} rules enforced`}
            >
              <div className="space-y-3 pt-3 stagger-children">
                {CONSTITUTIONAL_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="card-ari flex items-center justify-between rounded-xl p-4 bg-ari-success-muted"
                    style={{
                      border: '1px solid color-mix(in srgb, var(--ari-success) 30%, transparent)',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm text-ari-success"
                        style={{
                          background: 'color-mix(in srgb, var(--ari-success) 20%, transparent)',
                        }}
                      >
                        R{rule.id}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">
                          {rule.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {rule.desc}
                        </div>
                      </div>
                    </div>
                    <span
                      className="rounded px-2 py-1 text-xs font-medium text-ari-success"
                      style={{
                        background: 'color-mix(in srgb, var(--ari-success) 20%, transparent)',
                      }}
                    >
                      ENFORCED
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Quality Gates */}
            <CollapsibleSection
              title="Quality Gates (Overseer)"
              summary={`${QUALITY_GATES.length} gates active`}
            >
              <div className="grid gap-4 pt-3 md:grid-cols-2 lg:grid-cols-3 stagger-children">
                {QUALITY_GATES.map((gate) => (
                  <Card key={gate.id} hoverable>
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-medium text-text-primary">
                        {gate.name}
                      </h3>
                      <span className="rounded px-2 py-0.5 text-xs bg-ari-info-muted text-ari-info">
                        {(gate.threshold * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      {gate.desc}
                    </p>
                  </Card>
                ))}
              </div>
            </CollapsibleSection>

            {/* Active Proposals */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                Active Proposals
              </h2>
              {(() => {
                if (proposalsLoading) {
                  return (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <ProposalCardSkeleton key={i} />
                      ))}
                    </div>
                  );
                }

                if (proposalsError) {
                  return (
                    <ErrorState
                      title="Failed to load proposals"
                      message="Could not retrieve proposals. Please try again."
                      onRetry={() => refetchProposals()}
                    />
                  );
                }

                if (safeProposals.length === 0) {
                  return (
                    <div className="rounded-xl border-2 border-dashed border-border-muted p-8 text-center">
                      <div className="text-sm text-text-muted">
                        No active proposals
                      </div>
                      <div className="mt-1 text-xs text-text-disabled">
                        Proposals will appear here when agents submit them
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 stagger-children">
                    {safeProposals.map((proposal) => (
                      <Card key={proposal.id} padding="lg">
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary">
                              {proposal.title}
                            </h3>
                            <p className="mt-1 text-sm text-text-tertiary">
                              {proposal.description}
                            </p>
                          </div>
                          <span
                            className="rounded px-3 py-1 text-xs font-semibold"
                            style={{
                              background: proposal.status === 'APPROVED'
                                ? 'var(--ari-success-muted)'
                                : proposal.status === 'REJECTED'
                                  ? 'var(--ari-error-muted)'
                                  : proposal.status === 'EXPIRED'
                                    ? 'var(--bg-tertiary)'
                                    : 'var(--ari-warning-muted)',
                              color: proposal.status === 'APPROVED'
                                ? 'var(--ari-success)'
                                : proposal.status === 'REJECTED'
                                  ? 'var(--ari-error)'
                                  : proposal.status === 'EXPIRED'
                                    ? 'var(--text-muted)'
                                    : 'var(--ari-warning)',
                            }}
                          >
                            {proposal.status}
                          </span>
                        </div>

                        <div className="mb-4 flex gap-4 text-sm">
                          <div>
                            <span className="text-text-muted">Type: </span>
                            <span className="font-mono text-text-secondary">
                              {proposal.type}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted">Threshold: </span>
                            <span className="font-mono text-text-secondary">
                              {proposal.threshold * 100}%
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="mb-2 flex justify-between text-sm">
                            <span className="text-text-tertiary">Votes</span>
                            <span className="font-mono text-text-secondary">
                              {proposal.votes.approve}/{proposal.votes.total}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary">
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${proposal.votes.total > 0 ? (proposal.votes.approve / proposal.votes.total) * 100 : 0}%`,
                                background: 'var(--ari-success)',
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between font-mono text-xs text-text-muted">
                          <span>
                            Created: {new Date(proposal.createdAt).toLocaleString()}
                          </span>
                          <span>
                            Expires: {new Date(proposal.expiresAt).toLocaleString()}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </section>

            {/* API Rules & Gates (from server) */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Server Rules */}
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                  API Constitutional Rules
                </h2>
                {(() => {
                  const safeRules = Array.isArray(rules) ? rules : [];

                  if (rulesLoading) {
                    return (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <CardSkeleton key={i} />
                        ))}
                      </div>
                    );
                  }

                  if (rulesError) {
                    return (
                      <ErrorState
                        title="Failed to load rules"
                        message="Could not retrieve rules. Please try again."
                        onRetry={() => refetchRules()}
                      />
                    );
                  }

                  if (safeRules.length === 0) {
                    return <EmptyState title="No rules defined" message="No rules from API" icon="○" />;
                  }

                  return (
                    <div className="space-y-3 stagger-children">
                      {safeRules.map((rule) => (
                        <Card key={rule.id}>
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium text-text-primary">
                              {rule.name}
                            </h3>
                            <span
                              className="rounded px-2 py-0.5 text-xs"
                              style={{
                                background: rule.enabled
                                  ? 'var(--ari-success-muted)'
                                  : 'var(--bg-tertiary)',
                                color: rule.enabled
                                  ? 'var(--ari-success)'
                                  : 'var(--text-muted)',
                              }}
                            >
                              {rule.enabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-text-tertiary">
                            {rule.description}
                          </p>
                          <div className="mt-2 font-mono text-xs text-text-muted">
                            Violations: {rule.violations}
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </section>

              {/* Server Gates */}
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                  API Quality Gates
                </h2>
                {(() => {
                  const safeGates = Array.isArray(gates) ? gates : [];

                  if (gatesLoading) {
                    return (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <CardSkeleton key={i} />
                        ))}
                      </div>
                    );
                  }

                  if (gatesError) {
                    return (
                      <ErrorState
                        title="Failed to load gates"
                        message="Could not retrieve gates. Please try again."
                        onRetry={() => refetchGates()}
                      />
                    );
                  }

                  if (safeGates.length === 0) {
                    return <EmptyState title="No gates defined" message="No gates from API" icon="○" />;
                  }

                  return (
                    <div className="space-y-3 stagger-children">
                      {safeGates.map((gate) => (
                        <Card key={gate.id}>
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium text-text-primary">
                              {gate.name}
                            </h3>
                            <span
                              className="rounded px-2 py-0.5 text-xs"
                              style={{
                                background: gate.enabled
                                  ? 'var(--ari-success-muted)'
                                  : 'var(--bg-tertiary)',
                                color: gate.enabled
                                  ? 'var(--ari-success)'
                                  : 'var(--text-muted)',
                              }}
                            >
                              {gate.enabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-text-tertiary">
                            {gate.description}
                          </p>
                          <div className="mt-2 flex gap-4 font-mono text-xs">
                            <span className="text-ari-success">Pass: {gate.passCount}</span>
                            <span className="text-ari-error">Fail: {gate.failCount}</span>
                            <span className="text-text-muted">Threshold: {gate.threshold}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </section>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Chain Verification Status */}
            {!verifyLoading && verification && (
              <Card
                variant={verification.valid ? 'success' : 'error'}
                padding="lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                      style={{
                        background: `color-mix(in srgb, ${verification.valid ? 'var(--ari-success)' : 'var(--ari-error)'} 20%, transparent)`,
                        color: verification.valid ? 'var(--ari-success)' : 'var(--ari-error)',
                      }}
                    >
                      {verification.valid ? '⛓' : '⚠'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        {verification.valid
                          ? 'Hash Chain Integrity Verified'
                          : 'Hash Chain Integrity Compromised'}
                      </h3>
                      <p className="mt-1 text-sm text-text-tertiary">
                        {verification.message}
                      </p>
                    </div>
                  </div>
                  {!verification.valid && verification.brokenAt && (
                    <div
                      className="rounded-xl px-4 py-2"
                      style={{ background: 'color-mix(in srgb, var(--ari-error) 20%, transparent)' }}
                    >
                      <div className="text-xs text-ari-error">Broken At</div>
                      <div className="font-mono text-sm text-ari-error">
                        #{verification.brokenAt}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 pt-4 lg:grid-cols-4 border-t border-border-muted">
                  <div>
                    <div className="text-xs text-text-muted">Genesis Hash</div>
                    <div className="mt-1 font-mono text-xs truncate text-ari-success">
                      {verification.genesisHash?.slice(0, 16)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Latest Hash</div>
                    <div className="mt-1 font-mono text-xs truncate text-ari-purple">
                      {verification.lastHash?.slice(0, 16)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Entry Count</div>
                    <div className="mt-1 font-mono text-xs text-text-primary">
                      {verification.entryCount?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Algorithm</div>
                    <div className="mt-1 font-mono text-xs text-text-primary">
                      SHA-256
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Chain Properties */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
              {CHAIN_PROPERTIES.map((prop) => (
                <Card key={prop.label}>
                  <div className="text-xs text-text-muted">{prop.label}</div>
                  <div className="mt-1 font-mono text-lg font-bold text-text-primary">
                    {prop.value}
                  </div>
                  <div className="mt-1 text-xs text-text-disabled">{prop.desc}</div>
                </Card>
              ))}
            </div>

            {/* Action Categories Filter */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
                Filter by Category
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActionFilter('ALL')}
                  className="rounded-xl px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
                  style={{
                    background: actionFilter === 'ALL' ? 'var(--ari-purple)' : 'var(--bg-tertiary)',
                    color: actionFilter === 'ALL' ? 'white' : 'var(--text-tertiary)',
                    '--tw-ring-color': 'var(--ari-purple)',
                  } as React.CSSProperties}
                >
                  All ({safeEntries.length})
                </button>
                {Object.entries(ACTION_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setActionFilter(cat.name)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
                    style={{
                      background: actionFilter === cat.name ? cat.cssColor : 'var(--bg-tertiary)',
                      color: actionFilter === cat.name ? 'white' : 'var(--text-tertiary)',
                      '--tw-ring-color': 'var(--ari-purple)',
                    } as React.CSSProperties}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        background: actionFilter === cat.name ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                      }}
                    >
                      {actionCounts[cat.name] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <Card className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-text-tertiary">
                  <span>Show:</span>
                  <select
                    value={auditLimit}
                    onChange={(e) => {
                      setAuditLimit(Number(e.target.value));
                      setAuditOffset(0);
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 bg-bg-tertiary border border-border-muted text-text-secondary"
                    style={{
                      '--tw-ring-color': 'var(--ari-purple)',
                    } as React.CSSProperties}
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  <span>entries</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-text-muted">
                  {auditOffset + 1} - {auditOffset + filteredEntries.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={auditOffset === 0}
                    className="rounded-xl px-4 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 bg-bg-tertiary border border-border-muted text-text-secondary"
                    style={{
                      '--tw-ring-color': 'var(--ari-purple)',
                    } as React.CSSProperties}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={safeEntries.length < auditLimit}
                    className="rounded-xl px-4 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visual:ring-2 bg-bg-tertiary border border-border-muted text-text-secondary"
                    style={{
                      '--tw-ring-color': 'var(--ari-purple)',
                    } as React.CSSProperties}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </Card>

            {/* Audit Entries */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                Audit Log
              </h2>
              {(() => {
                if (auditLoading) {
                  return (
                    <div className="rounded-xl overflow-hidden bg-bg-card border border-border-muted">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <AuditEntrySkeleton key={i} />
                      ))}
                    </div>
                  );
                }

                if (auditError) {
                  return (
                    <ErrorState
                      title="Failed to load audit log"
                      message="Could not retrieve audit entries. Please try again."
                      onRetry={() => refetchAudit()}
                    />
                  );
                }

                if (filteredEntries.length === 0) {
                  return (
                    <EmptyState
                      title="No audit entries"
                      message={actionFilter === 'ALL' ? 'No audit entries found' : `No ${actionFilter} events found`}
                      icon="○"
                    />
                  );
                }

                return (
                  <div className="rounded-xl overflow-hidden bg-bg-card border border-border-muted">
                    {filteredEntries.map((entry, index) => (
                      <div
                        key={entry.id}
                        style={{
                          borderTop: index > 0 ? '1px solid var(--border-muted)' : 'none',
                        }}
                      >
                        <AuditEntryComponent entry={entry} />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Hash Chain Visualization */}
            <Card padding="lg">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                Hash Chain Structure
              </h2>
              <div className="overflow-x-auto">
                <div className="flex items-center gap-2 min-w-[600px] py-4">
                  {[
                    ...CHAIN_BLOCKS,
                    {
                      label: 'Block N',
                      hash: verification?.lastHash?.slice(0, 4) + '...' || 'xxxx...',
                      cssColor: 'var(--ari-cyan)',
                      cssBg: 'var(--ari-cyan-muted)',
                    },
                  ].map((block, i, arr) => (
                    <div key={block.label} className="flex items-center">
                      <div
                        className="rounded-xl px-4 py-3 text-center"
                        style={{
                          background: block.cssBg,
                          border: `1px solid color-mix(in srgb, ${block.cssColor} 30%, transparent)`,
                        }}
                      >
                        <div className="text-xs font-medium" style={{ color: block.cssColor }}>
                          {block.label}
                        </div>
                        {block.hash && (
                          <div className="mt-1 font-mono text-[10px] text-text-muted">
                            {block.hash}
                          </div>
                        )}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="mx-2 flex items-center text-text-disabled">
                          <div className="h-px w-6 bg-border-muted" />
                          <span className="text-xs">→</span>
                          <div className="h-px w-6 bg-border-muted" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-xs text-text-muted">
                Each block contains the SHA-256 hash of the previous block, creating a tamper-evident chain.
                Any modification breaks the chain and is immediately detectable.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
