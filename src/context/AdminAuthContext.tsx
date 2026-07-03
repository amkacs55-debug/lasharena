import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentSession, loginAdmin, logoutAdmin, type AdminSession } from "@/lib/auth";

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
    setSession(getCurrentSession());
    setLoading(false);
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
