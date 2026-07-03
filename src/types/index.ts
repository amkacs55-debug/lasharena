export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_minutes: number | null;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  public_id: string | null;
  sort_order: number;
  created_at: string;
}

export type BookingStatus = "pending_payment" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  service_id: string;
  service_title: string;
  service_price: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customer_name: string;
  customer_phone: string;
  status: BookingStatus;
  advance_amount: number;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  invoice_id: string;
  qpay_invoice_no?: string;
  status: "pending" | "paid" | "failed";
  created_at: string;
  paid_at?: string;
}

export interface WorkingHours {
  day: number; // 0 = Sunday ... 6 = Saturday
  open: string; // "10:00"
  close: string; // "19:00"
  closed: boolean;
}

export interface Settings {
  salon_name: string;
  logo_url: string;
  address: string;
  address_image_url: string;
  phone: string;
  facebook_url: string;
  working_hours: WorkingHours[];
  advance_amount: number;
  qpay_client_id: string;
  qpay_client_secret: string;
  qpay_invoice_code: string;
  hero_image_url: string;
  slot_interval_minutes: number;
}

export interface Admin {
  id: string;
  email: string;
  password: string;
  name: string;
}
