import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  subtitle?: string;
  className?: string;
}

export function MetricCard({ label, value, icon, trend, subtitle, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive ? "text-green-600" : "text-red-600"
              )}
            >
              <span>{trend.positive ? "↑" : "↓"}</span> {trend.value}
            </p>
          )}
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
