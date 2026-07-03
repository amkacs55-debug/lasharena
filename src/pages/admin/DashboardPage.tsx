import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { listBookings } from "@/lib/db";
import { useAppData } from "@/context/AppDataContext";
import { Card, Badge, Spinner, EmptyState } from "@/components/ui/primitives";
import { formatMNT, formatPrettyDate, toDateKey } from "@/lib/utils";
import type { Booking } from "@/types";

const STATUS_TONE: Record<Booking["status"], "neutral" | "success" | "warning" | "danger"> = {
  pending_payment: "warning",
  confirmed: "success",
  completed: "neutral",
  cancelled: "danger",
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-6" hover>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#FF4FA0]">{sub}</p>}
    </Card>
  );
}

function RevenueChart({ bookings }: { bookings: Booking[] }) {
  const data = useMemo(() => {
    const past7 = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      const key = toDateKey(d);
      const total = bookings
        .filter((b) => b.date === key && b.status !== "cancelled" && b.status !== "pending_payment")
        .reduce((sum, b) => sum + b.advance_amount, 0);
      return { key, d, total };
    });
    return past7;
  }, [bookings]);
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex h-48 items-end gap-3 px-1">
      {data.map((d, i) => (
        <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((d.total / max) * 100, 4)}%` }}
            transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
            className="flex w-full items-end rounded-t-lg bg-gradient-to-t from-[#FF4FA0] to-[#FFC7DD]"
            style={{ height: `${Math.max((d.total / max) * 100, 4)}%` }}
            title={formatMNT(d.total)}
          />
          <span className="text-[10px] text-white/40">{d.d.toLocaleDateString("en-US", { weekday: "short" })}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { services } = useAppData();
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    listBookings().then(setBookings);
  }, []);

  const today = toDateKey(new Date());

  const stats = useMemo(() => {
    if (!bookings) return null;
    const confirmed = bookings.filter((b) => b.status !== "cancelled" && b.status !== "pending_payment");
    const todays = confirmed.filter((b) => b.date === today);
    const upcoming = confirmed
      .filter((b) => b.date >= today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const recent = [...bookings].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);
    const revenue = bookings
      .filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + b.advance_amount, 0);
    const completedRevenue = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + b.service_price, 0);
    return { todays, upcoming: upcoming.slice(0, 8), recent, revenue, completedRevenue, totalActive: confirmed.length };
  }, [bookings, today]);

  if (!bookings || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="text-[#FF4FA0]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-[#B8B8B8]">Overview of your studio's activity</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Today's Bookings" value={String(stats.todays.length)} />
        <StatCard label="Active Bookings" value={String(stats.totalActive)} />
        <StatCard label="Advance Revenue" value={formatMNT(stats.revenue)} />
        <StatCard label="Services Live" value={String(services.filter((s) => s.is_active).length)} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Revenue — Last 7 Days</h2>
          <span className="text-xs text-white/40">Advance payments received</span>
        </div>
        <div className="mt-6">
          <RevenueChart bookings={bookings} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-white">Today's Bookings</h2>
          <div className="mt-4 space-y-3">
            {stats.todays.length === 0 && <EmptyState title="No bookings today" />}
            {stats.todays.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">{b.customer_name}</p>
                  <p className="text-xs text-white/40">
                    {b.service_title} · {b.time}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[b.status]}>{b.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-white">Upcoming Bookings</h2>
          <div className="mt-4 space-y-3">
            {stats.upcoming.length === 0 && <EmptyState title="Nothing upcoming" />}
            {stats.upcoming.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">{b.customer_name}</p>
                  <p className="text-xs text-white/40">
                    {formatPrettyDate(b.date)} · {b.time} · {b.service_title}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[b.status]}>{b.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-white">Recent Bookings</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Service</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((b) => (
                <tr key={b.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 font-medium text-white">{b.customer_name}</td>
                  <td className="py-3 text-white/60">{b.service_title}</td>
                  <td className="py-3 text-white/60">
                    {formatPrettyDate(b.date)} · {b.time}
                  </td>
                  <td className="py-3">
                    <Badge tone={STATUS_TONE[b.status]}>{b.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-white/30">
                    No bookings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
