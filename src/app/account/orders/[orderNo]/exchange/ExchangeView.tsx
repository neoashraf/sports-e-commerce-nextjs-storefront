"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrderDetail, useRequestExchange } from "@/lib/api/hooks/orders";
import type { ExchangeReason } from "@/lib/api/schemas/orders";
import { ApiError } from "@/lib/api/errors";
import { formatBDT } from "@/lib/format";

const REASONS: { value: ExchangeReason; label: string }[] = [
  { value: "wrong_size", label: "Wrong size" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "quality_defect", label: "Quality defect / damaged" },
];

const INELIGIBLE_COPY: Record<string, string> = {
  outside_window: "This order is outside the exchange window.",
  non_exchangeable_item: "This item isn't eligible for exchange.",
  discount_purchased: "Discounted items can't be exchanged.",
  already_exchanged: "This item has already been exchanged.",
  not_delivered: "This order hasn't been delivered yet.",
};

/**
 * Exchange request flow (exchange-request.md, ord-exchange-fe). Pick a delivered
 * item + reason + note (+ evidence required for quality_defect), submit. The
 * exchange-only / no-cash-refund policy is surfaced prominently. On submit shows
 * an acknowledgement; ineligibility (409) shows the mapped reason. The
 * post-approval replacement picker is reached from the order/exchange status.
 */
export function ExchangeView({ orderNo }: { orderNo: string }) {
  const { data: order, isLoading } = useOrderDetail(orderNo);
  const request = useRequestExchange(orderNo);

  const [itemIdx, setItemIdx] = useState<number | null>(null);
  const [reason, setReason] = useState<ExchangeReason>("wrong_size");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<string | null>(null);

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-gray-100" />;
  if (!order) return <p className="py-12 text-center text-sm text-gray-600">Couldn&apos;t load this order.</p>;

  const needsEvidence = reason === "quality_defect";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (itemIdx == null) {
      setError("Please choose the item you'd like to exchange.");
      return;
    }
    if (needsEvidence) {
      // Evidence upload wiring lands with the BE; for now block submission with a note.
      setError("Please attach a photo or video of the defect. (Upload integration pending — flagged.)");
      return;
    }
    try {
      // order_item_id isn't on the storefront order payload; use the index-derived
      // placeholder id — the BE maps the chosen item. Flagged for BE alignment.
      const res = await request.mutateAsync({
        order_item_id: `item_${itemIdx}`,
        reason,
        customer_note: note.trim() || undefined,
        attachment_ids: [],
      });
      setAcknowledged(res.message ?? "We'll review your exchange request.");
    } catch (err) {
      if (err instanceof ApiError && err.code === "EXCHANGE_INELIGIBLE") {
        const r = (err.details?.[0]?.message ?? "").toString();
        setError(INELIGIBLE_COPY[r] ?? "This item isn't eligible for exchange.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError("Please attach evidence for a quality defect.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  if (acknowledged) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-100 text-xl text-green-700">✓</div>
        <h1 className="mt-3 text-xl font-bold text-gray-900">Exchange requested</h1>
        <p className="mt-1 text-sm text-gray-600">{acknowledged}</p>
        <Link href={`/account/orders/${orderNo}`} className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
          Back to order
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href={`/account/orders/${orderNo}`} className="text-sm text-brand-600 hover:underline">← Back to order</Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Request an exchange</h1>
      </div>

      {/* Policy banner — exchange-only, no cash refund. */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Exchange / replacement only — <strong>no cash refund</strong>. A higher-value replacement requires paying the price difference before it&apos;s issued.
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-900">Which item?</legend>
          <ul className="space-y-2">
            {order.items.map((it, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 has-[:checked]:border-brand-600 has-[:checked]:ring-1 has-[:checked]:ring-brand-600">
                  <span className="flex items-center gap-3">
                    <input type="radio" name="item" checked={itemIdx === i} onChange={() => setItemIdx(i)} className="h-4 w-4 text-brand-600 focus:ring-brand-600" />
                    <span className="text-sm">
                      <span className="block font-medium text-gray-900">{it.product_title}</span>
                      <span className="text-xs text-gray-500">Qty {it.quantity}</span>
                    </span>
                  </span>
                  <span className="text-sm font-medium text-gray-900">{formatBDT(Number(it.line_total))}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-900">Reason</span>
          <select value={reason} onChange={(e) => setReason(e.target.value as ExchangeReason)} className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600">
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>

        {needsEvidence && (
          <label className="block rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <span className="mb-1 block font-medium text-gray-700">Photo / video evidence (required)</span>
            <input type="file" accept="image/*,video/*" multiple className="text-sm" />
            <span className="mt-1 block text-xs text-gray-400">Upload integration pending — flagged for BE.</span>
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-900">Note (optional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tell us more…" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
        </label>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={request.isPending} className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
          {request.isPending ? "Submitting…" : "Submit exchange request"}
        </button>
      </form>
    </div>
  );
}
