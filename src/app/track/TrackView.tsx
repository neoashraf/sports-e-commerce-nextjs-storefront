"use client";

import { useState } from "react";
import { useGuestTrack, isNotFound, isRateLimited } from "@/lib/api/hooks/orders";
import { formatDateTime } from "@/lib/format";
import { StatusTracker, ShipmentNote } from "@/components/orders/StatusTracker";

/**
 * Guest order tracking (guest-tracking.md, ord-storefront-fe AC4). Public:
 * order_no + phone → minimal status/shipment/history. 404 (mismatch, generic)
 * + 429 (rate-limited) handled.
 */
export function TrackView() {
  const track = useGuestTrack();
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    track.mutate(
      { order_no: orderNo.trim(), phone: phone.trim() },
      {
        onError: (err) => {
          if (isNotFound(err)) setErrorMsg("We couldn't find an order matching those details.");
          else if (isRateLimited(err)) setErrorMsg("Too many attempts. Please wait a moment and try again.");
          else setErrorMsg("Something went wrong. Please try again.");
        },
      },
    );
  }

  const result = track.data;
  const field = "h-11 w-full rounded-sm border border-border-strong px-3 text-body focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]";

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-h1 font-bold tracking-snug text-ink">Track your order</h1>
      <p className="mt-1 text-body-sm text-text-muted">Enter your order number and the phone number on the order.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block">
          <span className="mb-1 block text-body-sm font-medium text-ink">Order number</span>
          <input className={field} value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="SO-100245" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-body-sm font-medium text-ink">Phone</span>
          <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" required />
        </label>
        <button
          type="submit"
          disabled={track.isPending}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-ink text-body-sm font-semibold text-white transition-colors duration-micro ease-out hover:bg-ink-700 disabled:opacity-50"
        >
          {track.isPending ? "Tracking…" : "Track order"}
        </button>
      </form>

      {errorMsg && <p role="alert" className="mt-4 text-body-sm text-error">{errorMsg}</p>}

      {result && (
        <div className="mt-8 space-y-4 rounded-lg border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-semibold text-ink">{result.order_no}</span>
            {result.placed_at && <span className="text-label text-text-faint">{formatDateTime(result.placed_at)}</span>}
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
