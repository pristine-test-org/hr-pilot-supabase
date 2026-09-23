import { useCallback } from "react";
import { useCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAsync } from "@/lib/use-async";
import { PageState } from "@/components/page-state";
import { SubmitClaimDialog } from "@/components/claims/submit-claim-dialog";
import { ClaimHistoryTable } from "@/components/claims/claim-history-table";
import { ClaimApprovalTable } from "@/components/claims/claim-approval-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function ClaimsPage() {
  const user = useCurrentUser();
  const isAdmin = user.role === "ADMIN";

  const load = useCallback(async () => {
    const [mine, team] = await Promise.all([
      supabase
        .from("claims")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      isAdmin
        ? supabase
            .from("claims")
            .select("*, user:profiles!claims_user_id_fkey(id, name, department, job_title)")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (mine.error) throw mine.error;
    if (team.error) throw team.error;
    const allClaims = team.data ?? [];
    return {
      myClaims: mine.data,
      allClaims,
      pendingCount: allClaims.filter((claim) => claim.status === "PENDING").length,
    };
  }, [user, isAdmin]);

  const { data, error, reload } = useAsync(load);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
          <p className="mt-1 text-muted-foreground">
            Submit expense claims for food, travel, medical and more.
          </p>
        </div>
        <SubmitClaimDialog onSubmitted={reload} />
      </div>

      {!data ? (
        <PageState error={error} />
      ) : isAdmin ? (
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">My Claims</TabsTrigger>
            <TabsTrigger value="team">
              Team Claims
              {data.pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1.5">
                  {data.pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="mine" className="mt-4">
            <ClaimHistoryTable claims={data.myClaims} />
          </TabsContent>
          <TabsContent value="team" className="mt-4">
            <ClaimApprovalTable claims={data.allClaims} onDecided={reload} />
          </TabsContent>
        </Tabs>
      ) : (
        <ClaimHistoryTable claims={data.myClaims} />
      )}
    </div>
  );
}
