import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { getSchedulerTasks, getSubagents, getAgents, getTools } from '../api/client';

interface CommandPaletteProps {
  onNavigate: (page: string) => void;
}

interface SearchItem {
  id: string;
  type: 'page' | 'task' | 'agent' | 'subagent' | 'tool' | 'action';
  title: string;
  description?: string;
  icon: string;
  onSelect: () => void;
}

const PAGES: SearchItem[] = [
  { id: 'system', type: 'page', title: 'System Status', description: 'Overview & Health', icon: '◉', onSelect: () => {} },
  { id: 'agents', type: 'page', title: 'Agents & Tools', description: 'Agent status & tool registry', icon: '⬡', onSelect: () => {} },
  { id: 'cognition', type: 'page', title: 'Cognition', description: 'LOGOS/ETHOS/PATHOS', icon: '🧠', onSelect: () => {} },
  { id: 'autonomy', type: 'page', title: 'Autonomy', description: 'Scheduler & Subagents', icon: '↻', onSelect: () => {} },
  { id: 'governance', type: 'page', title: 'Governance', description: 'Council, Rules & Audit', icon: '⚖', onSelect: () => {} },
  { id: 'memory', type: 'page', title: 'Memory', description: 'Knowledge base', icon: '⬢', onSelect: () => {} },
  { id: 'operations', type: 'page', title: 'Operations', description: 'Budget & E2E Tests', icon: '⚙', onSelect: () => {} },
];

export function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch data for search
  const { data: tasks } = useQuery({
    queryKey: ['scheduler-tasks'],
    queryFn: getSchedulerTasks,
    enabled: isOpen,
  });

  const { data: subagents } = useQuery({
    queryKey: ['subagents'],
    queryFn: getSubagents,
    enabled: isOpen,
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: getAgents,
    enabled: isOpen,
  });

  const { data: tools } = useQuery({
    queryKey: ['tools'],
    queryFn: getTools,
    enabled: isOpen,
  });

  // Toggle with ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      if (item.type === 'page') {
        onNavigate(item.id);
      }
      item.onSelect();
      setIsOpen(false);
      setSearch('');
    },
    [onNavigate]
  );

  // Build search items
  const pageItems: SearchItem[] = PAGES.map((p) => ({
    ...p,
    onSelect: () => onNavigate(p.id),
  }));

  const taskItems: SearchItem[] =
    tasks?.map((task) => ({
      id: `task-${task.id}`,
      type: 'task' as const,
      title: task.name,
      description: `${task.cron} • ${task.enabled ? 'Active' : 'Paused'}`,
      icon: '⏱',
      onSelect: () => onNavigate('autonomy'),
    })) ?? [];

  const subagentItems: SearchItem[] =
    subagents?.map((sa) => ({
      id: `subagent-${sa.id}`,
      type: 'subagent' as const,
      title: sa.task.slice(0, 50),
      description: `${sa.status} • ${sa.branch}`,
      icon: '⚡',
      onSelect: () => onNavigate('autonomy'),
    })) ?? [];

  const agentItems: SearchItem[] =
    agents?.map((agent) => ({
      id: `agent-${agent.id}`,
      type: 'agent' as const,
      title: agent.type,
      description: `${agent.status}`,
      icon: '🤖',
      onSelect: () => onNavigate('agents'),
    })) ?? [];

  // Future: add tool search items
  void tools;

  const actionItems: SearchItem[] = [
    {
      id: 'action-refresh',
      type: 'action',
      title: 'Refresh Data',
      description: 'Refresh all dashboard data',
      icon: '🔄',
      onSelect: () => window.location.reload(),
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        style={{ animation: 'fadeIn 0.1s ease-out' }}
      />

      {/* Command Dialog */}
      <div className="fixed left-1/2 top-[20%] z-[101] w-full max-w-xl -translate-x-1/2">
        <Command
          className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
          style={{ animation: 'slideDown 0.15s ease-out' }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        >
          <div className="flex items-center gap-3 border-b border-gray-800 px-4">
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search pages, tasks, agents..."
              className="h-12 flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            <kbd className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">ESC</kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-gray-500">
              No results found for "{search}"
            </Command.Empty>

            {/* Pages */}
            <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-500">
              {pageItems.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.title} ${item.description}`}
                  onSelect={() => handleSelect(item)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-gray-300 aria-selected:bg-purple-900/30 aria-selected:text-white"
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Tasks */}
            {taskItems.length > 0 && (
              <Command.Group heading="Scheduled Tasks" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-500">
                {taskItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.title} ${item.description}`}
                    onSelect={() => handleSelect(item)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-gray-300 aria-selected:bg-purple-900/30 aria-selected:text-white"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Subagents */}
            {subagentItems.length > 0 && (
              <Command.Group heading="Subagents" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-500">
                {subagentItems.slice(0, 5).map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.title} ${item.description}`}
                    onSelect={() => handleSelect(item)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-gray-300 aria-selected:bg-purple-900/30 aria-selected:text-white"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <div className="truncate text-sm">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Agents */}
            {agentItems.length > 0 && (
              <Command.Group heading="Agents" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-500">
                {agentItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.title} ${item.description}`}
                    onSelect={() => handleSelect(item)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-gray-300 aria-selected:bg-purple-900/30 aria-selected:text-white"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Actions */}
            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-500">
              {actionItems.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.title} ${item.description}`}
                  onSelect={() => handleSelect(item)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-gray-300 aria-selected:bg-purple-900/30 aria-selected:text-white"
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-2">
            <div className="flex items-center gap-4 text-[10px] text-gray-500">
              <span>
                <kbd className="rounded bg-gray-800 px-1 py-0.5 text-gray-400">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="rounded bg-gray-800 px-1 py-0.5 text-gray-400">↵</kbd> select
              </span>
            </div>
            <span className="text-[10px] text-gray-600">ARI Command Palette</span>
          </div>
        </Command>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
