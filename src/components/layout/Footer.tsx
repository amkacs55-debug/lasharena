import { useAppData } from "@/context/AppDataContext";

export function Footer() {
  const { settings } = useAppData();
  return (
    <footer className="border-t border-white/10 bg-[#0F0F0F] py-12 text-[#B8B8B8]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="font-display text-xl text-white">{settings.salon_name}</p>
            <p className="mt-2 max-w-sm text-sm">{settings.address}</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm md:items-end">
            <a href={`tel:${settings.phone}`} className="transition-colors hover:text-[#FF4FA0]">
              {settings.phone}
            </a>
            <a
              href={settings.facebook_url}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[#FF4FA0]"
            >
              Facebook
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} {settings.salon_name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
