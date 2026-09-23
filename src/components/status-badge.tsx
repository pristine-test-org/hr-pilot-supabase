import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border-transparent",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 border-transparent",
  REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400 border-transparent",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("font-medium capitalize", STATUS_STYLES[status])} variant="outline">
      {status.toLowerCase()}
    </Badge>
  );
}
