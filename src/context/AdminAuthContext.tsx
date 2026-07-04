import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentSession, loginAdmin, logoutAdmin, type AdminSession } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

interface AdminAuthContextValue {
  session: AdminSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (isSupabaseConfigured) {
        // Trust the real Supabase auth session, not just the localStorage flag —
        // if the Supabase session expired/failed to refresh, treat the admin as logged out
        // so we don't silently send unauthenticated (anon) requests that RLS will reject.
        const { data } = await supabase!.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          const local = getCurrentSession();
          setSession(local ?? { email: data.session.user.email ?? "", name: (data.session.user.email ?? "").split("@")[0] });
        } else {
          setSession(null);
          localStorage.removeItem("lumiere-lash:admin-session");
        }
      } else {
        setSession(getCurrentSession());
      }
      setLoading(false);
    }

    init();

    if (isSupabaseConfigured) {
      const { data: listener } = supabase!.auth.onAuthStateChange((_event, newSession) => {
        if (!newSession) {
          setSession(null);
          localStorage.removeItem("lumiere-lash:admin-session");
        }
      });
      return () => {
        cancelled = true;
        listener.subscription.unsubscribe();
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const s = await loginAdmin(email, password);
    setSession(s);
  };

  const logout = async () => {
    await logoutAdmin();
    setSession(null);
  };

  return (
    <AdminAuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
