import { createContext, useContext } from "react";
import { supabase, type Profile } from "@/lib/supabase";

export type AuthState = {
  /** The signed-in user's profile row; null when signed out. */
  profile: Profile | null;
  /** True until the stored Supabase session (if any) has been checked. */
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}

/** For pages under the dashboard layout, which only renders once a profile is loaded. */
export function useCurrentUser() {
  const { profile } = useAuth();
  if (!profile) throw new Error("useCurrentUser must be used inside the dashboard.");
  return profile;
}
