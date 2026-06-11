import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface AIResultCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function AIResultCard({ children, title = "AI Suggestion", className }: AIResultCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface-subtle", className)}>
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        <Sparkles className="size-3.5 text-foreground" />
        <span className="text-[11px] font-medium text-foreground uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
