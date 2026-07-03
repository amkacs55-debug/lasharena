import type { WorkingHours } from "@/types";

export function formatMNT(amount: number): string {
  return `${amount.toLocaleString("en-US")}₮`;
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ц ${m} мин` : `${h} ц`;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatPrettyDate(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("mn-MN", { weekday: "short", month: "short", day: "numeric" });
}

const DAY_LABELS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
export const dayLabel = (day: number) => DAY_LABELS[day];

/** Builds available HH:mm slots for a given date based on working hours + interval. */
export function buildSlotsForDate(
  dateKey: string,
  workingHours: WorkingHours[],
  intervalMinutes: number,
  serviceDurationMinutes: number | null
): string[] {
  const date = new Date(`${dateKey}T00:00:00`);
  const dow = date.getDay();
  const hours = workingHours.find((w) => w.day === dow);
  if (!hours || hours.closed) return [];

  const duration = serviceDurationMinutes || intervalMinutes;
  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);

  const slots: string[] = [];
  let cursor = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const now = new Date();
  const isToday = toDateKey(now) === dateKey;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  while (cursor + duration <= closeMinutes) {
    if (!isToday || cursor > nowMinutes + 30) {
      const h = Math.floor(cursor / 60)
        .toString()
        .padStart(2, "0");
      const m = (cursor % 60).toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
    cursor += intervalMinutes;
  }
  return slots;
}

export function nextNDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export function isValidMongolianPhone(phone: string): boolean {
  return /^[6-9]\d{7}$/.test(phone.replace(/\s/g, ""));
}
