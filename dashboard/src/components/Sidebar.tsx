import { useHealth, useDetailedHealth } from '../hooks/useHealth';
import { useAlertSummary } from '../hooks/useAlerts';
import { NotificationBell } from './alerts/NotificationBell';
import { HealthScoreGauge } from './charts/HealthScoreGauge';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  wsStatus?: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

const pages = [
  { id: 'home', label: 'Overview', icon: '◉', description: 'Dashboard' },
  { id: 'health', label: 'Health', icon: '♥', description: 'System status' },
  { id: 'autonomy', label: 'Autonomy', icon: '↻', description: 'Scheduler' },
  { id: 'agents', label: 'Agents', icon: '⬡', description: 'Active agents' },
  { id: 'governance', label: 'Governance', icon: '⚖', description: 'Council' },
  { id: 'memory', label: 'Memory', icon: '⬢', description: 'Knowledge' },
  { id: 'tools', label: 'Tools', icon: '⚙', description: 'Registry' },
  { id: 'audit', label: 'Audit Trail', icon: '⊞', description: 'Hash chain' },
];

export function Sidebar({ currentPage, onNavigate, wsStatus = 'disconnected' }: SidebarProps) {
  const { data: health } = useHealth();
  const { data: detailedHealth } = useDetailedHealth();
  const { data: alertSummary } = useAlertSummary();

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-500';
    if (status === 'healthy' || status === 'ok') return 'bg-emerald-500';
    if (status === 'degraded' || status === 'warning') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusGlow = (status?: string) => {
    if (!status) return '';
    if (status === 'healthy' || status === 'ok') return 'glow-green';
    if (status === 'degraded' || status === 'warning') return 'glow-yellow';
    return 'glow-red';
  };

  const getWsStatusColor = () => {
    switch (wsStatus) {
      case 'connected':
        return 'bg-emerald-500';
      case 'connecting':
      case 'reconnecting':
        return 'bg-amber-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate health score (0-100) from component statuses
  const calculateHealthScore = (): number => {
    if (!detailedHealth) return 0;

    const components = [
      detailedHealth.gateway.status,
      detailedHealth.eventBus.status,
      detailedHealth.audit.status,
      detailedHealth.sanitizer.status,
      detailedHealth.agents.status,
      detailedHealth.governance.status,
    ];

    const healthyCount = components.filter((s) => s === 'healthy').length;
    const degradedCount = components.filter((s) => s === 'degraded').length;

    // Healthy = 100%, Degraded = 50%, Unhealthy = 0%
    return Math.round(((healthyCount * 100 + degradedCount * 50) / components.length));
  };

  const healthScore = calculateHealthScore();

  // Real data from API
  const agentCount = detailedHealth?.agents.activeCount ?? 0;
  const councilCount = detailedHealth?.governance.councilMembers ?? 0;
  const patternCount = detailedHealth?.sanitizer.patternsLoaded ?? 21;

  // Dynamic description for agents page
  const pagesWithData = pages.map((page) => {
    if (page.id === 'agents') {
      return { ...page, description: `${agentCount} active` };
    }
    if (page.id === 'governance') {
      return { ...page, description: `${councilCount} members` };
    }
    return page;
  });

  return (
    <aside className="flex w-72 flex-col border-r border-gray-800 bg-gray-950" role="navigation" aria-label="Main navigation">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`relative h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-900 ${getStatusGlow(health?.status)}`}>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                A
              </div>
              <div className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-gray-950 ${getStatusColor(health?.status)} ${health?.status === 'healthy' ? 'status-dot-healthy' : ''}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">ARI</h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                Life Operating System
              </p>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Health Score Gauge */}
        <div className="mt-4 flex justify-center">
          <HealthScoreGauge score={healthScore} size="sm" label="Health" />
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-md bg-gray-900/50 p-2 text-center">
            <div className="text-lg font-bold text-emerald-400">{agentCount}</div>
            <div className="text-[9px] uppercase text-gray-500">Agents</div>
          </div>
          <div className="rounded-md bg-gray-900/50 p-2 text-center">
            <div className="text-lg font-bold text-purple-400">{councilCount}</div>
            <div className="text-[9px] uppercase text-gray-500">Council</div>
          </div>
          <div className="rounded-md bg-gray-900/50 p-2 text-center">
            <div className="text-lg font-bold text-cyan-400">{patternCount}</div>
            <div className="text-[9px] uppercase text-gray-500">Patterns</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3" aria-label="Page navigation">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
          Dashboard
        </div>
        <ul className="space-y-1">
          {pagesWithData.map((page) => (
            <li key={page.id}>
              <button
                onClick={() => onNavigate(page.id)}
                aria-current={currentPage === page.id ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
                  currentPage === page.id
                    ? 'bg-purple-900/30 text-white'
                    : 'text-gray-400 hover:bg-gray-900/50 hover:text-gray-200'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors ${
                  currentPage === page.id
                    ? 'bg-purple-900/50 text-purple-300'
                    : 'bg-gray-800/50 text-gray-500 group-hover:bg-gray-800 group-hover:text-gray-400'
                }`} aria-hidden="true">
                  {page.icon}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{page.label}</div>
                  <div className="text-[10px] text-gray-500">{page.description}</div>
                </div>
                {currentPage === page.id && (
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Security Status */}
      <div className="border-t border-gray-800 p-4">
        <div className="rounded-lg bg-gray-900/50 p-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded text-xs ${
              (alertSummary?.bySeverity.critical ?? 0) > 0
                ? 'bg-red-900/50 text-red-400'
                : 'bg-emerald-900/50 text-emerald-400'
            }`}>
              {(alertSummary?.bySeverity.critical ?? 0) > 0 ? '!' : '✓'}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-300">Security</div>
              <div className={`text-[10px] ${
                (alertSummary?.bySeverity.critical ?? 0) > 0
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}>
                {(alertSummary?.bySeverity.critical ?? 0) > 0
                  ? `${alertSummary?.bySeverity.critical} critical alerts`
                  : 'All systems nominal'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center justify-between text-[10px] text-gray-600">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getWsStatusColor()}`} />
            <span className="font-mono">
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
            </span>
          </div>
          <span>127.0.0.1:3141</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-gray-700">
          <span className="font-mono">v2.0.0</span>
          <span>⌘K to search</span>
        </div>
      </div>
    </aside>
  );
}
