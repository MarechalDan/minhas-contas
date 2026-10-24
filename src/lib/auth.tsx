import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "../types";

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  recovering: boolean;
  setRecovering: (v: boolean) => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (p: Partial<Pick<Profile, "name" | "work_type">>) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", s.user.id).maybeSingle();
    setProfile((data as Profile | null) ?? null);
    if (data && !data.blocked) {
      supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", s.user.id).then(() => {});
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(s);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => loadProfile(s), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(session), [loadProfile, session]);

  const updateProfile = useCallback(
    async (p: Partial<Pick<Profile, "name" | "work_type">>) => {
      if (!session) return "Sem sessão";
      const { data, error } = await supabase.from("profiles").update(p).eq("id", session.user.id).select().single();
      if (error) return error.message;
      setProfile(data as Profile);
      return null;
    },
    [session],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, recovering, setRecovering, refreshProfile, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
