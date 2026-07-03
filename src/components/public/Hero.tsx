import { motion } from "motion/react";
import { useAppData } from "@/context/AppDataContext";
import { useBookingModal } from "@/context/BookingModalContext";
import { Button } from "@/components/ui/primitives";
import { optimizedUrl } from "@/lib/cloudinary";

export function Hero() {
  const { settings } = useAppData();
  const { open } = useBookingModal();

  return (
    <section id="top" className="relative flex min-h-[94vh] items-center overflow-hidden bg-[#0F0F0F] pt-24">
      <div className="absolute inset-0">
        <img
          src={optimizedUrl(settings.hero_image_url, 2000)}
          alt="Lash artistry"
          className="h-full w-full object-cover opacity-80"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/60 to-[#0F0F0F]/10" />
        <div className="absolute inset-0 grain-overlay" />
      </div>

      {/* animated glow blobs */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#FF4FA0]/25 blur-[110px]"
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-[#FFC7DD]/15 blur-[110px]"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-xl"
        >
          <span className="mb-5 inline-block rounded-full border border-[#FF4FA0]/30 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#FFC7DD] backdrop-blur-sm">
            {settings.salon_name}
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] text-white sm:text-5xl md:text-6xl">
            Өдөр бүр <span className="text-gradient-pink italic">сайхан</span> сормуустай сэрээрэй.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#B8B8B8] sm:text-lg">
            Утсаар ярих шаардлагагүйгээр цагаа хэдхэн минутад онлайнаар захиалаарай.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button size="lg" className="glow-pink" onClick={() => open()}>
              Цаг захиалах
            </Button>
            <a
              href="#services"
              className="text-sm font-semibold text-white/90 underline decoration-[#FF4FA0] decoration-2 underline-offset-4 transition-colors hover:text-[#FF4FA0]"
            >
              Үйлчилгээг үзэх
            </a>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/60 sm:flex"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Доош гүйлгэх</span>
        <span className="h-8 w-[1.5px] animate-pulse bg-[#FF4FA0]/60" />
      </motion.div>
    </section>
  );
}
