const COLOR_MAP: Record<string, { value: string; bg: string }> = {
  default: { value: 'text-text-primary', bg: 'bg-bg-tertiary' },
  purple: { value: 'text-ari-purple', bg: 'bg-ari-purple-muted' },
  success: { value: 'text-ari-success', bg: 'bg-ari-success-muted' },
  error: { value: 'text-ari-error', bg: 'bg-ari-error-muted' },
  warning: { value: 'text-ari-warning', bg: 'bg-ari-warning-muted' },
  info: { value: 'text-ari-info', bg: 'bg-ari-info-muted' },
  logos: { value: 'text-pillar-logos', bg: 'bg-pillar-logos-muted' },
  ethos: { value: 'text-pillar-ethos', bg: 'bg-pillar-ethos-muted' },
  pathos: { value: 'text-pillar-pathos', bg: 'bg-pillar-pathos-muted' },
};

const SIZE_MAP: Record<string, { value: string; label: string; pad: string }> = {
  sm: { value: 'text-lg', label: 'text-[9px]', pad: 'p-2.5' },
  md: { value: 'text-2xl', label: 'text-[10px]', pad: 'p-4' },
  lg: { value: 'text-3xl', label: 'text-xs', pad: 'p-5' },
};

interface MetricCardProps {
  label: string;
  value: string | number;
  color?: keyof typeof COLOR_MAP;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MetricCard({
  label,
  value,
  color = 'default',
  sublabel,
  size = 'md',
}: MetricCardProps) {
  const colors = COLOR_MAP[color];
  const sizes = SIZE_MAP[size];

  return (
    <div className={`rounded-xl border border-border-muted ${colors.bg} ${sizes.pad} text-center`}>
      <div className={`font-bold font-mono ${sizes.value} ${colors.value}`}>{value}</div>
      <div className={`uppercase font-medium text-text-muted ${sizes.label} mt-0.5`}>{label}</div>
      {sublabel && (
        <div className="text-[9px] text-text-disabled mt-0.5">{sublabel}</div>
      )}
    </div>
  );
}
