import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  badge?: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({ title, icon, badge, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-sm" aria-hidden="true">{icon}</span>}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">{title}</h2>
        {badge}
      </div>
      {action}
    </div>
  );
}
