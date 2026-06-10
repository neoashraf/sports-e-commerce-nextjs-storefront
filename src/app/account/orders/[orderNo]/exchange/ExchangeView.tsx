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

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-surface-100" />;
  if (!order) return <p className="py-12 text-center text-body-sm text-text-muted">Couldn&apos;t load this order.</p>;

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
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10 text-h3 text-success">✓</div>
        <h1 className="mt-3 text-h1 font-bold tracking-snug text-ink">Exchange requested</h1>
        <p className="mt-1 text-body-sm text-text-muted">{acknowledged}</p>
        <Link href={`/account/orders/${orderNo}`} className="mt-4 inline-block text-body-sm font-medium text-volt-600 hover:underline">
          Back to order
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href={`/account/orders/${orderNo}`} className="text-body-sm text-volt-600 hover:underline">← Back to order</Link>
        <h1 className="mt-1 text-h1 font-bold tracking-snug text-ink">Request an exchange</h1>
      </div>

      {/* Policy banner — exchange-only, no cash refund. */}
      <div className="mb-6 rounded-lg border border-warning/30 bg-warning/15 px-4 py-3 text-body-sm text-[#B45309]">
        Exchange / replacement only — <strong>no cash refund</strong>. A higher-value replacement requires paying the price difference before it&apos;s issued.
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-body-sm font-medium text-ink">Which item?</legend>
          <ul className="space-y-2">
            {order.items.map((it, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors duration-micro ease-out has-[:checked]:border-volt-600 has-[:checked]:shadow-[0_0_0_1px_rgba(166,212,0,0.55)]">
                  <span className="flex items-center gap-3">
                    <input type="radio" name="item" checked={itemIdx === i} onChange={() => setItemIdx(i)} className="h-4 w-4 accent-volt-600" />
                    <span className="text-body-sm">
                      <span className="block break-words font-medium text-ink">{it.product_title}</span>
                      <span className="text-label text-text-muted">Qty {it.quantity}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-body-sm font-medium text-ink tabular-nums">{formatBDT(Number(it.line_total))}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <label className="block">
          <span className="mb-1 block text-body-sm font-medium text-ink">Reason</span>
          <select value={reason} onChange={(e) => setReason(e.target.value as ExchangeReason)} className="h-11 w-full rounded-sm border border-border-strong px-3 text-body focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]">
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>

        {needsEvidence && (
          <label className="block rounded-lg bg-surface-50 p-3 text-body-sm text-text-muted">
            <span className="mb-1 block font-medium text-ink">Photo / video evidence (required)</span>
            <input type="file" accept="image/*,video/*" multiple className="text-body-sm" />
            <span className="mt-1 block text-label text-text-faint">Upload integration pending — flagged for BE.</span>
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-body-sm font-medium text-ink">Note (optional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tell us more…" className="w-full rounded-sm border border-border-strong px-3 py-2 text-body focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]" />
        </label>

        {error && <p role="alert" className="text-body-sm text-error">{error}</p>}

        <button type="submit" disabled={request.isPending} className="inline-flex h-11 items-center rounded-md bg-ink px-6 text-body-sm font-semibold text-white transition-colors duration-micro ease-out hover:bg-ink-700 disabled:opacity-50">
          {request.isPending ? "Submitting…" : "Submit exchange request"}
        </button>
      </form>
    </div>
  );
}
