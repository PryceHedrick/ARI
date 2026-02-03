import { useBillingCycle } from '../../hooks/useBillingCycle';

const STATUS_COLORS = {
  under_budget: 'var(--ari-info)',
  on_track: 'var(--ari-success)',
  at_risk: 'var(--ari-warning)',
  over_budget: 'var(--ari-error)',
};

const STATUS_LABELS = {
  under_budget: 'Under Budget',
  on_track: 'On Track',
  at_risk: 'At Risk',
  over_budget: 'Over Budget',
};

export function BillingCycleProgress() {
  const { data, isLoading, isError } = useBillingCycle();

  if (isLoading) {
    return (
      <div
        className="card-ari rounded-xl p-6"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-muted)',
        }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 rounded w-1/3" style={{ background: 'var(--bg-tertiary)' }} />
          <div className="h-16 rounded" style={{ background: 'var(--bg-tertiary)' }} />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className="card-ari rounded-xl p-6"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-muted)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Billing cycle data not available
        </p>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[data.status];
  const statusLabel = STATUS_LABELS[data.status];
  const totalBudget = data.cycle?.totalBudget ?? 75;
  const timePercent = data.percentComplete;
  const spendPercent = (data.totalSpent / totalBudget) * 100;

  return (
    <div
      className="card-ari card-ari-hover rounded-xl p-6"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-muted)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Billing Cycle
          </h3>
          <div className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            $75 / 14 days
          </div>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Time Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--text-muted)' }}>Time</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Day {data.daysElapsed} of 14
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${timePercent}%`,
              background: 'var(--text-tertiary)',
            }}
          />
        </div>
      </div>

      {/* Spend Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--text-muted)' }}>Spent</span>
          <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
            ${data.totalSpent.toFixed(2)} / ${totalBudget.toFixed(2)}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(spendPercent, 100)}%`,
              background: statusColor,
            }}
          />
        </div>
      </div>

      {/* Projected End */}
      <div
        className="p-3 rounded-lg mb-4"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Projected End
          </span>
          <span
            className="font-mono font-bold"
            style={{
              color: data.projectedTotal > totalBudget
                ? 'var(--ari-error)'
                : 'var(--text-primary)',
            }}
          >
            ${data.projectedTotal.toFixed(2)}
            {data.projectedTotal > totalBudget && (
              <span className="text-xs ml-1" style={{ color: 'var(--ari-error)' }}>
                (+${(data.projectedTotal - totalBudget).toFixed(2)})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Recommendation */}
      <div
        className="text-xs p-2 rounded"
        style={{
          background: `${statusColor}10`,
          color: 'var(--text-secondary)',
        }}
      >
        💡 {data.recommendation}
      </div>

      {/* Daily Budget Recommendation */}
      {data.recommended && (
        <div
          className="mt-4 pt-4 text-xs"
          style={{ borderTop: '1px solid var(--border-muted)' }}
        >
          <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
            <span>Recommended Daily</span>
            <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
              ${data.recommended.dailyBudget.toFixed(2)}
            </span>
          </div>
          <div className="mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {data.recommended.reason} ({(data.recommended.confidence * 100).toFixed(0)}% confidence)
          </div>
        </div>
      )}
    </div>
  );
}
