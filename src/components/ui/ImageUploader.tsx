import { useRef, useState } from "react";
import { uploadImage } from "@/lib/cloudinary";
import { Spinner } from "./primitives";
import { cn } from "@/utils/cn";

export function ImageUploader({
  value,
  onChange,
  label = "Upload image",
  aspect = "aspect-[4/3]",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          aspect,
          "group relative w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] transition-colors hover:border-[#FF4FA0]"
        )}
      >
        {value ? (
          <img src={value} alt="preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/30">
            <span className="text-2xl">📷</span>
            <span className="text-xs font-medium">{label}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {loading ? (
            <Spinner className="text-white" />
          ) : (
            <span className="text-xs font-semibold text-white">Change image</span>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
