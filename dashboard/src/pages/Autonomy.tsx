import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSchedulerStatus,
  getSchedulerTasks,
  triggerSchedulerTask,
  toggleSchedulerTask,
  getSubagents,
  getSubagentStats,
  deleteSubagent,
} from '../api/client';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import type { ScheduledTask, Subagent, SubagentStatus } from '../types/api';

// Cron expression descriptions
const CRON_DESCRIPTIONS: Record<string, string> = {
  '0 7 * * *': 'Daily at 7:00 AM',
  '0 8 * * *': 'Daily at 8:00 AM',
  '0 14 * * *': 'Daily at 2:00 PM',
  '0 20 * * *': 'Daily at 8:00 PM',
  '0 19 * * *': 'Daily at 7:00 PM',
  '0 21 * * *': 'Daily at 9:00 PM',
  '*/15 * * * *': 'Every 15 minutes',
  '0 18 * * 0': 'Sunday at 6:00 PM',
};

function formatCron(cron: string): string {
  return CRON_DESCRIPTIONS[cron] || cron;
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);

  if (diffMins < 0) {
    // Past
    const absMins = Math.abs(diffMins);
    if (absMins < 60) return `${absMins}m ago`;
    const absHours = Math.abs(diffHours);
    if (absHours < 24) return `${absHours}h ago`;
    return date.toLocaleDateString();
  }
  // Future
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  return date.toLocaleDateString();
}

