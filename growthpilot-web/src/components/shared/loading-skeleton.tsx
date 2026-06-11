import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-7 w-16" />
        </div>
        <SkeletonBlock className="size-9 shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SectionCardSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3.5">
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <div className={cn("p-5", height)}>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-3 w-8" />
              </div>
              <SkeletonBlock className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-5 py-3.5 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-6 px-5 py-3.5">
            {Array.from({ length: cols }).map((_, j) => (
              <SkeletonBlock key={j} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4 space-y-2">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
          <div className="p-5">
            <SkeletonBlock className="h-20 w-full" />
          </div>
          <div className="border-t border-border px-5 py-3">
            <SkeletonBlock className="h-7 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CampaignCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-5 w-14 rounded-full" />
          </div>
          <SkeletonBlock className="h-3 w-48" />
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <SkeletonBlock className="h-7 w-14 rounded-md" />
          <SkeletonBlock className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-6 w-36" />
        <SkeletonBlock className="h-4 w-56" />
      </div>
      <SkeletonBlock className="h-8 w-28 rounded-md" />
    </div>
  );
}

export function AnalyticsCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface-subtle p-4 text-center space-y-2">
      <SkeletonBlock className="h-7 w-12 mx-auto" />
      <SkeletonBlock className="h-3 w-20 mx-auto" />
      <SkeletonBlock className="h-1.5 w-full mx-auto" />
    </div>
  );
}
