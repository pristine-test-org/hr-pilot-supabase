// Proves the row level security rules through the real API (GoTrue sign-in + PostgREST), the same
// path the browser uses. Run against the local stack after `supabase db reset`:
//
//   bun run check:rls
//
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY from .env.local (bun loads it). It adds one
// leave request and one claim for ahmad.faiz (then decides them as admin); `supabase db reset`
// returns to the clean demo state.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example).");

type Client = SupabaseClient<Database>;
let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${!ok && detail !== undefined ? `  -> ${JSON.stringify(detail)}` : ""}`);
  if (!ok) failures++;
}

async function signIn(username: string, password: string): Promise<{ client: Client; id: string }> {
  const client = createClient<Database>(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email: `${username}@hrpilot.test`, password });
  if (error || !data.user) throw new Error(`Sign-in failed for ${username}: ${error?.message}`);
  return { client, id: data.user.id };
}

const anon = createClient<Database>(url, key, { auth: { persistSession: false } });
const admin = await signIn("admin", "admin");
const ahmad = await signIn("ahmad.faiz", "password123");

const { data: weiJian } = await admin.client.from("profiles").select("id").eq("username", "wei.jian").single();
const otherId = weiJian!.id;

console.log("\n-- Signed out (anon key only)");
{
  const { data, error } = await anon.from("payslips").select("id");
  check("cannot read payslips", !!error || data?.length === 0, { error: error?.message, rows: data?.length });
  const profiles = await anon.from("profiles").select("id");
  check("cannot read profiles", !!profiles.error || profiles.data?.length === 0, profiles.error?.message);
}

console.log("\n-- Signed in as ahmad.faiz (EMPLOYEE)");
{
  const own = await ahmad.client.from("payslips").select("user_id");
  check(
    "sees only their own payslips (4)",
    !own.error && own.data.length === 4 && own.data.every((row) => row.user_id === ahmad.id),
    own.data?.length
  );

  const others = await ahmad.client.from("payslips").select("id").eq("user_id", otherId);
  check("cannot read wei.jian's payslips", !others.error && others.data.length === 0, others.data?.length);

  const profiles = await ahmad.client.from("profiles").select("id");
  check("sees only their own profile", profiles.data?.length === 1 && profiles.data[0].id === ahmad.id, profiles.data?.length);

  const leaves = await ahmad.client.from("leave_requests").select("user_id");
  check("sees only their own leave requests", !!leaves.data?.length && leaves.data.every((r) => r.user_id === ahmad.id));

  const claims = await ahmad.client.from("claims").select("user_id");
  check("sees only their own claims", !!claims.data?.length && claims.data.every((r) => r.user_id === ahmad.id));

  // Insert trying to cheat: someone else's user_id, pre-approved, wrong day count.
  const inserted = await ahmad.client
    .from("leave_requests")
    .insert({
      user_id: otherId,
      type: "ANNUAL",
      start_date: "2026-12-01",
      end_date: "2026-12-03",
      days: 99,
      reason: "RLS check",
      status: "APPROVED",
      decided_by_id: ahmad.id,
    })
    .select()
    .single();
  check(
    "insert is forced to self, PENDING, undecided, 3 days",
    !inserted.error &&
      inserted.data.user_id === ahmad.id &&
      inserted.data.status === "PENDING" &&
      inserted.data.decided_by_id === null &&
      Number(inserted.data.days) === 3,
    inserted.error?.message ?? inserted.data
  );
  const leaveId = inserted.data!.id;

  const badDates = await ahmad.client
    .from("leave_requests")
    .insert({ type: "SICK", start_date: "2026-12-05", end_date: "2026-12-01", reason: "Backwards dates" })
    .select();
  check("end date before start date is refused", !!badDates.error, badDates.data);

  const rpc = await ahmad.client.rpc("decide_leave_request", { request_id: leaveId, decision: "APPROVED" });
  check("cannot approve own leave via decide_leave_request()", rpc.error?.message === "Admin access required.", rpc.error?.message);

  const direct = await ahmad.client.from("leave_requests").update({ status: "APPROVED" }).eq("id", leaveId).select();
  check("cannot approve own leave with a direct UPDATE", !!direct.error, direct.data);

  const stillPending = await ahmad.client.from("leave_requests").select("status").eq("id", leaveId).single();
  check("the leave is still PENDING", stillPending.data?.status === "PENDING", stillPending.data);

  const claim = await ahmad.client
    .from("claims")
    .insert({ category: "TRAVEL", amount: 42.5, date: "2026-09-20", description: "RLS check claim" })
    .select()
    .single();
  check("can submit a claim (PENDING)", !claim.error && claim.data.status === "PENDING", claim.error?.message);
  const claimId = claim.data!.id;

  const claimRpc = await ahmad.client.rpc("decide_claim", { claim_id: claimId, decision: "APPROVED" });
  check("cannot approve own claim via decide_claim()", claimRpc.error?.message === "Admin access required.", claimRpc.error?.message);

  const promote = await ahmad.client.from("profiles").update({ role: "ADMIN" }).eq("id", ahmad.id).select();
  check("cannot set own role to ADMIN", promote.error?.message === "Only HR can change work information.", promote.error?.message ?? promote.data);

  const entitlement = await ahmad.client.from("profiles").update({ annual_leave_days: 99 }).eq("id", ahmad.id).select();
  check("cannot raise own leave entitlement", !!entitlement.error, entitlement.data);

  const role = await ahmad.client.from("profiles").select("role").eq("id", ahmad.id).single();
  check("role is still EMPLOYEE", role.data?.role === "EMPLOYEE", role.data);

  const otherProfile = await ahmad.client.from("profiles").update({ name: "Hacked" }).eq("id", otherId).select();
  check("cannot edit another employee's profile", !otherProfile.error && otherProfile.data.length === 0, otherProfile.data);

  const rename = await ahmad.client.from("profiles").update({ name: "Ahmad Faiz Rahman" }).eq("id", ahmad.id).select().single();
  check("can update own name (Settings)", !rename.error && rename.data.name === "Ahmad Faiz Rahman", rename.error?.message);

  console.log("\n-- Signed in as admin (ADMIN)");

  const all = await admin.client.from("payslips").select("id", { count: "exact", head: true });
  check("reads every payslip (80)", all.count === 80, all.count);

  const wj = await admin.client.from("payslips").select("id").eq("user_id", otherId);
  check("reads wei.jian's payslips (4)", wj.data?.length === 4, wj.data?.length);

  const everyone = await admin.client.from("profiles").select("id", { count: "exact", head: true });
  check("reads every profile (21)", everyone.count === 21, everyone.count);

  const approve = await admin.client.rpc("decide_leave_request", { request_id: leaveId, decision: "APPROVED" });
  check(
    "approves ahmad.faiz's leave; decided_by is the admin",
    !approve.error && approve.data.status === "APPROVED" && approve.data.decided_by_id === admin.id,
    approve.error?.message ?? approve.data
  );

  const reject = await admin.client.rpc("decide_claim", { claim_id: claimId, decision: "REJECTED" });
  check("rejects ahmad.faiz's claim", !reject.error && reject.data.status === "REJECTED", reject.error?.message);

  const invalid = await admin.client.rpc("decide_claim", { claim_id: claimId, decision: "PENDING" });
  check("a decision must be APPROVED or REJECTED", invalid.error?.message === "Invalid status.", invalid.error?.message);

  const adminDirect = await admin.client.from("leave_requests").update({ status: "REJECTED" }).eq("id", leaveId).select();
  check("even admins cannot bypass the RPC with a direct UPDATE", !!adminDirect.error, adminDirect.data);

  const promoteByAdmin = await admin.client.from("profiles").update({ role: "ADMIN" }).eq("id", ahmad.id).select().single();
  check("admin can change an employee's role", !promoteByAdmin.error && promoteByAdmin.data.role === "ADMIN", promoteByAdmin.error?.message);
  const demote = await admin.client.from("profiles").update({ role: "EMPLOYEE" }).eq("id", ahmad.id).select().single();
  check("admin can change it back", !demote.error && demote.data.role === "EMPLOYEE", demote.error?.message);

  const seenByAhmad = await ahmad.client.from("leave_requests").select("status").eq("id", leaveId).single();
  check("ahmad.faiz sees the admin's decision", seenByAhmad.data?.status === "APPROVED", seenByAhmad.data);
}

console.log(failures === 0 ? "\nAll RLS checks passed." : `\n${failures} RLS check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
