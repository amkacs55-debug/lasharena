import { useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import { updateSettings } from "@/lib/db";
import { Card, Button, Input, Label, TextArea } from "@/components/ui/primitives";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { dayLabel } from "@/lib/utils";
import type { Settings } from "@/types";

export function SettingsPage() {
  const { settings, refreshSettings } = useAppData();
  const [form, setForm] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (patch: Partial<Settings>) => setForm((f) => ({ ...f, ...patch }));

  const updateHour = (day: number, patch: Partial<Settings["working_hours"][number]>) => {
    setForm((f) => ({
      ...f,
      working_hours: f.working_hours.map((wh) => (wh.day === day ? { ...wh, ...patch } : wh)),
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateSettings(form);
      await refreshSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-[#B8B8B8]">Everything here controls the public booking site</p>
        </div>
        <Button type="submit" disabled={saving} className="glow-pink">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </Button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      <Card className="space-y-5 p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-white">Salon Identity</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label>Salon Name</Label>
            <Input value={form.salon_name} onChange={(e) => update({ salon_name: e.target.value })} />
          </div>
          <div>
            <Label>Logo</Label>
            <ImageUploader
              value={form.logo_url}
              onChange={(url) => update({ logo_url: url })}
              aspect="aspect-square"
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-5 p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-white">Contact & Location</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label>Address</Label>
            <TextArea rows={2} value={form.address} onChange={(e) => update({ address: e.target.value })} />
            <div className="mt-4">
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
            </div>
            <div className="mt-4">
              <Label>Facebook Link</Label>
              <Input value={form.facebook_url} onChange={(e) => update({ facebook_url: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Address / Location Photo</Label>
            <ImageUploader value={form.address_image_url} onChange={(url) => update({ address_image_url: url })} />
          </div>
        </div>
      </Card>

      <Card className="space-y-5 p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-white">Hero Banner</h2>
        <ImageUploader
          value={form.hero_image_url}
          onChange={(url) => update({ hero_image_url: url })}
          aspect="aspect-[21/9]"
          label="Upload hero banner image"
        />
      </Card>

      <Card className="space-y-4 p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-white">Working Hours</h2>
        <div className="space-y-2">
          {form.working_hours.map((wh) => (
            <div key={wh.day} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
              <span className="text-sm font-medium text-white">{dayLabel(wh.day)}</span>
              <Input
                type="time"
                disabled={wh.closed}
                value={wh.open}
                onChange={(e) => updateHour(wh.day, { open: e.target.value })}
                className="w-28"
              />
              <Input
                type="time"
                disabled={wh.closed}
                value={wh.close}
                onChange={(e) => updateHour(wh.day, { close: e.target.value })}
                className="w-28"
              />
              <label className="flex items-center gap-1.5 text-xs text-white/60">
                <input
                  type="checkbox"
                  checked={wh.closed}
                  onChange={(e) => updateHour(wh.day, { closed: e.target.checked })}
                  className="accent-[#FF4FA0]"
                />
                Closed
              </label>
            </div>
          ))}
        </div>
        <div>
          <Label>Slot Interval (minutes)</Label>
          <Input
            type="number"
            min={15}
            step={15}
            value={form.slot_interval_minutes}
            onChange={(e) => update({ slot_interval_minutes: Number(e.target.value) })}
            className="w-32"
          />
        </div>
      </Card>

      <Card className="space-y-5 p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-white">Advance Payment &amp; QPay</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label>Advance Amount (₮)</Label>
            <Input
              type="number"
              value={form.advance_amount}
              onChange={(e) => update({ advance_amount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>QPay Invoice Code</Label>
            <Input value={form.qpay_invoice_code} onChange={(e) => update({ qpay_invoice_code: e.target.value })} />
          </div>
          <div>
            <Label>QPay Client ID</Label>
            <Input value={form.qpay_client_id} onChange={(e) => update({ qpay_client_id: e.target.value })} />
          </div>
          <div>
            <Label>QPay Client Secret</Label>
            <Input
              type="password"
              value={form.qpay_client_secret}
              onChange={(e) => update({ qpay_client_secret: e.target.value })}
            />
          </div>
        </div>
        <p className="text-xs text-white/40">
          QPay credentials are used by your backend/edge function to create invoices &amp; verify webhook
          payments securely. Configure the proxy endpoint via the VITE_QPAY_PROXY_URL environment variable.
        </p>
      </Card>
    </form>
  );
}

