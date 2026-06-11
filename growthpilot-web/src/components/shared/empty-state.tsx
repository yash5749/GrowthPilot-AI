import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-[#ebebeb] bg-white px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#888888]">
        {icon}
      </div>
      <h3 className="text-base font-medium text-[#171717]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[#888888]">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
