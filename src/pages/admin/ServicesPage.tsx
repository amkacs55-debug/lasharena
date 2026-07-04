import { useEffect, useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import { saveService, deleteService } from "@/lib/db";
import { uid } from "@/lib/localStorageDb";
import { Card, Button, Input, Label, TextArea, Badge, EmptyState } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/Modal";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { formatDuration, formatMNT } from "@/lib/utils";
import type { Service } from "@/types";

const EMPTY: Omit<Service, "id" | "created_at"> = {
  title: "",
  description: "",
  price: 0,
  duration_minutes: null,
  image_url: "",
  is_active: true,
  sort_order: 0,
};

export function ServicesPage() {
  const { services, refreshServices } = useAppData();
  const [editing, setEditing] = useState<Service | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const openNew = () =>
    setEditing({
      ...EMPTY,
      id: uid(),
      created_at: new Date().toISOString(),
      sort_order: services.length,
    });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await deleteService(deleteTarget.id);
      setDeleteTarget(null);
      await refreshServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (s: Service) => {
    setError("");
    try {
      await saveService({ ...s, is_active: !s.is_active });
      await refreshServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">Services</h1>
          <p className="mt-1 text-sm text-[#B8B8B8]">Manage the treatments shown on your booking site</p>
        </div>
        <Button onClick={openNew} className="glow-pink">
          + New Service
        </Button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      {services.length === 0 ? (
        <EmptyState title="No services yet" subtitle="Create your first service to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} hover className="overflow-hidden">
              <div className="relative aspect-[16/10]">
                <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" />
                <Badge tone={s.is_active ? "success" : "neutral"} className="absolute left-3 top-3">
                  {s.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="p-5">
                <p className="font-display text-lg font-semibold text-white">{s.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-white/50">{s.description}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#FF4FA0]">{formatMNT(s.price)}</span>
                  <span className="text-white/40">{formatDuration(s.duration_minutes)}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(s)}>
                    {s.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(s)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ServiceFormModal
        service={editing === "new" ? null : editing}
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refreshServices();
        }}
      />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="max-w-sm">
        <div className="p-6 sm:p-8">
          <h3 className="font-display text-xl font-semibold text-white">Устгах уу?</h3>
          <p className="mt-2 text-sm text-white/60">
            "{deleteTarget?.title}" үйлчилгээг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Болих
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Устгаж байна…" : "Устгах"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ServiceFormModal({
  service,
  isOpen,
  onClose,
  onSaved,
}: {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Service>(
    () => service ?? { ...EMPTY, id: uid(), created_at: new Date().toISOString() }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(service ?? { ...EMPTY, id: uid(), created_at: new Date().toISOString() });
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, service]);

  if (!isOpen) return null;

  const update = (patch: Partial<Service>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveService(form);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={submit} className="p-6 sm:p-8">
        <h3 className="font-display text-xl font-semibold text-white">
          {service ? "Edit Service" : "New Service"}
        </h3>

        <div className="mt-5 space-y-4">
          <div>
            <Label>Image</Label>
            <ImageUploader value={form.image_url} onChange={(url) => update({ image_url: url })} />
          </div>
          <div>
            <Label>Title</Label>
            <Input required value={form.title} onChange={(e) => update({ title: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea
              rows={3}
              required
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (₮)</Label>
              <Input
                type="number"
                required
                min={0}
                value={form.price}
                onChange={(e) => update({ price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Duration (minutes, optional)</Label>
              <Input
                type="number"
                min={0}
                value={form.duration_minutes ?? ""}
                onChange={(e) => update({ duration_minutes: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update({ is_active: e.target.checked })}
              className="h-5 w-5 accent-[#FF4FA0]"
            />
            <span className="text-sm text-white">Active (visible on the booking site)</span>
          </label>
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-7 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? "Saving…" : "Save Service"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
