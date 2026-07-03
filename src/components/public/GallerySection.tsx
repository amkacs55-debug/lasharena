import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import { SectionHeading, EmptyState } from "@/components/ui/primitives";
import { optimizedUrl } from "@/lib/cloudinary";
import { AnimatePresence } from "motion/react";

export function GallerySection() {
  const { gallery, loading } = useAppData();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const scrollLockRef = useRef(false);

  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    setLightboxIndex((prev) => {
      if (prev === null) return prev;
      return prev < gallery.length - 1 ? prev + 1 : prev;
    });
  };

  const goPrev = () => {
    setLightboxIndex((prev) => {
      if (prev === null) return prev;
      return prev > 0 ? prev - 1 : prev;
    });
  };

  // Wheel / trackpad scroll navigates to next / previous image
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (scrollLockRef.current) return;
      scrollLockRef.current = true;
      if (e.deltaY > 0) goNext();
      else if (e.deltaY < 0) goPrev();
      window.setTimeout(() => {
        scrollLockRef.current = false;
      }, 350);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") goNext();
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKey);
    };
  }, [lightboxIndex, gallery.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) goNext();
      else goPrev();
    }
    touchStartY.current = null;
  };

  return (
    <section id="gallery" className="section-pad bg-[#141014]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Бидний ажил"
          title="Бодит үр дүн, бодит гоо үзэсгэлэн"
          subtitle="Бидний хийсэн ажлуудаас түүвэр — сормуус бүрийг нарийвчлан, сэтгэл зүрхээрээ хийдэг."
        />

        {!loading && gallery.length === 0 && (
          <EmptyState title="Зурган цомог тун удахгүй" subtitle="Студи зургаа байршуулмагц энд харагдана." />
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((img, i) => (
            <motion.button
              key={img.id}
              onClick={() => setLightboxIndex(i)}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 8) * 0.05 }}
              className="group block aspect-square w-full overflow-hidden rounded-2xl"
            >
              <img
                src={optimizedUrl(img.image_url, 500)}
                alt="Lash gallery"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && gallery[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
              aria-label="Хаах"
            >
              ✕
            </button>

            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20 sm:left-6"
                aria-label="Өмнөх зураг"
              >
                ‹
              </button>
            )}

            {lightboxIndex < gallery.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20 sm:right-6"
                aria-label="Дараагийн зураг"
              >
                ›
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIndex}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                src={optimizedUrl(gallery[lightboxIndex].image_url, 1400)}
                alt="Lash gallery enlarged"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </AnimatePresence>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white/70">
              {lightboxIndex + 1} / {gallery.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
