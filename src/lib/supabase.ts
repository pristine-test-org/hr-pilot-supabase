import { createClient, type PostgrestError } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill in the values printed by `supabase start`."
  );
}

export const supabase = createClient<Database>(url, key);

export type Profile = Tables<"profiles">;
export type LeaveRequest = Tables<"leave_requests">;
export type Claim = Tables<"claims">;
export type Payslip = Tables<"payslips">;
export type RequestStatus = Database["public"]["Enums"]["request_status"];
export type LeaveType = Database["public"]["Enums"]["leave_type"];
export type ClaimCategory = Database["public"]["Enums"]["claim_category"];

/** The employee fields shown next to team records (leave approvals, claims, payroll). */
export type Employee = Pick<Profile, "id" | "name" | "department" | "job_title">;
export const EMPLOYEE_COLUMNS = "id, name, department, job_title";

/** People sign in with their HR Pilot username; Supabase Auth knows them by this address. */
export const LOGIN_EMAIL_DOMAIN = "hrpilot.test";

export function loginEmail(username: string) {
  return `${username.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
}

/** Turns a PostgREST / Postgres error into a sentence for the user. */
export function describeError(error: PostgrestError | Error | null | undefined, fallback: string) {
  if (!error) return fallback;
  const code = "code" in error ? error.code : undefined;
  if (code === "23505") return "That email address is already in use.";
  if (code === "23514") return fallback;
  // Messages raised by our own SQL (triggers and RPCs) are written for people.
  if (code === "42501" || code === "22023" || code === "P0001" || code === "P0002") {
    return error.message;
  }
  return fallback;
}
