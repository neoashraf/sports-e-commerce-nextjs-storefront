"use client";

import { useState } from "react";
import { useGuestTrack, isNotFound, isRateLimited } from "@/lib/api/hooks/orders";
import { useAuth } from "@/lib/hooks/useAuth";
import { normalizeNationalDigits, isValidBdNational, toE164 } from "@/lib/auth/phone";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { StatusTracker, ShipmentNote } from "@/components/orders/StatusTracker";

/**
 * Guest order tracking (guest-tracking.md, ord-storefront-fe AC4). Public:
 * order_no + phone → minimal status/shipment/history. The shopper types a local
 * BD number (01XXXXXXXXX); we normalize to E.164 (+8801…) — the format the API
 * matches against. 404 (generic mismatch) + 429 (rate-limited) handled inline.
 */
export function TrackView() {
  const track = useGuestTrack();
  const { requireAuth } = useAuth();
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const orderNoTrimmed = orderNo.trim();
    if (!orderNoTrimmed) {
      setErrorMsg("Enter your order number.");
      return;
    }
    // Accept a local BD number (01XXXXXXXXX or 1XXXXXXXXX) and convert to the
    // E.164 form the API expects; reject anything that isn't a valid BD mobile.
    const national = normalizeNationalDigits(phone);
    if (!isValidBdNational(national)) {
      setErrorMsg("Enter the Bangladesh mobile number on the order, e.g. 01712345678.");
      return;
    }

    track.mutate(
      { order_no: orderNoTrimmed, phone: toE164(national) },
      {
        onError: (err) => {
          if (isNotFound(err)) setErrorMsg("We couldn't find an order matching those details.");
          else if (isRateLimited(err))
            setErrorMsg("Too many attempts. Please wait a moment and try again.");
          else setErrorMsg("Something went wrong. Please try again.");
        },
      },
    );
  }

  const result = track.data;
  const field =
    "h-11 w-full rounded-md border border-border-strong px-3 text-body text-ink placeholder:text-text-faint focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]";

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <p className="text-label font-bold uppercase tracking-wide text-cyan-600">Order tracking</p>
      <h1 className="mt-1 text-h1 font-bold tracking-snug text-ink">Track your order</h1>
      <p className="mt-1 text-body-sm text-text-muted">
        Enter your order number and the phone number used on the order.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4 rounded-lg border border-border bg-white p-5 shadow-card sm:p-6"
      >
        <label className="block">
          <span className="mb-1 block text-body-sm font-semibold text-ink">Order number</span>
          <input
            className={field}
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            placeholder="SO-100390"
            autoComplete="off"
            required
          />
          <span className="mt-1 block text-label text-cyan-600">From your confirmation</span>
        </label>

        <label className="block">
          <span className="mb-1 block text-body-sm font-semibold text-ink">Phone number</span>
          <input
            className={field}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            inputMode="numeric"
            autoComplete="tel"
            required
          />
          <span className="mt-1 block text-label text-cyan-600">We match it to the order</span>
        </label>

        {errorMsg && (
          <p role="alert" className="text-body-sm text-error">
            {errorMsg}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={track.isPending}>
          {track.isPending ? "Tracking…" : "Track"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => requireAuth()}
        className="mx-auto mt-5 flex items-center gap-1.5 text-body-sm font-semibold text-ink underline decoration-volt-600 decoration-2 underline-offset-4 hover:text-ink-700"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Log in for full details
      </button>

      {result && (
        <div className="mt-8 space-y-4 rounded-lg border border-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-semibold text-ink">{result.order_no}</span>
            {result.placed_at && (
              <span className="text-label text-text-faint">{formatDateTime(result.placed_at)}</span>
            )}
          </div>
          <StatusTracker
            status={result.status}
            shipmentNote={
              result.shipment?.courier_name || result.shipment?.tracking_number ? (
                <ShipmentNote courier={result.shipment?.courier_name} tracking={result.shipment?.tracking_number} />
              ) : undefined
            }
          />
          {result.history.length > 0 && (
            <ol className="space-y-1.5 border-t border-border pt-3">
              {result.history.map((h, i) => (
                <li key={i} className="flex justify-between gap-3 text-body-sm">
                  <span className="break-words text-text-muted">{h.to_status.replace(/_/g, " ")}</span>
                  <span className="shrink-0 text-text-faint">{formatDateTime(h.created_at)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
