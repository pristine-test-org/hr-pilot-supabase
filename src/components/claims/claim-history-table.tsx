import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, titleCase } from "@/lib/format";
import type { Claim } from "@/lib/supabase";

export function ClaimHistoryTable({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
        No claims yet. Submit your first expense claim to see it here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell className="font-medium">{titleCase(claim.category)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(claim.date)}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">{claim.description}</TableCell>
              <TableCell>{formatCurrency(claim.amount)}</TableCell>
              <TableCell className="text-right">
                <StatusBadge status={claim.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