function formatDateTime(isoString: string | null): string {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(status: SubagentStatus): string {
  switch (status) {
    case 'running':
      return 'bg-emerald-500';
    case 'completed':
      return 'bg-blue-500';
    case 'failed':
      return 'bg-red-500';
    case 'spawning':
      return 'bg-amber-500';
    default:
      return 'bg-gray-500';
  }
}

function getStatusBgColor(status: SubagentStatus): string {
  switch (status) {
    case 'running':
      return 'bg-emerald-900/20 border-emerald-800';
    case 'completed':
      return 'bg-blue-900/20 border-blue-800';
    case 'failed':
      return 'bg-red-900/20 border-red-800';
    case 'spawning':
      return 'bg-amber-900/20 border-amber-800';
    default:
      return 'bg-gray-900/20 border-gray-800';
  }
}

function getStatusTextColor(status: SubagentStatus): string {
  switch (status) {
    case 'running':
      return 'text-emerald-400';
    case 'completed':
      return 'text-blue-400';
    case 'failed':
      return 'text-red-400';
    case 'spawning':
      return 'text-amber-400';
    default:
      return 'text-gray-400';
  }
}

// Task icons based on handler name
function getTaskIcon(handler: string): string {
  switch (handler) {
    case 'morning_briefing':
      return '\u2600'; // sun
    case 'evening_summary':
      return '\u263E'; // moon
    case 'knowledge_index':
      return '\uD83D\uDCDA'; // books
    case 'changelog_generate':
      return '\uD83D\uDCDD'; // memo
    case 'agent_health_check':
      return '\uD83D\uDC93'; // heartbeat
    case 'weekly_review':
      return '\uD83D\uDCC5'; // calendar
    default:
      return '\u2699'; // gear
  }
}

export function Autonomy() {
  const queryClient = useQueryClient();
  const [triggeringTask, setTriggeringTask] = useState<string | null>(null);

  const {
    data: schedulerStatus,
    isLoading: statusLoading,
    isError: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['scheduler-status'],
    queryFn: getSchedulerStatus,
    refetchInterval: 10000,
  });

  const { data: schedulerTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['scheduler-tasks'],
    queryFn: getSchedulerTasks,
    refetchInterval: 10000,
  });

  const { data: subagents, isLoading: subagentsLoading } = useQuery({
    queryKey: ['subagents'],
    queryFn: getSubagents,
    refetchInterval: 5000,
  });

  const { data: subagentStats } = useQuery({
    queryKey: ['subagent-stats'],
    queryFn: getSubagentStats,
    refetchInterval: 5000,
  });

  const triggerMutation = useMutation({
    mutationFn: triggerSchedulerTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-status'] });
    },
    onSettled: () => {
      setTriggeringTask(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleSchedulerTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-status'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubagent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subagents'] });
      queryClient.invalidateQueries({ queryKey: ['subagent-stats'] });
    },
  });

  const handleTrigger = async (taskId: string) => {
    setTriggeringTask(taskId);
    triggerMutation.mutate(taskId);
  };

  const handleToggle = (taskId: string) => {
    toggleMutation.mutate(taskId);
  };

  const handleDelete = (agentId: string) => {
    if (confirm('Are you sure you want to delete this subagent and its worktree?')) {
      deleteMutation.mutate(agentId);
    }
  };

  if (statusError) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Autonomous Operations</h1>
        </div>
        <ErrorState
          title="Failed to load scheduler"
          message="Could not connect to ARI gateway. Ensure the gateway is running."
          onRetry={() => refetchStatus()}
        />
      </div>
    );
  }

  const runningAgents = subagents?.filter((a) => a.status === 'running') || [];
  const completedAgents =
    subagents?.filter((a) => a.status === 'completed' || a.status === 'failed') || [];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 px-8 py-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                schedulerStatus?.running
                  ? 'bg-emerald-900/30 text-emerald-400'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Autonomous Operations</h1>
              <p className="mt-1 text-sm text-gray-500">
                Scheduler tasks and spawned subagents
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Scheduler Status */}
            <div className="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  schedulerStatus?.running ? 'bg-emerald-400 status-dot-healthy' : 'bg-gray-500'
                }`}
              />
              <div>
                <div className="text-xs text-gray-500">Scheduler</div>
                <div className={`text-sm font-medium ${schedulerStatus?.running ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {statusLoading ? '...' : schedulerStatus?.running ? 'Running' : 'Stopped'}
                </div>
              </div>
            </div>
            {/* Task Count */}
            <div className="rounded-lg bg-gray-900 px-4 py-2">
              <div className="text-xs text-gray-500">Tasks</div>
              <div className="text-lg font-bold text-white">
                {statusLoading ? '...' : `${schedulerStatus?.enabledCount || 0}/${schedulerStatus?.taskCount || 0}`}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Next Task Banner */}
        {schedulerStatus?.nextTask && (
          <div className="mb-8 rounded-xl border border-purple-800 bg-purple-900/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/50 text-purple-400 text-xl">
                  \u23F0
                </div>
                <div>
                  <div className="text-xs text-purple-300">Next Scheduled Task</div>
                  <div className="text-lg font-medium text-white">{schedulerStatus.nextTask.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Scheduled For</div>
                <div className="font-mono text-lg text-purple-400">
                  {formatRelativeTime(schedulerStatus.nextTask.nextRun)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subagent Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Running"
            value={subagentStats?.running ?? 0}
            color="emerald"
            loading={subagentsLoading}
          />
          <StatCard
            label="Completed"
            value={subagentStats?.completed ?? 0}
            color="blue"
            loading={subagentsLoading}
          />
          <StatCard
            label="Failed"
            value={subagentStats?.failed ?? 0}
            color="red"
            loading={subagentsLoading}
          />
          <StatCard
            label="Spawning"
            value={subagentStats?.spawning ?? 0}
            color="amber"
            loading={subagentsLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Scheduled Tasks */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Scheduled Tasks
            </h2>
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="shimmer h-20 rounded-lg" />
                ))}
              </div>
            ) : schedulerTasks && schedulerTasks.length > 0 ? (
              <div className="space-y-2">
                {schedulerTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onTrigger={handleTrigger}
                    onToggle={handleToggle}
                    isTriggering={triggeringTask === task.id}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-800 p-8 text-center">
                <div className="text-sm text-gray-500">No scheduled tasks</div>
              </div>
            )}
          </div>

          {/* Running Subagents */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Running Subagents
            </h2>
            {subagentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="shimmer h-24 rounded-lg" />
                ))}
              </div>
            ) : runningAgents.length > 0 ? (
              <div className="space-y-3">
                {runningAgents.map((agent) => (
                  <SubagentCard key={agent.id} agent={agent} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-800 p-8 text-center">
                <div className="mb-2 text-2xl text-gray-600">\u2728</div>
                <div className="text-sm text-gray-500">No agents running</div>
                <div className="mt-1 text-xs text-gray-600">
                  Agents will appear here when spawned
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Completed/Failed Subagents */}
        {completedAgents.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Recent Completions
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {completedAgents.slice(0, 6).map((agent) => (
                <SubagentCard key={agent.id} agent={agent} compact onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* Cron Legend */}
        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Schedule Reference
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-gray-950/50 p-3">
              <div className="text-xs text-gray-500">Daily Briefings</div>
              <div className="mt-1 text-sm text-white">7:00 AM / 9:00 PM</div>
            </div>
            <div className="rounded-lg bg-gray-950/50 p-3">
              <div className="text-xs text-gray-500">Knowledge Index</div>
              <div className="mt-1 text-sm text-white">8 AM / 2 PM / 8 PM</div>
            </div>
            <div className="rounded-lg bg-gray-950/50 p-3">
              <div className="text-xs text-gray-500">Health Check</div>
              <div className="mt-1 text-sm text-white">Every 15 minutes</div>
            </div>
            <div className="rounded-lg bg-gray-950/50 p-3">
              <div className="text-xs text-gray-500">Weekly Review</div>
              <div className="mt-1 text-sm text-white">Sunday 6:00 PM</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TaskRowProps {
  task: ScheduledTask;
  onTrigger: (id: string) => void;
  onToggle: (id: string) => void;
  isTriggering: boolean;
}

function TaskRow({ task, onTrigger, onToggle, isTriggering }: TaskRowProps) {
  const icon = getTaskIcon(task.handler);

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        task.enabled
          ? 'border-gray-800 bg-gray-950/50'
          : 'border-gray-800/50 bg-gray-950/30 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-xl">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{task.name}</span>
              {!task.enabled && (
                <span className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">
                  DISABLED
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">{formatCron(task.cron)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-2">
            <div className="text-[10px] text-gray-600">Next Run</div>
            <div className="font-mono text-xs text-gray-400">
              {task.enabled ? formatRelativeTime(task.nextRun) : '-'}
            </div>
          </div>
          <button
            onClick={() => onToggle(task.id)}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              task.enabled
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
            }`}
            title={task.enabled ? 'Disable task' : 'Enable task'}
          >
            {task.enabled ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={() => onTrigger(task.id)}
            disabled={isTriggering || !task.enabled}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              isTriggering
                ? 'bg-purple-900/50 text-purple-300'
                : task.enabled
                  ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {isTriggering ? 'Running...' : 'Run Now'}
          </button>
        </div>
      </div>
      {task.lastRun && (
        <div className="mt-2 border-t border-gray-800 pt-2 text-xs text-gray-600">
          Last run: {formatDateTime(task.lastRun)}
        </div>
      )}
    </div>
  );
}

interface SubagentCardProps {
  agent: Subagent;
  compact?: boolean;
  onDelete: (id: string) => void;
}

function SubagentCard({ agent, compact, onDelete }: SubagentCardProps) {
  const canDelete = agent.status === 'completed' || agent.status === 'failed';

  return (
    <div
      className={`rounded-lg border ${getStatusBgColor(agent.status)} ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(agent.status)} ${agent.status === 'running' ? 'status-dot-healthy' : ''}`} />
          <div>
            <div className={`font-mono text-sm ${getStatusTextColor(agent.status)}`}>
              {agent.status.toUpperCase()}
            </div>
            {!compact && (
              <div className="text-xs text-gray-500 mt-0.5">
                {agent.id.slice(0, 20)}...
              </div>
            )}
          </div>
        </div>
        {canDelete && (
          <button
            onClick={() => onDelete(agent.id)}
            className="text-gray-600 hover:text-red-400 transition-colors"
            title="Delete subagent"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className={`${compact ? 'mt-2' : 'mt-3'}`}>
        <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-300 ${compact ? 'truncate' : 'line-clamp-2'}`}>
          {agent.task}
        </div>
      </div>

      {agent.progress !== null && agent.status === 'running' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="text-emerald-400">{agent.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${agent.progress}%` }}
            />
          </div>
          {agent.lastMessage && (
            <div className="mt-1 text-[10px] text-gray-600 truncate">
              {agent.lastMessage}
            </div>
          )}
        </div>
      )}

      {agent.error && (
        <div className="mt-2 rounded bg-red-900/20 px-2 py-1 text-xs text-red-400 truncate">
          {agent.error}
        </div>
      )}

      {!compact && (
        <div className="mt-3 flex items-center gap-4 border-t border-gray-800 pt-3 text-xs text-gray-500">
          <div>
            <span className="text-gray-600">Branch:</span>{' '}
            <span className="font-mono text-gray-400">{agent.branch.slice(-20)}</span>
          </div>
          <div>
            <span className="text-gray-600">Started:</span>{' '}
            <span className="text-gray-400">{formatRelativeTime(agent.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: 'emerald' | 'blue' | 'red' | 'amber';
  loading: boolean;
}

function StatCard({ label, value, color, loading }: StatCardProps) {
  const colorMap = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
  };

  const bgMap = {
    emerald: 'bg-emerald-900/20',
    blue: 'bg-blue-900/20',
    red: 'bg-red-900/20',
    amber: 'bg-amber-900/20',
  };

  return (
    <div className={`rounded-xl border border-gray-800 ${bgMap[color]} p-4`}>
      {loading ? (
        <Skeleton className="h-10 w-16" />
      ) : (
        <>
          <div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
          <div className="mt-1 text-xs uppercase text-gray-500">{label}</div>
        </>
      )}
    </div>
  );
}

export default Autonomy;
