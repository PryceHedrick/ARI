export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-bg-tertiary" />
        <div className="space-y-1.5">
          <div className="h-5 w-40 rounded bg-bg-tertiary" />
          <div className="h-3 w-24 rounded bg-bg-tertiary" />
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="h-10 w-64 rounded-xl bg-bg-tertiary" />

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-bg-tertiary" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-12 rounded-xl bg-bg-tertiary" />
        <div className="h-12 rounded-xl bg-bg-tertiary" />
        <div className="h-12 rounded-xl bg-bg-tertiary" />
      </div>
    </div>
  );
}
