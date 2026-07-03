import { useEffect, useMemo, useState } from "react";
import { listBookings, setBookingStatus, rescheduleBooking, getBookedTimesForDate, deleteBooking, updateBooking } from "@/lib/db";
import { useAppData } from "@/context/AppDataContext";
import { Card, Badge, Input, TextArea, Button, Spinner, EmptyState } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/Modal";
import { formatMNT, formatPrettyDate, buildSlotsForDate, nextNDays, toDateKey } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/types";

const STATUS_TONE: Record<BookingStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending_payment: "warning",
  confirmed: "success",
  completed: "neutral",
  cancelled: "danger",
};

const FILTERS: { label: string; value: BookingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending_payment" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export function BookingsPage() {
  const { settings } = useAppData();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);

  const refresh = () => listBookings().then(setBookings);
  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!bookings) return [];
    return bookings
      .filter((b) => {
        const matchesFilter = filter === "all" || b.status === filter;
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q || b.customer_name.toLowerCase().includes(q) || b.customer_phone.includes(q) || b.service_title.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [bookings, filter, search]);

  const act = async (id: string, status: BookingStatus) => {
    await setBookingStatus(id, status);
    refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBooking(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">Bookings</h1>
          <p className="mt-1 text-sm text-[#B8B8B8]">View, manage and reschedule customer bookings · newest first</p>
        </div>
        <Input
          placeholder="Search by name, phone or service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-72"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              filter === f.value
                ? "bg-gradient-to-r from-[#FF4FA0] to-[#d43c86] text-white"
                : "bg-white/[0.05] text-white/60 hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!bookings ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="text-[#FF4FA0]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No bookings found" subtitle="Try a different search or filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card key={b.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-base font-semibold text-white">{b.customer_name}</p>
                  <Badge tone={STATUS_TONE[b.status]}>{b.status.replace("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-white/60">
                  {b.service_title} · {formatMNT(b.service_price)}
                </p>
                <p className="text-sm text-white/40">
                  {formatPrettyDate(b.date)} at {b.time} · {b.customer_phone}
                </p>
                <p className="mt-0.5 text-xs text-[#FF4FA0]">Advance paid: {formatMNT(b.advance_amount)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditTarget(b)}>
                  Edit
                </Button>
                {b.status === "confirmed" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => act(b.id, "completed")}>
                      Mark Completed
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRescheduleTarget(b)}>
                      Reschedule
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => act(b.id, "cancelled")}>
                      Cancel
                    </Button>
                  </>
                )}
                {b.status === "pending_payment" && (
                  <Button size="sm" variant="danger" onClick={() => act(b.id, "cancelled")}>
                    Cancel
                  </Button>
                )}
                {(b.status === "completed" || b.status === "cancelled") && (
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(b)}>
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <RescheduleModal
        booking={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onDone={() => {
          setRescheduleTarget(null);
          refresh();
        }}
        settings={settings}
      />

      <DeleteConfirmModal
        booking={deleteTarget}
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <EditModal
        booking={editTarget}
        onClose={() => setEditTarget(null)}
        onDone={() => {
          setEditTarget(null);
          refresh();
        }}
      />
    </div>
  );
}

function EditModal({
  booking,
  onClose,
  onDone,
}: {
  booking: Booking | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [advance, setAdvance] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (booking) {
      setName(booking.customer_name);
      setPhone(booking.customer_phone);
      setAdvance(String(booking.advance_amount ?? 0));
      setNotes(booking.notes ?? "");
      setError("");
    }
  }, [booking]);

  if (!booking) return null;

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required.");
      return;
    }
    setSaving(true);
    try {
      await updateBooking({
        ...booking,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        advance_amount: Number(advance) || 0,
        notes: notes.trim() || undefined,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={!!booking} onClose={onClose} maxWidth="max-w-md">
      <div className="p-6 sm:p-8">
        <h3 className="font-display text-xl font-semibold text-white">Edit Booking</h3>
        <p className="mt-1 text-sm text-white/50">{booking.service_title}</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-white/50">Customer name</label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-white/50">Phone</label>
            <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-white/50">Advance paid (₮)</label>
            <Input
              className="mt-1"
              type="number"
              value={advance}
              onChange={(e) => setAdvance(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-white/50">Notes</label>
            <TextArea className="mt-1" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteConfirmModal({
  booking,
  loading,
  onClose,
  onConfirm,
}: {
  booking: Booking | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!booking) return null;
  return (
    <Modal isOpen={!!booking} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6 sm:p-8">
        <h3 className="font-display text-xl font-semibold text-white">Устгах уу?</h3>
        <p className="mt-2 text-sm text-white/60">
          {booking.customer_name} · {booking.service_title} захиалгыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
        </p>

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
            Болих
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? "Устгаж байна…" : "Устгах"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RescheduleModal({
  booking,
  onClose,
  onDone,
  settings,
}: {
  booking: Booking | null;
  onClose: () => void;
  onDone: () => void;
  settings: ReturnType<typeof useAppData>["settings"];
}) {
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [booked, setBooked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const days = nextNDays(21);

  useEffect(() => {
    if (booking) {
      setDate(booking.date);
      setTime(booking.time);
      setError("");
    }
  }, [booking]);

  useEffect(() => {
    if (date) getBookedTimesForDate(date).then(setBooked);
  }, [date]);

  if (!booking) return null;
  const slots = date ? buildSlotsForDate(date, settings.working_hours, settings.slot_interval_minutes, null) : [];
  const available = slots.filter((s) => !booked.includes(s) || s === booking.time);

  const submit = async () => {
    if (!date || !time) return;
    try {
      await rescheduleBooking(booking.id, date, time);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reschedule");
    }
  };

  return (
    <Modal isOpen={!!booking} onClose={onClose} maxWidth="max-w-md">
      <div className="p-6 sm:p-8">
        <h3 className="font-display text-xl font-semibold text-white">Reschedule Booking</h3>
        <p className="mt-1 text-sm text-white/50">{booking.customer_name} · {booking.service_title}</p>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {days.map((d) => {
            const key = toDateKey(d);
            return (
              <button
                key={key}
                onClick={() => setDate(key)}
                className={`rounded-xl border px-2 py-2 text-center text-xs ${
                  date === key ? "border-[#FF4FA0] bg-[#FF4FA0]/15 text-white" : "border-white/10 bg-white/[0.04] text-white/80"
                }`}
              >
                <p className="font-semibold">{d.getDate()}</p>
                <p className="text-[9px] text-white/40">{d.toLocaleDateString("en-US", { month: "short" })}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {available.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                time === t ? "border-[#FF4FA0] bg-[#FF4FA0]/15 text-white" : "border-white/10 bg-white/[0.04] text-white/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

