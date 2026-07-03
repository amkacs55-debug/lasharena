import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are provided (production),
 * the app talks to a real Supabase project (tables: services, gallery,
 * bookings, payments, settings, admins + RLS policies + edge functions for
 * QPay webhooks).
 *
 * When they are not provided (this sandbox/demo), `supabase` stays `null`
 * and `src/lib/db.ts` transparently falls back to a localStorage-backed
 * store that mirrors the exact same shape, so the whole product experience
 * (admin dashboard, booking flow, gallery, etc.) still works end-to-end.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = Boolean(supabase);
