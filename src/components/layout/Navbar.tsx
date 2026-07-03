import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppData } from "@/context/AppDataContext";
import { useBookingModal } from "@/context/BookingModalContext";
import { Button } from "@/components/ui/primitives";

const LINKS = [
  { href: "#services", label: "Үйлчилгээ" },
  { href: "#gallery", label: "Зурган цомог" },
  { href: "#contact", label: "Холбоо барих" },
];

const NAVBAR_OFFSET = 84;

function scrollToSection(hash: string) {
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

export function Navbar() {
  const { settings } = useAppData();
  const { open } = useBookingModal();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-nav shadow-lg shadow-black/30" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="flex items-center gap-2">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.salon_name} className="h-9 w-9 rounded-full object-cover ring-2 ring-[#FF4FA0]/40" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FF4FA0] to-[#d43c86] font-display text-sm text-white">
              {settings.salon_name.charAt(0)}
            </span>
          )}
          <span className="font-display text-lg font-semibold tracking-wide text-white">
            {settings.salon_name}
          </span>
        </a>

        <div className="hidden items-center gap-10 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(link.href);
              }}
              className="text-sm font-medium tracking-wide text-white/75 transition-colors hover:text-[#FF4FA0]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" className="hidden sm:inline-flex" onClick={() => open()}>
            Цаг захиалах
          </Button>
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 md:hidden"
          >
            <div className="space-y-1.5">
              <span className={`block h-[1.5px] w-5 bg-white transition-transform ${mobileOpen ? "translate-y-[3px] rotate-45" : ""}`} />
              <span className={`block h-[1.5px] w-5 bg-white transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block h-[1.5px] w-5 bg-white transition-transform ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </div>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-nav overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 pb-5">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileOpen(false);
                    window.setTimeout(() => scrollToSection(link.href), 320);
                  }}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-white hover:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() => {
                  setMobileOpen(false);
                  open();
                }}
              >
                Цаг захиалах
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
