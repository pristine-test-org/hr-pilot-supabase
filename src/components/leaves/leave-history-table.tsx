import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatDateRange, titleCase } from "@/lib/format";
import type { LeaveRequest } from "@/lib/supabase";

export function LeaveHistoryTable({ leaves }: { leaves: LeaveRequest[] }) {
  if (leaves.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
        No leave requests yet. Apply for your first leave to see it here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow key={leave.id}>
              <TableCell className="font-medium">{titleCase(leave.type)}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateRange(leave.start_date, leave.end_date)}
              </TableCell>
              <TableCell>{leave.days}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">{leave.reason}</TableCell>
              <TableCell className="text-right">
                <StatusBadge status={leave.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
