import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  /** True when current session has cleared the TOTP step. */
  totpVerified: boolean;
  setTotpVerified: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

const TOTP_SESSION_KEY = "totp_verified_uid";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [totpVerified, setTotpVerifiedState] = useState(false);

  useEffect(() => {
  // 1. Verificar sesión inicial
  supabase.auth.getSession().then(({ data: { session } }) => {
    const u = session?.user ?? null;
    setUser(u);
    if (u) {
      const stored = sessionStorage.getItem(TOTP_SESSION_KEY);
      setTotpVerifiedState(stored === u.id); // Supabase usa .id, no .uid
    }
    setLoading(false);
  });

  // 2. Escuchar cambios de estado (login/logout)
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    const u = session?.user ?? null;
    setUser(u);
    if (u) {
      const stored = sessionStorage.getItem(TOTP_SESSION_KEY);
      setTotpVerifiedState(stored === u.id);
    } else {
      setTotpVerifiedState(false);
      sessionStorage.removeItem(TOTP_SESSION_KEY);
    }
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);

  const setTotpVerified = (v: boolean) => {
    setTotpVerifiedState(v);
    if (v && user) sessionStorage.setItem(TOTP_SESSION_KEY, user.id); 
    else sessionStorage.removeItem(TOTP_SESSION_KEY);
  };

  const signOut = async () => {
    sessionStorage.removeItem(TOTP_SESSION_KEY);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, totpVerified, setTotpVerified, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
