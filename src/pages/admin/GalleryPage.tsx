import { useRef, useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import { addGalleryImage, deleteGalleryImage, reorderGallery } from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";
import { Button, Card, EmptyState, Spinner } from "@/components/ui/primitives";

export function GalleryPage() {
  const { gallery, refreshGallery } = useAppData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const { url, publicId } = await uploadImage(file);
        await addGalleryImage({ image_url: url, public_id: publicId, sort_order: gallery.length });
      }
      await refreshGallery();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this photo?")) return;
    await deleteGalleryImage(id);
    refreshGallery();
  };

  const onDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const items = [...gallery];
    const [moved] = items.splice(dragIndex, 1);
    items.splice(index, 0, moved);
    const reordered = items.map((it, i) => ({ ...it, sort_order: i }));
    await reorderGallery(reordered);
    await refreshGallery();
    setDragIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">Gallery</h1>
          <p className="mt-1 text-sm text-[#B8B8B8]">Upload unlimited photos. Drag to reorder.</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} disabled={uploading} className="glow-pink">
          {uploading ? <Spinner /> : "+ Upload Photos"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      {gallery.length === 0 ? (
        <EmptyState title="No photos yet" subtitle="Upload your first gallery photo to showcase your work." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((img, i) => (
            <Card
              key={img.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e: React.DragEvent) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className="group relative cursor-move overflow-hidden"
            >
              <div className="aspect-square">
                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
              </div>
              <button
                onClick={() => remove(img.id)}
                aria-label="Delete photo"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              >
                ✕
              </button>
              <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                #{i + 1}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
