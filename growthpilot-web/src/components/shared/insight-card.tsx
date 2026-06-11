import { cn } from "@/lib/utils";
import { Lightbulb, TrendingUp, Target } from "lucide-react";

const variantStyles = {
  default: {
    border: "border-border",
    bg: "bg-surface-subtle",
    icon: "text-muted-foreground",
  },
  insight: {
    border: "border-blue-200",
    bg: "bg-blue-50/40",
    icon: "text-blue-600",
  },
  action: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/40",
    icon: "text-emerald-600",
  },
  metric: {
    border: "border-border",
    bg: "bg-card",
    icon: "text-foreground",
  },
};

interface InsightCardProps {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  description: string;
  variant?: keyof typeof variantStyles;
  className?: string;
}

const defaultIcons: Record<string, React.ReactNode> = {
  default: <Lightbulb className="size-4" />,
  insight: <TrendingUp className="size-4" />,
  action: <Target className="size-4" />,
};

export function InsightCard({ icon, label, value, description, variant = "default", className }: InsightCardProps) {
  const styles = variantStyles[variant];
  return (
    <div className={cn("rounded-lg border p-4 space-y-2", styles.border, styles.bg, className)}>
      <div className="flex items-center gap-2">
        <span className={styles.icon}>{icon || defaultIcons[variant]}</span>
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      </div>
      {value && <p className="text-lg font-semibold text-foreground">{value}</p>}
      <p className="text-xs text-foreground/80 leading-relaxed">{description}</p>
    </div>
  );
}
