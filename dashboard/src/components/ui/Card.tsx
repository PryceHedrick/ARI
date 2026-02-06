import type { ReactNode } from 'react';

const VARIANT_BORDERS: Record<string, string> = {
  default: 'border-border-muted',
  logos: 'border-[var(--pillar-logos-border)]',
  ethos: 'border-[var(--pillar-ethos-border)]',
  pathos: 'border-[var(--pillar-pathos-border)]',
  success: 'border-ari-success/20',
  error: 'border-ari-error/20',
  warning: 'border-ari-warning/20',
};

const PADDING: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'logos' | 'ethos' | 'pathos' | 'success' | 'error' | 'warning';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
}: CardProps) {
  const base = 'rounded-xl border bg-bg-card';
  const border = VARIANT_BORDERS[variant];
  const pad = PADDING[padding];
  const hover = hoverable ? 'card-ari-hover cursor-pointer' : '';
  const interactive = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${base} ${border} ${pad} ${hover} ${interactive} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
