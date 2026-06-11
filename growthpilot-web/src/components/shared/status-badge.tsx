import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
  sent: "bg-[var(--status-sent-bg)] text-[var(--status-sent-text)]",
  pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  delivered: "bg-[var(--status-delivered-bg)] text-[var(--status-delivered-text)]",
  failed: "bg-[var(--status-failed-bg)] text-[var(--status-failed-text)]",
  opened: "bg-[var(--status-opened-bg)] text-[var(--status-opened-text)]",
  read: "bg-[var(--status-read-bg)] text-[var(--status-read-text)]",
  clicked: "bg-[var(--status-clicked-bg)] text-[var(--status-clicked-text)]",
  purchased: "bg-[var(--status-purchased-bg)] text-[var(--status-purchased-text)]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium leading-none tracking-wide uppercase",
        statusStyles[status] || "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}
