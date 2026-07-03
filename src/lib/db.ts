import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { localDb, uid } from "./localStorageDb";
import type { Booking, GalleryImage, Payment, Service, Settings } from "@/types";

/**
 * Unified data-access layer. Prefers real Supabase tables when configured,
 * falls back to the localStorage store otherwise. All UI code depends only
 * on this module, so swapping in a live Supabase project later requires no
 * component changes.
 */

// ---------- Settings ----------
export async function getSettings(): Promise<Settings> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from("settings").select("*").single();
    if (data) return data as Settings;
  }
  return localDb.getSettings();
}

export async function updateSettings(settings: Settings): Promise<Settings> {
  if (isSupabaseConfigured) {
    await supabase!.from("settings").upsert(settings);
  }
  localDb.setSettings(settings);
  return settings;
}

// ---------- Services ----------
export async function listServices(opts?: { activeOnly?: boolean }): Promise<Service[]> {
  if (isSupabaseConfigured) {
    let q = supabase!.from("services").select("*").order("sort_order");
    if (opts?.activeOnly) q = q.eq("is_active", true);
    const { data } = await q;
    if (data) return data as Service[];
  }
  const all = localDb.getServices().sort((a, b) => a.sort_order - b.sort_order);
  return opts?.activeOnly ? all.filter((s) => s.is_active) : all;
}

export async function saveService(service: Service): Promise<Service> {
  if (isSupabaseConfigured) {
    await supabase!.from("services").upsert(service);
  }
  const all = localDb.getServices();
  const idx = all.findIndex((s) => s.id === service.id);
  if (idx >= 0) all[idx] = service;
  else all.push(service);
  localDb.setServices(all);
  return service;
}

export async function deleteService(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase!.from("services").delete().eq("id", id);
  }
  localDb.setServices(localDb.getServices().filter((s) => s.id !== id));
}

// ---------- Gallery ----------
export async function listGallery(): Promise<GalleryImage[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from("gallery").select("*").order("sort_order");
    if (data) return data as GalleryImage[];
  }
  return localDb.getGallery().sort((a, b) => a.sort_order - b.sort_order);
}

export async function addGalleryImage(image: Omit<GalleryImage, "id" | "created_at">): Promise<GalleryImage> {
  const item: GalleryImage = { ...image, id: uid(), created_at: new Date().toISOString() };
  if (isSupabaseConfigured) {
    await supabase!.from("gallery").insert(item);
  }
  localDb.setGallery([...localDb.getGallery(), item]);
  return item;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase!.from("gallery").delete().eq("id", id);
  }
  localDb.setGallery(localDb.getGallery().filter((g) => g.id !== id));
}

export async function reorderGallery(images: GalleryImage[]): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase!.from("gallery").upsert(images);
  }
  localDb.setGallery(images);
}

// ---------- Bookings ----------
export async function listBookings(): Promise<Booking[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from("bookings").select("*").order("created_at", { ascending: false });
    if (data) return data as Booking[];
  }
  return [...localDb.getBookings()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getBookedTimesForDate(date: string): Promise<string[]> {
  const bookings = await listBookings();
  return bookings
    .filter((b) => b.date === date && b.status !== "cancelled")
    .map((b) => b.time);
}

export async function createPendingBooking(
  booking: Omit<Booking, "id" | "created_at" | "status">
): Promise<Booking> {
  // Re-check for clashes right before creating (prevents double booking).
  const existing = await getBookedTimesForDate(booking.date);
  if (existing.includes(booking.time)) {
    throw new Error("This time slot was just booked by someone else. Please pick another.");
  }
  const item: Booking = {
    ...booking,
    id: uid(),
    status: "pending_payment",
    created_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) {
    await supabase!.from("bookings").insert(item);
  }
  localDb.setBookings([...localDb.getBookings(), item]);
  return item;
}

export async function updateBooking(booking: Booking): Promise<Booking> {
  if (isSupabaseConfigured) {
    await supabase!.from("bookings").upsert(booking);
  }
  const all = localDb.getBookings();
  const idx = all.findIndex((b) => b.id === booking.id);
  if (idx >= 0) all[idx] = booking;
  localDb.setBookings(all);
  return booking;
}

export async function confirmBookingPaid(bookingId: string): Promise<Booking | null> {
  const all = localDb.getBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx === -1) return null;
  // Guard against double-confirmation causing duplicate slot allocation.
  all[idx] = { ...all[idx], status: "confirmed" };
  localDb.setBookings(all);
  if (isSupabaseConfigured) {
    await supabase!.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
  }
  return all[idx];
}

export async function setBookingStatus(bookingId: string, status: Booking["status"]): Promise<void> {
  const all = localDb.getBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], status };
    localDb.setBookings(all);
  }
  if (isSupabaseConfigured) {
    await supabase!.from("bookings").update({ status }).eq("id", bookingId);
  }
}

export async function rescheduleBooking(bookingId: string, date: string, time: string): Promise<void> {
  const clashes = await getBookedTimesForDate(date);
  if (clashes.includes(time)) throw new Error("That slot is already booked.");
  const all = localDb.getBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], date, time };
    localDb.setBookings(all);
  }
  if (isSupabaseConfigured) {
    await supabase!.from("bookings").update({ date, time }).eq("id", bookingId);
  }
}

export async function deleteBooking(bookingId: string): Promise<void> {
  const all = localDb.getBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx >= 0) {
    all.splice(idx, 1);
    localDb.setBookings(all);
  }
  if (isSupabaseConfigured) {
    await supabase!.from("bookings").delete().eq("id", bookingId);
  }
}

// ---------- Payments ----------
export async function createPayment(payment: Omit<Payment, "id" | "created_at">): Promise<Payment> {
  const item: Payment = { ...payment, id: uid(), created_at: new Date().toISOString() };
  if (isSupabaseConfigured) {
    await supabase!.from("payments").insert(item);
  }
  localDb.setPayments([...localDb.getPayments(), item]);
  return item;
}

export async function markPaymentPaid(invoiceId: string): Promise<Payment | null> {
  const all = localDb.getPayments();
  const idx = all.findIndex((p) => p.invoice_id === invoiceId);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], status: "paid", paid_at: new Date().toISOString() };
  localDb.setPayments(all);
  if (isSupabaseConfigured) {
    await supabase!.from("payments").update({ status: "paid" }).eq("invoice_id", invoiceId);
  }
  return all[idx];
}

export async function listPayments(): Promise<Payment[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from("payments").select("*");
    if (data) return data as Payment[];
  }
  return localDb.getPayments();
}
