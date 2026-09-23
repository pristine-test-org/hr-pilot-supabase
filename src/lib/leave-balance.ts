import { supabase, type LeaveRequest, type Profile } from "@/lib/supabase";

export type LeaveBalance = {
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
};

/** Balance = entitlement minus the days of APPROVED requests of that type. */
export function getLeaveBalance(
  profile: Pick<Profile, "annual_leave_days" | "sick_leave_days">,
  approved: Pick<LeaveRequest, "type" | "days">[]
): LeaveBalance {
  const usedAnnual = approved
    .filter((leave) => leave.type === "ANNUAL")
    .reduce((sum, leave) => sum + Number(leave.days), 0);
  const usedSick = approved
    .filter((leave) => leave.type === "SICK")
    .reduce((sum, leave) => sum + Number(leave.days), 0);

  return {
    annual: {
      total: profile.annual_leave_days,
      used: usedAnnual,
      remaining: Math.max(profile.annual_leave_days - usedAnnual, 0),
    },
    sick: {
      total: profile.sick_leave_days,
      used: usedSick,
      remaining: Math.max(profile.sick_leave_days - usedSick, 0),
    },
  };
}

export async function fetchLeaveBalance(profile: Profile) {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("type, days")
    .eq("user_id", profile.id)
    .eq("status", "APPROVED");
  if (error) throw error;
  return getLeaveBalance(profile, data);
}
