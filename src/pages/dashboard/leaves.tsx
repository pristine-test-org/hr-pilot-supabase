import { useCallback } from "react";
import { CalendarDays, HeartPulse } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { fetchLeaveBalance } from "@/lib/leave-balance";
import { useAsync } from "@/lib/use-async";
import { StatCard } from "@/components/stat-card";
import { PageState } from "@/components/page-state";
import { ApplyLeaveDialog } from "@/components/leaves/apply-leave-dialog";
import { LeaveHistoryTable } from "@/components/leaves/leave-history-table";
import { LeaveApprovalTable } from "@/components/leaves/leave-approval-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function LeavesPage() {
  const user = useCurrentUser();
  const isAdmin = user.role === "ADMIN";

  const load = useCallback(async () => {
    const [balance, mine, team] = await Promise.all([
      fetchLeaveBalance(user),
      supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      isAdmin
        ? supabase
            .from("leave_requests")
            .select("*, user:profiles!leave_requests_user_id_fkey(id, name, department, job_title)")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (mine.error) throw mine.error;
    if (team.error) throw team.error;
    const allLeaves = team.data ?? [];
    return {
      balance,
      myLeaves: mine.data,
      allLeaves,
      pendingCount: allLeaves.filter((leave) => leave.status === "PENDING").length,
    };
  }, [user, isAdmin]);

  const { data, error, reload } = useAsync(load);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaves</h1>
          <p className="mt-1 text-muted-foreground">
            Apply for leave and keep track of your balance and requests.
          </p>
        </div>
        <ApplyLeaveDialog onSubmitted={reload} />
      </div>

      {!data ? (
        <PageState error={error} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon={CalendarDays}
              label="Annual leave balance"
              value={`${data.balance.annual.remaining} / ${data.balance.annual.total} days`}
              hint={`${data.balance.annual.used} days taken this year`}
            />
            <StatCard
              icon={HeartPulse}
              label="Sick leave balance"
              value={`${data.balance.sick.remaining} / ${data.balance.sick.total} days`}
              hint={`${data.balance.sick.used} days taken this year`}
            />
          </div>

          {isAdmin ? (
            <Tabs defaultValue="mine">
              <TabsList>
                <TabsTrigger value="mine">My Leaves</TabsTrigger>
                <TabsTrigger value="team">
                  Team Requests
                  {data.pendingCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5">
                      {data.pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="mine" className="mt-4">
                <LeaveHistoryTable leaves={data.myLeaves} />
              </TabsContent>
              <TabsContent value="team" className="mt-4">
                <LeaveApprovalTable leaves={data.allLeaves} onDecided={reload} />
              </TabsContent>
            </Tabs>
          ) : (
            <LeaveHistoryTable leaves={data.myLeaves} />
          )}
        </>
      )}
    </div>
  );
}
