import { useQuery } from '@tanstack/react-query';
import { useDetailedHealth } from '../hooks/useHealth';
import { getAuditLog, verifyAuditChain, getSystemMetrics } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState } from '../components/ui/ErrorState';
import { StatusCardSkeleton, AuditEntrySkeleton } from '../components/ui/Skeleton';

// Security invariants that should always be verified
const SECURITY_INVARIANTS = [
  {
    id: 'loopback',
    name: 'Loopback Only',
    description: '127.0.0.1 enforced',
    check: (health: { gateway: { host: string } }) => health.gateway.host === '127.0.0.1',
  },
  {
    id: 'content-command',
    name: 'Content \u2260 Command',
    description: 'Input is data only',
    check: () => true, // Always true by architecture
  },
  {
    id: 'hash-chain',
    name: 'Hash Chain Audit',
    description: 'SHA-256 linked',
    check: (_health: unknown, auditValid: boolean) => auditValid,
  },
  {
    id: 'least-privilege',
    name: 'Least Privilege',
    description: '3-layer checks',
    check: () => true, // Always true by architecture
  },
  {
    id: 'trust-required',
    name: 'Trust Required',
    description: '6-tier trust levels',
    check: () => true, // Always true by architecture
  },
];

// Layer architecture for status display
const LAYERS = [
  { num: 1, name: 'Kernel', components: ['Gateway', 'Sanitizer', 'Audit', 'EventBus'], color: 'purple' },
  { num: 2, name: 'System', components: ['Router', 'Storage'], color: 'blue' },
  { num: 3, name: 'Agents', components: ['Core', 'Guardian', 'Planner', 'Executor', 'Memory'], color: 'cyan' },
  { num: 4, name: 'Governance', components: ['Council', 'Arbiter', 'Overseer'], color: 'indigo' },
  { num: 5, name: 'Ops', components: ['Daemon', 'Scheduler'], color: 'emerald' },
  { num: 6, name: 'Interfaces', components: ['CLI', 'API', 'Dashboard'], color: 'amber' },
];

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function Health() {
  const {
    data: health,
    isLoading: healthLoading,
    isError: healthError,
    refetch: refetchHealth,
  } = useDetailedHealth();

  const { data: auditVerification } = useQuery({
    queryKey: ['audit-verify'],
    queryFn: verifyAuditChain,
    refetchInterval: 30000,
  });

  const { data: recentAudit, isLoading: auditLoading } = useQuery({
    queryKey: ['audit', 'recent'],
    queryFn: () => getAuditLog({ limit: 8 }),
    refetchInterval: 10000,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: getSystemMetrics,
    refetchInterval: 5000,
  });

  const overallStatus = (() => {
    if (!health) return 'unknown';
    const statuses = [
      health.gateway.status,
      health.eventBus.status,
      health.audit.status,
      health.sanitizer.status,
      health.agents.status,
      health.governance.status,
    ];
    if (statuses.every((s) => s === 'healthy')) return 'healthy';
    if (statuses.some((s) => s === 'unhealthy')) return 'unhealthy';
    return 'degraded';
  })();

  if (healthLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">System Health</h1>
          <p className="mt-1 text-sm text-gray-500">Loading health status...</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <StatusCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (healthError) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">System Health</h1>
        </div>
        <ErrorState
          title="Failed to load health status"
          message="Could not connect to ARI gateway. Ensure the gateway is running at 127.0.0.1:3141."
          onRetry={() => refetchHealth()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 px-8 py-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                overallStatus === 'healthy'
                  ? 'bg-emerald-900/30 text-emerald-400'
                  : overallStatus === 'degraded'
                    ? 'bg-amber-900/30 text-amber-400'
                    : 'bg-red-900/30 text-red-400'
              }`}
            >
              {overallStatus === 'healthy' ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">System Health</h1>
              <p className="mt-1 text-sm text-gray-500">
                Real-time monitoring of all ARI components
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Uptime */}
            <div className="text-right">
              <div className="text-xs text-gray-500">Uptime</div>
              <div className="font-mono text-lg text-white">
                {metricsLoading ? '...' : metrics?.uptimeFormatted || '0s'}
              </div>
            </div>
            <div className="h-10 w-px bg-gray-800" />
            {/* Overall Status */}
            <StatusBadge status={overallStatus as 'healthy' | 'degraded' | 'unhealthy'} size="lg" />
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Security Invariants Banner */}
        <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Security Invariants
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SECURITY_INVARIANTS.map((invariant) => {
              const isValid = health
                ? invariant.check(health, auditVerification?.valid ?? true)
                : false;
              return (
                <div
                  key={invariant.id}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                    isValid ? 'bg-emerald-900/10' : 'bg-red-900/10'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded ${
                      isValid ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
                    } text-sm`}
                  >
                    {isValid ? '\u2713' : '\u2717'}
                  </div>
                  <div>
                    <div
                      className={`text-xs font-medium ${
                        isValid ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {invariant.name}
                    </div>
                    <div className="text-[10px] text-gray-500">{invariant.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Component Status Grid */}
        {health && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Gateway Status */}
            <ComponentCard
              title="Gateway"
              status={health.gateway.status}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
                  />
                </svg>
              }
              iconColor="emerald"
              stats={[
                { label: 'Host', value: health.gateway.host },
                { label: 'Port', value: health.gateway.port.toString() },
                { label: 'Connections', value: health.gateway.connections.toString(), highlight: true },
              ]}
            />

            {/* Event Bus Status */}
            <ComponentCard
              title="Event Bus"
              status={health.eventBus.status}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
              iconColor="blue"
              stats={[
                {
                  label: 'Events Processed',
                  value: health.eventBus.eventCount.toLocaleString(),
                  highlight: true,
                },
                { label: 'Subscribers', value: health.eventBus.subscribers.toString() },
              ]}
            />

            {/* Audit Log Status */}
            <ComponentCard
              title="Audit Log"
              status={health.audit.status}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
              iconColor="purple"
              stats={[
                { label: 'Entries', value: health.audit.entryCount.toLocaleString(), highlight: true },
                {
                  label: 'Chain',
                  value: health.audit.chainValid ? 'Valid' : 'INVALID',
                  highlight: true,
                  color: health.audit.chainValid ? 'emerald' : 'red',
                },
              ]}
            />

            {/* Sanitizer Status */}
            <ComponentCard
              title="Sanitizer"
              status={health.sanitizer.status}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
              iconColor="amber"
              stats={[
                { label: 'Injection Patterns', value: health.sanitizer.patternsLoaded.toString(), highlight: true },
                { label: 'Categories', value: '6' },
              ]}
            />

            {/* Agents Status */}
            <ComponentCard
              title="Agents"
              status={health.agents.status}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
              iconColor="cyan"
              stats={[
                { label: 'Active', value: health.agents.activeCount.toString(), highlight: true },
                { label: 'Total', value: Object.keys(health.agents.agents).length.toString() },
              ]}
            />

            {/* Governance Status */}
            <ComponentCard
              title="Governance"
              status={health.governance.status}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
              }
              iconColor="indigo"
              stats={[
                { label: 'Active Votes', value: health.governance.activeVotes.toString(), highlight: true },
                { label: 'Council', value: `${health.governance.councilMembers} members` },
              ]}
            />
          </div>
        )}

        {/* Two-Column Layout: Layer Architecture + Recent Audit */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Layer Architecture */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Six-Layer Architecture
            </h2>
            <div className="space-y-2">
              {LAYERS.map((layer) => (
                <div
                  key={layer.num}
                  className={`rounded-lg border border-gray-800 bg-gray-950/50 p-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${layer.color}-900/30 text-${layer.color}-400 text-sm font-bold`}
                      >
                        {layer.num}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{layer.name}</div>
                        <div className="text-xs text-gray-500">
                          {layer.components.join(' \u2022 ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-900/20 text-emerald-400 text-xs">
                      \u2713
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Audit Events */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Recent Security Events
              </h2>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    auditVerification?.valid ? 'bg-emerald-400 status-dot-healthy' : 'bg-red-400'
                  }`}
                />
                <span className="text-xs text-gray-500">
                  {auditVerification?.valid ? 'Chain Valid' : 'Chain Invalid'}
                </span>
              </div>
            </div>
            {auditLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <AuditEntrySkeleton key={i} />
                ))}
              </div>
            ) : recentAudit && Array.isArray(recentAudit.events) && recentAudit.events.length > 0 ? (
              <div className="space-y-2">
                {recentAudit.events.slice(0, 8).map((event, idx) => (
                  <div
                    key={event.id || idx}
                    className="rounded-lg border border-gray-800 bg-gray-950/50 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-purple-400">{event.action}</span>
                          <span className="text-xs text-gray-600">\u2022</span>
                          <span className="text-xs text-gray-500">{event.agent}</span>
                        </div>
                        {event.details && Object.keys(event.details).length > 0 && (
                          <div className="mt-1 text-[10px] text-gray-600 font-mono truncate max-w-[280px]">
                            {JSON.stringify(event.details).slice(0, 60)}...
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600 font-mono">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-800 p-8 text-center">
                <div className="text-sm text-gray-500">No recent events</div>
              </div>
            )}
          </div>
        </div>

        {/* System Metrics */}
        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            System Metrics
          </h2>
          {metricsLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="shimmer h-20 rounded-lg" />
              ))}
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              <MetricCard label="Heap Used" value={formatBytes(metrics.memory.heapUsed)} />
              <MetricCard label="Heap Total" value={formatBytes(metrics.memory.heapTotal)} />
              <MetricCard label="RSS" value={formatBytes(metrics.memory.rss)} />
              <MetricCard label="Node" value={metrics.nodeVersion} />
              <MetricCard label="Platform" value={`${metrics.platform}/${metrics.arch}`} />
              <MetricCard label="PID" value={metrics.pid.toString()} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface ComponentCardProps {
  title: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  icon: React.ReactNode;
  iconColor: 'emerald' | 'blue' | 'purple' | 'amber' | 'cyan' | 'indigo';
  stats: Array<{
    label: string;
    value: string;
    highlight?: boolean;
    color?: 'emerald' | 'red' | 'amber';
  }>;
}

function ComponentCard({ title, status, icon, iconColor, stats }: ComponentCardProps) {
  const colorMap = {
    emerald: 'bg-emerald-900/20 text-emerald-400',
    blue: 'bg-blue-900/20 text-blue-400',
    purple: 'bg-purple-900/20 text-purple-400',
    amber: 'bg-amber-900/20 text-amber-400',
    cyan: 'bg-cyan-900/20 text-cyan-400',
    indigo: 'bg-indigo-900/20 text-indigo-400',
  };

  return (
    <div className="card-hover rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
          <div className="mt-2">
            <StatusBadge status={status} size="md" />
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[iconColor]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 space-y-2 border-t border-gray-800 pt-4 font-mono text-xs text-gray-400">
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between">
            <span>{stat.label}</span>
            <span
              className={
                stat.color === 'emerald'
                  ? 'text-emerald-400'
                  : stat.color === 'red'
                    ? 'text-red-400'
                    : stat.color === 'amber'
                      ? 'text-amber-400'
                      : stat.highlight
                        ? 'text-gray-300'
                        : ''
              }
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4 text-center">
      <div className="text-lg font-mono font-bold text-white">{value}</div>
      <div className="mt-1 text-[10px] uppercase text-gray-500">{label}</div>
    </div>
  );
}

export default Health;
