import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { localDb } from "./localStorageDb";

const SESSION_KEY = "lumiere-lash:admin-session";

export interface AdminSession {
  email: string;
  name: string;
}

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error(error?.message || "Invalid credentials");
    const session: AdminSession = { email, name: email.split("@")[0] };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  const admin = localDb.getAdmins().find((a) => a.email === email && a.password === password);
  if (!admin) throw new Error("Invalid email or password");
  const session: AdminSession = { email: admin.email, name: admin.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function logoutAdmin(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase!.auth.signOut();
  }
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentSession(): AdminSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}
