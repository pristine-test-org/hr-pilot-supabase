import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, fetchProfile } from "@/lib/auth";
import { loginEmail, supabase, type Profile } from "@/lib/supabase";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function sync(userId: string | null) {
      const next = userId ? await fetchProfile(userId).catch(() => null) : null;
      if (!active) return;
      setProfile(next);
      setLoading(false);
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      // Supabase warns against awaiting its own calls inside this callback; defer the fetch.
      setTimeout(() => sync(session?.user.id ?? null), 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail(username),
      password,
    });
    if (error || !data.user) {
      return {
        error: error?.code === "invalid_credentials" || error?.status === 400
          ? "Invalid username or password."
          : "Unable to log in.",
      };
    }
    const next = await fetchProfile(data.user.id).catch(() => null);
    if (!next) {
      await supabase.auth.signOut();
      return { error: "This account has no HR Pilot profile. Please contact HR." };
    }
    setProfile(next);
    setLoading(false);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) setProfile(await fetchProfile(data.user.id));
  }, []);

  const value = useMemo(
    () => ({ profile, loading, signIn, signOut, refreshProfile }),
    [profile, loading, signIn, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
