import { cn } from "@/lib/utils";

interface FunnelStep {
  label: string;
  value: number;
  total: number;
}

interface FunnelStepBarProps {
  steps: FunnelStep[];
  className?: string;
}

export function FunnelStepBar({ steps, className }: FunnelStepBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step) => {
        const pct = step.total > 0 ? Math.min(100, (step.value / step.total) * 100) : 0;
        return (
          <div key={step.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">{step.label}</span>
              <span className="font-semibold text-foreground">{step.value}</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
