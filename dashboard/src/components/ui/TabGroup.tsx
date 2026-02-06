import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  badge?: ReactNode;
}

interface TabGroupProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabGroup({ tabs, activeTab, onTabChange }: TabGroupProps) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-bg-tertiary border border-border-muted" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-ari-purple-muted text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary hover:bg-bg-interactive'
          }`}
        >
          {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
          {tab.label}
          {tab.badge}
        </button>
      ))}
    </div>
  );
}
