import type { Settings } from "@/types";

/**
 * QPay (qpay.mn) advance-payment integration.
 *
 * QPay's merchant API (POST /v2/auth/token, POST /v2/invoice,
 * POST /v2/payment/check) must be called from a trusted backend because it
 * requires the merchant's client_id/client_secret and QPay does not allow
 * browser CORS calls. In production this app calls a small serverless proxy
 * (e.g. a Supabase Edge Function) configured via VITE_QPAY_PROXY_URL that:
 *   1. POST /create-invoice  { amount, description, bookingId } -> { invoice_id, qr_text, qr_image, urls }
 *   2. QPay sends a webhook to the proxy on payment -> proxy marks the
 *      booking CONFIRMED in Supabase (server-side, authoritative).
 *   3. POST /check-invoice { invoice_id } -> { paid: boolean }  (used for polling)
 *
 * Without VITE_QPAY_PROXY_URL configured (this sandbox), a realistic mock
 * invoice + QR is generated locally and a "simulate payment" affordance is
 * exposed so the full booking flow can be demonstrated end-to-end.
 */

const PROXY_URL = import.meta.env.VITE_QPAY_PROXY_URL;
export const isQpayConfigured = Boolean(PROXY_URL);

export interface QpayInvoice {
  invoiceId: string;
  qrText: string;
  qrImage?: string;
  amount: number;
}

export async function createInvoice(opts: {
  amount: number;
  description: string;
  bookingId: string;
  settings: Settings;
}): Promise<QpayInvoice> {
  if (PROXY_URL) {
    const res = await fetch(`${PROXY_URL}/create-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: opts.amount,
        description: opts.description,
        sender_invoice_no: opts.bookingId,
        invoice_code: opts.settings.qpay_invoice_code,
      }),
    });
    if (!res.ok) throw new Error("Failed to create QPay invoice");
    const data = await res.json();
    return {
      invoiceId: data.invoice_id,
      qrText: data.qr_text,
      qrImage: data.qr_image,
      amount: opts.amount,
    };
  }

  // Demo fallback: deterministic fake invoice, QR encodes the invoice id.
  const invoiceId = `demo-${opts.bookingId}`;
  return {
    invoiceId,
    qrText: `https://qpay.mn/invoice/${invoiceId}`,
    amount: opts.amount,
  };
}

export async function checkInvoicePaid(invoiceId: string): Promise<boolean> {
  if (PROXY_URL) {
    const res = await fetch(`${PROXY_URL}/check-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.paid);
  }

  // Demo fallback: consider it paid once the customer clicks "I have paid"
  // which flips this localStorage flag (see BookingWizard PaymentStep).
  return localStorage.getItem(`lumiere-lash:paid:${invoiceId}`) === "1";
}

export function markDemoInvoicePaid(invoiceId: string) {
  localStorage.setItem(`lumiere-lash:paid:${invoiceId}`, "1");
}

/** Generates a scannable-looking QR SVG data URL client-side for demo mode. */
export function qrPlaceholderDataUrl(text: string): string {
  const size = 240;
  const cells = 18;
  const cell = size / cells;
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967295;
  };
  let rects = "";
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const isFinder =
        (x < 3 && y < 3) || (x > cells - 4 && y < 3) || (x < 3 && y > cells - 4);
      if (isFinder ? (x + y) % 2 === 0 : rand() > 0.58) {
        rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" />`;
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/><g fill="#1F1F1F">${rects}</g></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
