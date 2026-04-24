import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const stored = sessionStorage.getItem(TOTP_SESSION_KEY);
        setTotpVerifiedState(stored === u.uid);
      } else {
        setTotpVerifiedState(false);
        sessionStorage.removeItem(TOTP_SESSION_KEY);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const setTotpVerified = (v: boolean) => {
    setTotpVerifiedState(v);
    if (v && user) sessionStorage.setItem(TOTP_SESSION_KEY, user.uid);
    else sessionStorage.removeItem(TOTP_SESSION_KEY);
  };

  const signOut = async () => {
    sessionStorage.removeItem(TOTP_SESSION_KEY);
    await fbSignOut(auth);
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
