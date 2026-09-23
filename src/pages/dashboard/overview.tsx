import { useCallback } from "react";
import { Link } from "react-router";
import { CalendarDays, HeartPulse, Receipt, ClipboardCheck, ArrowRight } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { fetchLeaveBalance } from "@/lib/leave-balance";
import { useAsync } from "@/lib/use-async";
import { formatCurrency, formatDateRange, formatDate } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { PageState } from "@/components/page-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function countPending(table: "leave_requests" | "claims", userId?: string) {
  let query = supabase.from(table).select("id", { count: "exact", head: true }).eq("status", "PENDING");
  if (userId) query = query.eq("user_id", userId);
  return query.then(({ count, error }) => {
    if (error) throw error;
    return count ?? 0;
  });
}

export default function DashboardOverviewPage() {
  const user = useCurrentUser();
  const isAdmin = user.role === "ADMIN";

  const load = useCallback(async () => {
    const [balance, recentLeaves, recentClaims, pendingLeaveCount, pendingClaimCount, orgPendingLeaves, orgPendingClaims] =
      await Promise.all([
        fetchLeaveBalance(user),
        supabase
          .from("leave_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)
          .then(({ data, error }) => {
            if (error) throw error;
            return data;
          }),
        supabase
          .from("claims")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)
          .then(({ data, error }) => {
            if (error) throw error;
            return data;
          }),
        countPending("leave_requests", user.id),
        countPending("claims", user.id),
        // RLS shows admins every row, so an unfiltered count is the whole team's.
        isAdmin ? countPending("leave_requests") : Promise.resolve(0),
        isAdmin ? countPending("claims") : Promise.resolve(0),
      ]);
    return { balance, recentLeaves, recentClaims, pendingLeaveCount, pendingClaimCount, orgPendingLeaves, orgPendingClaims };
  }, [user, isAdmin]);

  const { data, error } = useAsync(load);

  if (!data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name.split(" ")[0]}</h1>
        </div>
        <PageState error={error} />
      </div>
    );
  }

  const { balance, recentLeaves, recentClaims, pendingLeaveCount, pendingClaimCount, orgPendingLeaves, orgPendingClaims } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your HR account today — QA run 7.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Annual leave balance"
          value={`${balance.annual.remaining} / ${balance.annual.total} days`}
          hint={`${balance.annual.used} days taken`}
        />
        <StatCard
          icon={HeartPulse}
          label="Sick leave balance"
          value={`${balance.sick.remaining} / ${balance.sick.total} days`}
          hint={`${balance.sick.used} days taken`}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Your pending leaves"
          value={String(pendingLeaveCount)}
          hint="Awaiting admin approval"
        />
        <StatCard
          icon={Receipt}
          label="Your pending claims"
          value={String(pendingClaimCount)}
          hint="Awaiting admin approval"
        />
      </div>

      {isAdmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Approvals waiting on you</p>
                <p className="text-sm text-muted-foreground">
                  {orgPendingLeaves} leave request{orgPendingLeaves === 1 ? "" : "s"} and{" "}
                  {orgPendingClaims} claim{orgPendingClaims === 1 ? "" : "s"} across the team need a
                  decision.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/dashboard/leaves" className={cn(buttonVariants({ variant: "outline" }))}>
                Review leaves
              </Link>
              <Link to="/dashboard/claims" className={cn(buttonVariants())}>
                Review claims
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent leave requests</CardTitle>
            <Link
              to="/dashboard/leaves"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentLeaves.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You haven&apos;t applied for any leave yet.
              </p>
            ) : (
              <ul className="divide-y">
                {recentLeaves.map((leave) => (
                  <li key={leave.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium capitalize">{leave.type.toLowerCase()} leave</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateRange(leave.start_date, leave.end_date)} &middot; {leave.days}{" "}
                        day{leave.days === 1 ? "" : "s"}
                      </p>
                    </div>
                    <StatusBadge status={leave.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent claims</CardTitle>
            <Link
              to="/dashboard/claims"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentClaims.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You haven&apos;t submitted any claims yet.
              </p>
            ) : (
              <ul className="divide-y">
                {recentClaims.map((claim) => (
                  <li key={claim.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium capitalize">{claim.category.toLowerCase()} claim</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(claim.date)} &middot; {formatCurrency(claim.amount)}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
