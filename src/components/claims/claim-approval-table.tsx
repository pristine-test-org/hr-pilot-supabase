import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, titleCase } from "@/lib/format";
import { describeError, supabase, type Claim, type Employee } from "@/lib/supabase";

export type TeamClaimRow = Claim & { user: Employee | null };

export function ClaimApprovalTable({ claims, onDecided }: { claims: TeamClaimRow[]; onDecided?: () => void }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function decide(id: string, status: "APPROVED" | "REJECTED") {
    setPendingId(id);
    startTransition(async () => {
      try {
        const { error } = await supabase.rpc("decide_claim", { claim_id: id, decision: status });

        if (error) {
          toast.error(describeError(error, "Unable to update claim."));
          return;
        }

        toast.success(status === "APPROVED" ? "Claim approved." : "Claim rejected.");
        onDecided?.();
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setPendingId(null);
      }
    });
  }

  if (claims.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
        No claims from the team yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell>
                <div className="font-medium">{claim.user?.name}</div>
                <div className="text-xs text-muted-foreground">{claim.user?.department}</div>
              </TableCell>
              <TableCell className="font-medium">{titleCase(claim.category)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(claim.date)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {claim.description}
              </TableCell>
              <TableCell>{formatCurrency(claim.amount)}</TableCell>
              <TableCell>
                <StatusBadge status={claim.status} />
              </TableCell>
              <TableCell className="text-right">
                {claim.status === "PENDING" ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      disabled={isPending && pendingId === claim.id}
                      onClick={() => decide(claim.id, "APPROVED")}
                      aria-label="Approve"
                    >
                      {isPending && pendingId === claim.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      disabled={isPending && pendingId === claim.id}
                      onClick={() => decide(claim.id, "REJECTED")}
                      aria-label="Reject"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Decided</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
