/**
 * Invoice (ORD) presentation helpers — derive the display fields the invoice sheet
 * needs from the immutable order snapshot (docs/srs/06-orders-tracking.md §5.9,
 * FR-ORD-073). ORD never recomputes tax; the VAT line here is the *informational*
 * inclusive figure (`subtotal_after_discount × 15 ÷ 115`) — the same formula the
 * backend invoice renderer uses, so the on-screen sheet matches the server PDF.
 */

import { env } from "@/lib/env";
import { getAccessToken } from "@/lib/stores/auth";

/**
 * Download the server-rendered invoice PDF for an order (FR-ORD-073). Fetches the
 * authenticated customer route `GET /me/orders/:orderNo/invoice?format=pdf` as a
 * blob and saves it via a temporary object URL + `download` anchor, so clicking
 * always triggers a file download (never a print dialog or an inline preview).
 * Throws if the request fails so the caller can surface an error.
 */
export async function downloadInvoicePdf(orderNo: string): Promise<void> {
  const base = env.apiUrl.replace(/\/$/, "");
  const url = `${base}/me/orders/${encodeURIComponent(orderNo)}/invoice?format=pdf`;

  const headers: Record<string, string> = { Accept: "application/pdf" };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to download invoice (status ${res.status}).`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `invoice-${orderNo}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Revoke on the next tick so the click-initiated download isn't cut short.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

/** Payment methods the backend reports (Order.payment_method enum). */
export type PaymentMethod = "cod" | "bkash" | "sslcommerz" | (string & {});

/**
 * Human label for the delivery/payment method, rendered dynamically on the invoice.
 * bKash → "bKash", SSLCommerz (the card gateway) → "Card", COD → "Cash on Delivery".
 */
export function paymentMethodLabel(method: string | undefined | null): string {
  switch ((method ?? "").toLowerCase()) {
    case "bkash":
      return "bKash";
    case "sslcommerz":
    case "card":
      return "Card";
    case "cod":
      return "Cash on Delivery";
    default:
      return method ? method.toUpperCase() : "—";
  }
}

/** A settled payment — `paid` (online) or `cod_collected` (COD) — renders a paid receipt. */
export function isPaidState(state: string | undefined | null): boolean {
  const s = (state ?? "").toLowerCase();
  return s === "paid" || s === "cod_collected";
}

/**
 * Short, human payment-state label for the unpaid chip (e.g. "COD pending",
 * "Unpaid"). Mirrors the backend's `humanState` (underscores → spaces, title-ish).
 */
export function paymentStateLabel(
  state: string | undefined | null,
  method: string | undefined | null,
): string {
  const s = (state ?? "").toLowerCase();
  if (s === "cod_pending") return "COD pending";
  if (s === "unpaid" || s === "" || s === "pending") {
    return (method ?? "").toLowerCase() === "cod" ? "COD pending" : "Unpaid";
  }
  return s
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Informational inclusive VAT (15%): `(subtotal − discount) × 15 ÷ 115`, in major
 * units. Inputs are the snapshot money strings from the order detail payload.
 */
export function informationalVat(
  subtotal: string | number | undefined,
  discount: string | number | undefined,
): number {
  const sub = Math.round(Number(subtotal ?? 0) * 100);
  const disc = Math.round(Number(discount ?? 0) * 100);
  const afterDiscount = Math.max(sub - disc, 0);
  return Math.round((afterDiscount * 15) / 115) / 100;
}

/**
 * Money formatter matching the design kit (`'৳ ' + toLocaleString('en-IN')`) so the
 * invoice sheet renders identically to the approved design (lakh-style grouping).
 */
export function tk(amount: string | number | undefined | null): string {
  return "৳ " + Number(amount ?? 0).toLocaleString("en-IN");
}

/** Build the seller-side display lockup from env config. */
export type InvoiceSeller = {
  name: string;
  address: string;
  phone: string;
  email: string;
  bin: string;
};
