import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  summary?: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
  badge?: ReactNode;
  headerAction?: ReactNode;
}

export function CollapsibleSection({
  title,
  summary,
  children,
  defaultCollapsed = false,
  badge,
  headerAction,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="rounded-xl border border-border-muted bg-bg-card overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-bg-card-hover transition-colors"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-text-muted text-xs transition-transform duration-200"
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          >
            ▾
          </span>
          <h3 className="text-sm font-semibold text-text-secondary truncate">{title}</h3>
          {badge}
          {collapsed && summary && (
            <span className="text-xs text-text-muted ml-2 truncate">{summary}</span>
          )}
        </div>
        {headerAction && (
          <div onClick={(e) => e.stopPropagation()}>
            {headerAction}
          </div>
        )}
      </button>
      {!collapsed && (
        <div className="px-5 pb-4 border-t border-border-subtle">
          {children}
        </div>
      )}
    </div>
  );
}
