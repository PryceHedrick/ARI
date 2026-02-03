import { useValueToday } from '../../hooks/useValueAnalytics';

interface ValueScoreCardProps {
  showDetails?: boolean;
}

const SCORE_COLORS = {
  excellent: 'var(--ari-success)',
  good: 'var(--ari-info)',
  moderate: 'var(--ari-warning)',
  poor: 'var(--ari-error)',
};

function getScoreColor(score: number): string {
  if (score >= 70) return SCORE_COLORS.excellent;
  if (score >= 50) return SCORE_COLORS.good;
  if (score >= 30) return SCORE_COLORS.moderate;
  return SCORE_COLORS.poor;
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Excellent';
  if (score >= 50) return 'Good';
  if (score >= 30) return 'Moderate';
  return 'Needs Improvement';
}

export function ValueScoreCard({ showDetails = true }: ValueScoreCardProps) {
  const { data, isLoading, isError } = useValueToday();

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
          Value analytics not available
        </p>
      </div>
    );
  }

  const score = data.currentScore;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const m = data.metrics;

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
            Today's Value
          </h3>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: `${scoreColor}20`,
            color: scoreColor,
          }}
        >
          {scoreLabel}
        </span>
      </div>

      {/* Main Score */}
      <div className="text-center mb-6">
        <div
          className="text-5xl font-bold font-mono"
          style={{ color: scoreColor }}
        >
          {score}
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          out of 100
        </div>
      </div>

      {/* Score Breakdown */}
      {showDetails && data.breakdown && data.breakdown.length > 0 && (
        <div
          className="pt-4"
          style={{ borderTop: '1px solid var(--border-muted)' }}
        >
          <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Today's Breakdown
          </div>
          <div className="space-y-1">
            {data.breakdown.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Summary */}
      {showDetails && m && (
        <div
          className="mt-4 pt-4"
          style={{ borderTop: '1px solid var(--border-muted)' }}
        >
          <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Activity
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {m.morningBriefDelivered && (
              <span style={{ color: 'var(--ari-success)' }}>✓ Morning brief</span>
            )}
            {m.eveningSummaryDelivered && (
              <span style={{ color: 'var(--ari-success)' }}>✓ Evening summary</span>
            )}
            {m.testsGenerated && m.testsGenerated > 0 && (
              <span style={{ color: 'var(--text-secondary)' }}>
                {m.testsGenerated} tests
              </span>
            )}
            {m.bugsFixed && m.bugsFixed > 0 && (
              <span style={{ color: 'var(--text-secondary)' }}>
                {m.bugsFixed} bugs fixed
              </span>
            )}
            {m.initiativesExecuted && m.initiativesExecuted > 0 && (
              <span style={{ color: 'var(--text-secondary)' }}>
                {m.initiativesExecuted} initiatives
              </span>
            )}
            {m.tasksSucceeded !== undefined && m.tasksAttempted && m.tasksAttempted > 0 && (
              <span style={{ color: 'var(--text-secondary)' }}>
                {m.tasksSucceeded}/{m.tasksAttempted} tasks
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
