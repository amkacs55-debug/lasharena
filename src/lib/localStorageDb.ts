import type {
  Admin,
  Booking,
  GalleryImage,
  Payment,
  Service,
  Settings,
} from "@/types";

/**
 * Lightweight localStorage-backed persistence layer that mimics a real
 * database (same shape as the Supabase tables described in the spec:
 * services, gallery, bookings, payments, settings, admins).
 *
 * `src/lib/db.ts` prefers a real Supabase connection when configured and
 * transparently falls back to this store otherwise, so the product works
 * fully offline/in-demo while remaining a drop-in swap for production.
 */

const NS = "lumiere-lash";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${NS}:${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
}

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

const DEFAULT_SETTINGS: Settings = {
  salon_name: "Lumière Lash Studio",
  logo_url: "",
  address: "Дундговь аймаг, Дэлгэрэх дэлгүүрийн 2 давхар",
  address_image_url:
    "https://images.pexels.com/photos/3988037/pexels-photo-3988037.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200",
  phone: "88445111",
  facebook_url: "https://www.facebook.com/share/19CG65eSJP/",
  working_hours: [
    { day: 0, open: "09:00", close: "23:00", closed: false },
    { day: 1, open: "09:00", close: "23:00", closed: false },
    { day: 2, open: "09:00", close: "23:00", closed: false },
    { day: 3, open: "09:00", close: "23:00", closed: false },
    { day: 4, open: "09:00", close: "23:00", closed: false },
    { day: 5, open: "09:00", close: "23:00", closed: false },
    { day: 6, open: "09:00", close: "23:00", closed: false },
  ],
  advance_amount: 20000,
  qpay_client_id: "",
  qpay_client_secret: "",
  qpay_invoice_code: "",
  hero_image_url:
    "https://images.pexels.com/photos/34607130/pexels-photo-34607130.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=2000",
  slot_interval_minutes: 60,
};

const DEFAULT_ADMIN: Admin = {
  id: uid(),
  email: "admin@lumiere.mn",
  password: "admin123",
  name: "Salon Owner",
};

const SEED_SERVICES: Service[] = [
  {
    id: uid(),
    title: "Classic Lash Extensions",
    description:
      "One extension applied to each natural lash for a soft, everyday enhanced look.",
    price: 65000,
    duration_minutes: 90,
    image_url:
      "https://images.pexels.com/photos/36930354/pexels-photo-36930354.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200",
    is_active: true,
    sort_order: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: uid(),
    title: "Hybrid Lash Extensions",
    description:
      "A mix of classic and volume fans for added texture and a naturally glamorous finish.",
    price: 85000,
    duration_minutes: 120,
    image_url:
      "https://images.pexels.com/photos/8554941/pexels-photo-8554941.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200",
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: uid(),
    title: "Russian Volume Lashes",
    description:
      "Handmade lightweight fans for full, dramatic volume without weighing down natural lashes.",
    price: 110000,
    duration_minutes: 150,
    image_url:
      "https://images.pexels.com/photos/6135662/pexels-photo-6135662.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200",
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: uid(),
    title: "Lash Refill (2–3 weeks)",
    description: "Maintenance fill to keep your set full, fresh and even.",
    price: 45000,
    duration_minutes: 60,
    image_url:
      "https://images.pexels.com/photos/5128233/pexels-photo-5128233.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200",
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
];

const SEED_GALLERY: GalleryImage[] = [
  "https://images.pexels.com/photos/36930354/pexels-photo-36930354.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1200",
  "https://images.pexels.com/photos/8554941/pexels-photo-8554941.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1200",
  "https://images.pexels.com/photos/7755650/pexels-photo-7755650.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1200",
  "https://images.pexels.com/photos/5128233/pexels-photo-5128233.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1200",
  "https://images.pexels.com/photos/7755523/pexels-photo-7755523.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1200",
  "https://images.pexels.com/photos/6681656/pexels-photo-6681656.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1200",
].map((url, i) => ({
  id: uid(),
  image_url: url,
  public_id: null,
  sort_order: i,
  created_at: new Date().toISOString(),
}));

function ensureSeeded() {
  if (!localStorage.getItem(`${NS}:seeded`)) {
    write("settings", DEFAULT_SETTINGS);
    write("admins", [DEFAULT_ADMIN]);
    write("services", SEED_SERVICES);
    write("gallery", SEED_GALLERY);
    write("bookings", [] as Booking[]);
    write("payments", [] as Payment[]);
    localStorage.setItem(`${NS}:seeded`, "1");
  }
}

ensureSeeded();

export const localDb = {
  getSettings: (): Settings => read("settings", DEFAULT_SETTINGS),
  setSettings: (s: Settings) => write("settings", s),

  getAdmins: (): Admin[] => read("admins", [DEFAULT_ADMIN]),

  getServices: (): Service[] => read("services", SEED_SERVICES),
  setServices: (s: Service[]) => write("services", s),

  getGallery: (): GalleryImage[] => read("gallery", SEED_GALLERY),
  setGallery: (g: GalleryImage[]) => write("gallery", g),

  getBookings: (): Booking[] => read("bookings", []),
  setBookings: (b: Booking[]) => write("bookings", b),

  getPayments: (): Payment[] => read("payments", []),
  setPayments: (p: Payment[]) => write("payments", p),
};
