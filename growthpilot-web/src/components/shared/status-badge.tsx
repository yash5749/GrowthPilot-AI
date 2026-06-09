import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  approved: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  sent: "bg-green-100 text-green-700 hover:bg-green-100",
  pending: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  delivered: "bg-green-100 text-green-700 hover:bg-green-100",
  failed: "bg-red-100 text-red-700 hover:bg-red-100",
  opened: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
  clicked: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  purchased: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusStyles[status] || "bg-gray-100 text-gray-700")}>
      {status}
    </Badge>
  );
}
