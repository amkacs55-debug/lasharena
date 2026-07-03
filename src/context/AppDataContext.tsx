import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { GalleryImage, Service, Settings } from "@/types";
import { getSettings, listGallery, listServices } from "@/lib/db";
import { localDb } from "@/lib/localStorageDb";

interface AppDataContextValue {
  settings: Settings;
  services: Service[];
  gallery: GalleryImage[];
  loading: boolean;
  refreshSettings: () => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshGallery: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => localDb.getSettings());
  const [services, setServices] = useState<Service[]>(() => localDb.getServices());
  const [gallery, setGallery] = useState<GalleryImage[]>(() => localDb.getGallery());
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => setSettings(await getSettings()), []);
  const refreshServices = useCallback(async () => setServices(await listServices()), []);
  const refreshGallery = useCallback(async () => setGallery(await listGallery()), []);

  useEffect(() => {
    Promise.all([refreshSettings(), refreshServices(), refreshGallery()]).finally(() =>
      setLoading(false)
    );
  }, [refreshSettings, refreshServices, refreshGallery]);

  const value = useMemo(
    () => ({ settings, services, gallery, loading, refreshSettings, refreshServices, refreshGallery }),
    [settings, services, gallery, loading, refreshSettings, refreshServices, refreshGallery]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
