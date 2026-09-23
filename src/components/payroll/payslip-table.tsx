import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatMonth } from "@/lib/format";
import type { Payslip } from "@/lib/supabase";

export function PayslipTable({ payslips }: { payslips: Payslip[] }) {
  if (payslips.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
        No payslips have been generated yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Basic salary</TableHead>
            <TableHead className="text-right">Allowances</TableHead>
            <TableHead className="text-right">Deductions</TableHead>
            <TableHead className="text-right">Net pay</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payslips.map((payslip) => (
            <TableRow key={payslip.id}>
              <TableCell className="font-medium">{formatMonth(payslip.month)}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(payslip.basic_salary)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(payslip.allowances)}
              </TableCell>
              <TableCell className="text-right text-rose-600">
                -{formatCurrency(payslip.deductions)}
              </TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(payslip.net_pay)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
