interface StatusBadgeProps {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'active' | 'idle' | 'stopped';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'bg-ari-success';
      case 'degraded':
      case 'idle':
        return 'bg-ari-warning';
      case 'unhealthy':
      case 'stopped':
        return 'bg-ari-error';
      default:
        return 'bg-bg-tertiary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium uppercase ${getStatusColor()} ${getSizeClass()}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-white"></span>
      {status}
    </span>
  );
}
