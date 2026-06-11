import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-blue-50 text-blue-700",
  sent: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  delivered: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  opened: "bg-indigo-50 text-indigo-700",
  read: "bg-indigo-50 text-indigo-700",
  clicked: "bg-purple-50 text-purple-700",
  purchased: "bg-teal-50 text-teal-700",
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
