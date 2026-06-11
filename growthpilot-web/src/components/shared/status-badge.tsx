import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-[#f5f5f5] text-[#888888]",
  approved: "bg-[#d3e5ff] text-[#0761d1]",
  sent: "bg-[#e8f5e9] text-[#2e7d32]",
  pending: "bg-[#fff8e1] text-[#ab570a]",
  delivered: "bg-[#e8f5e9] text-[#2e7d32]",
  failed: "bg-[#f7d4d6] text-[#c50000]",
  opened: "bg-[#e8eaf6] text-[#4527a0]",
  read: "bg-[#e8eaf6] text-[#4527a0]",
  clicked: "bg-[#f3e5f5] text-[#7b1fa2]",
  purchased: "bg-[#e0f2f1] text-[#00695c]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium leading-none tracking-wide uppercase",
        statusStyles[status] || "bg-[#f5f5f5] text-[#888888]"
      )}
    >
      {status}
    </span>
  );
}
