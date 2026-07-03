/**
 * Cloudinary integration.
 *
 * In production, set VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET
 * (an unsigned upload preset) and every image uploaded from the Admin
 * Dashboard (services, gallery, address photo, logo) is stored on Cloudinary
 * at full quality, with `f_auto,q_auto` + responsive width transformations
 * used for delivery (no visible quality loss, fast loading, automatic
 * responsive sizing).
 *
 * Without those env vars configured (this sandbox), uploads are converted to
 * a local data URL so the whole admin experience keeps working end-to-end.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

export interface UploadResult {
  url: string;
  publicId: string | null;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!isCloudinaryConfigured) {
    const url = await fileToDataUrl(file);
    return { url, publicId: null };
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET as string);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );

  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return { url: data.secure_url as string, publicId: data.public_id as string };
}

/**
 * Build an optimized, responsive Cloudinary delivery URL:
 * automatic format + automatic quality + width-capped resize, keeping
 * visual quality intact while shrinking payload size for the given viewport.
 * Falls back to the original URL for non-Cloudinary sources (e.g. seed
 * images, or local data URLs in demo mode).
 */
export function optimizedUrl(url: string, width?: number): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  const transform = width
    ? `f_auto,q_auto,dpr_auto,c_limit,w_${width}`
    : `f_auto,q_auto,dpr_auto`;
  return url.replace("/upload/", `/upload/${transform}/`);
}
