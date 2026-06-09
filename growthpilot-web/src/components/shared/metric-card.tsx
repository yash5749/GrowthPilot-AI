import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function MetricCard({ label, value, icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon && <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">{icon}</div>}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className={cn("text-xs mt-1", trend.positive ? "text-green-600" : "text-red-600")}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
