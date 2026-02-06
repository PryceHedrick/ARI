import { NavLink } from 'react-router-dom';
import { useHealth, useDetailedHealth } from '../hooks/useHealth';
import { useAlertSummary } from '../hooks/useAlerts';
import { NotificationBell } from './alerts/NotificationBell';
import { HealthScoreGauge } from './charts/HealthScoreGauge';

interface SidebarProps {
  currentPage: string;
  wsStatus?: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

const pages = [
  { id: 'system', label: 'System Status', icon: '◉', description: 'Overview & Health' },
  { id: 'agents', label: 'Agents & Tools', icon: '⬡', description: 'Active agents' },
  { id: 'cognition', label: 'Cognition', icon: '🧠', description: 'LOGOS/ETHOS/PATHOS' },
  { id: 'autonomy', label: 'Autonomy', icon: '↻', description: 'Scheduler' },
  { id: 'governance', label: 'Governance', icon: '⚖', description: 'Council & Audit' },
  { id: 'memory', label: 'Memory', icon: '⬢', description: 'Knowledge' },
  { id: 'operations', label: 'Operations', icon: '⚙', description: 'Budget & E2E' },
];

export function Sidebar({ currentPage, wsStatus = 'disconnected' }: SidebarProps) {
  const { data: health } = useHealth();
  const { data: detailedHealth } = useDetailedHealth();
  const { data: alertSummary } = useAlertSummary();

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-500';
    if (status === 'healthy' || status === 'ok') return 'bg-ari-success';
    if (status === 'degraded' || status === 'warning') return 'bg-ari-warning';
    return 'bg-ari-error';
  };

  const getStatusGlow = (status?: string) => {
    if (!status) return '';
    if (status === 'healthy' || status === 'ok') return 'glow-success';
    if (status === 'degraded' || status === 'warning') return 'glow-warning';
    return 'glow-error';
  };

  const getWsStatusColor = () => {
    switch (wsStatus) {
      case 'connected':
        return 'bg-ari-success';
      case 'connecting':
      case 'reconnecting':
        return 'bg-ari-warning animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

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
    return Math.round(((healthyCount * 100 + degradedCount * 50) / components.length));
  };

  const healthScore = calculateHealthScore();
  const agentCount = detailedHealth?.agents.activeCount ?? 0;
  const councilCount = detailedHealth?.governance.councilMembers ?? 0;
  const patternCount = detailedHealth?.sanitizer.patternsLoaded ?? 21;

  const pagesWithData = pages.map((page) => {
    if (page.id === 'agents') return { ...page, description: `${agentCount} active` };
    if (page.id === 'governance') return { ...page, description: `${councilCount} members` };
    return page;
  });

  return (
    <aside
      className="flex w-72 flex-col border-r border-border-muted bg-bg-secondary"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="relative p-6 border-b border-border-muted">
        <div
          className="absolute inset-x-0 top-0 h-32 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(168, 85, 247, 0.08) 0%, transparent 70%)'
          }}
        />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`relative h-11 w-11 rounded-xl animate-breathe-purple ${getStatusGlow(health?.status)}`}
              style={{
                background: 'linear-gradient(135deg, var(--ari-purple) 0%, var(--ari-purple-dark) 100%)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                A
              </div>
              <div
                className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full ${getStatusColor(health?.status)} ${health?.status === 'healthy' ? 'status-dot-healthy' : ''}`}
                style={{ border: '2px solid var(--bg-secondary)' }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary">ARI</h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-text-muted">
                Life Operating System
              </p>
            </div>
          </div>
          <NotificationBell />
        </div>

        <div className="mt-5 flex justify-center">
          <HealthScoreGauge score={healthScore} size="sm" label="Health" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-lg p-2.5 text-center card-ari bg-ari-success-muted">
            <div className="text-lg font-bold text-ari-success">{agentCount}</div>
            <div className="text-[9px] uppercase font-medium text-text-muted">Agents</div>
          </div>
          <div className="rounded-lg p-2.5 text-center card-ari bg-ari-purple-muted">
            <div className="text-lg font-bold text-ari-purple">{councilCount}</div>
            <div className="text-[9px] uppercase font-medium text-text-muted">Council</div>
          </div>
          <div className="rounded-lg p-2.5 text-center card-ari bg-ari-info-muted">
            <div className="text-lg font-bold text-ari-cyan">{patternCount}</div>
            <div className="text-[9px] uppercase font-medium text-text-muted">Patterns</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar" aria-label="Page navigation">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-disabled">
          Dashboard
        </div>
        <ul className="space-y-1 stagger-children">
          {pagesWithData.map((page) => (
            <li key={page.id}>
              <NavLink
                to={`/${page.id}`}
                aria-current={currentPage === page.id ? 'page' : undefined}
                className={({ isActive }) =>
                  `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ari-purple focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary ${
                    isActive ? 'bg-ari-purple-muted' : 'hover:bg-bg-interactive'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all ${
                        isActive ? '' : 'group-hover:scale-105'
                      }`}
                      style={{
                        background: isActive
                          ? 'rgba(168, 85, 247, 0.3)'
                          : 'var(--bg-tertiary)',
                        color: isActive
                          ? 'var(--ari-purple-300)'
                          : 'var(--text-muted)',
                      }}
                      aria-hidden="true"
                    >
                      {page.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {page.label}
                      </div>
                      <div className="text-[10px] truncate text-text-muted">
                        {page.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full animate-pulse bg-[var(--ari-purple-400)]" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Security Status */}
      <div className="p-4 border-t border-border-muted">
        <div
          className={`rounded-xl p-3 border ${
            (alertSummary?.bySeverity.critical ?? 0) > 0
              ? 'bg-ari-error-muted border-ari-error/20'
              : 'bg-ari-success-muted border-ari-success/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                (alertSummary?.bySeverity.critical ?? 0) > 0
                  ? 'bg-ari-error/20 text-ari-error'
                  : 'bg-ari-success/20 text-ari-success'
              }`}
            >
              {(alertSummary?.bySeverity.critical ?? 0) > 0 ? '!' : '✓'}
            </div>
            <div>
              <div className="text-xs font-medium text-text-secondary">Security</div>
              <div
                className={`text-[10px] font-medium ${
                  (alertSummary?.bySeverity.critical ?? 0) > 0 ? 'text-ari-error' : 'text-ari-success'
                }`}
              >
                {(alertSummary?.bySeverity.critical ?? 0) > 0
                  ? `${alertSummary?.bySeverity.critical} critical alerts`
                  : 'All systems nominal'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-muted">
        <div className="flex items-center justify-between text-[10px] text-text-disabled">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getWsStatusColor()}`} />
            <span className="font-mono">
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
            </span>
          </div>
          <span className="font-mono">127.0.0.1:3141</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-text-disabled">
          <span className="font-mono text-[var(--ari-purple-400)]">v3.0.0</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-bg-tertiary border border-border-muted">
              ⌘K
            </kbd>
            <span>search</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
