"use client";

import { useState } from "react";
import { useGuestTrack, isNotFound, isRateLimited } from "@/lib/api/hooks/orders";
import { formatDateTime } from "@/lib/format";
import { StatusTracker } from "@/components/orders/StatusTracker";

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
  const field = "h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Track your order</h1>
      <p className="mt-1 text-sm text-gray-500">Enter your order number and the phone number on the order.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Order number</span>
          <input className={field} value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="SO-100245" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Phone</span>
          <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" required />
        </label>
        <button
          type="submit"
          disabled={track.isPending}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {track.isPending ? "Tracking…" : "Track order"}
        </button>
      </form>

      {errorMsg && <p role="alert" className="mt-4 text-sm text-red-600">{errorMsg}</p>}

      {result && (
        <div className="mt-8 space-y-4 rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">{result.order_no}</span>
            {result.placed_at && <span className="text-xs text-gray-400">{formatDateTime(result.placed_at)}</span>}
          </div>
          <StatusTracker status={result.status} />
          {result.shipment?.tracking_number && (
            <p className="text-sm text-gray-600">
              {result.shipment.courier_name} · {result.shipment.tracking_number}
            </p>
          )}
          {result.history.length > 0 && (
            <ol className="space-y-1.5 border-t border-gray-100 pt-3">
              {result.history.map((h, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{h.to_status.replace(/_/g, " ")}</span>
                  <span className="text-gray-400">{formatDateTime(h.created_at)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
