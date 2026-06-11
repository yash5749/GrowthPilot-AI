import { cn } from "@/lib/utils";

interface CTABannerProps {
  title: string;
  description: string;
  action: React.ReactNode;
  className?: string;
}

export function CTABanner({ title, description, action, className }: CTABannerProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface-subtle p-6", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}
