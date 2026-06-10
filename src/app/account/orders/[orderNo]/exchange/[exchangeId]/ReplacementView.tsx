"use client";

import Link from "next/link";
import { useState } from "react";
import { useExchangeStatus, useConfirmReplacement } from "@/lib/api/hooks/orders";
import { ApiError } from "@/lib/api/errors";
import { formatBDT } from "@/lib/format";

/**
 * Exchange status + replacement picker (exchange-request.md, ord-exchange-fe
 * AC3). Shows the exchange status; once approved, the customer confirms an
 * equal/higher-value replacement variant. A price difference redirects into the
 * PAY flow before issuance; lower-value / out-of-stock 409s are mapped; cash is
 * never returned.
 */
export function ReplacementView({ orderNo, exchangeId }: { orderNo: string; exchangeId: string }) {
  const { data, isLoading } = useExchangeStatus(orderNo, exchangeId);
  const confirm = useConfirmReplacement(orderNo, exchangeId);
  const [variantId, setVariantId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);

  if (isLoading) return <div className="h-48 animate-pulse rounded-lg bg-surface-100" />;
  if (!data) return <p className="py-12 text-center text-body-sm text-text-muted">Couldn&apos;t load this exchange.</p>;

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!variantId.trim()) {
      setError("Choose a replacement item first.");
      return;
    }
    try {
      const res = await confirm.mutateAsync(variantId.trim());
      if (res.payment?.action === "redirect" && res.payment.redirect_url) {
        window.location.href = res.payment.redirect_url;
        return;
      }
      setIssued(res.replacement_order_no ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("That replacement isn't available — it must be equal or higher value and in stock.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  const approved = data.status === "approved";

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4">
        <Link href={`/account/orders/${orderNo}`} className="text-body-sm text-volt-600 hover:underline">← Back to order</Link>
        <h1 className="mt-1 text-h1 font-bold tracking-snug text-ink">Exchange {data.exchange_id}</h1>
        <p className="text-label text-text-muted">Status: {data.status.replace(/_/g, " ")}</p>
      </div>

      {issued ? (
        <div className="rounded-lg border border-success/30 bg-success/10 p-5 text-center">
          <p className="text-body-sm font-medium text-success">Your replacement order {issued} has been issued.</p>
          <Link href={`/account/orders/${issued}`} className="mt-2 inline-block text-body-sm font-medium text-volt-600 hover:underline">
            View replacement order
          </Link>
        </div>
      ) : approved ? (
        <form onSubmit={onConfirm} className="space-y-4">
          {data.replacement_options_hint && (
            <p className="rounded-lg bg-surface-50 px-4 py-3 text-body-sm text-text-muted">{data.replacement_options_hint}</p>
          )}
          {data.price_difference && Number(data.price_difference) > 0 && (
            <p className="text-body-sm text-text-muted" aria-live="polite">
              Price difference to pay: <span className="font-semibold text-ink tabular-nums">{formatBDT(Number(data.price_difference))}</span>
            </p>
          )}
          <label className="block">
            <span className="mb-1 block text-body-sm font-medium text-ink">Replacement item (variant)</span>
            <input
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              placeholder="Choose a replacement variant"
              className="h-11 w-full rounded-sm border border-border-strong px-3 text-body focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]"
            />
            <span className="mt-1 block text-label text-text-faint">CAT replacement picker integration pending — flagged.</span>
          </label>
          {error && <p role="alert" className="text-body-sm text-error">{error}</p>}
          <button type="submit" disabled={confirm.isPending} className="inline-flex h-11 items-center rounded-md bg-ink px-6 text-body-sm font-semibold text-white transition-colors duration-micro ease-out hover:bg-ink-700 disabled:opacity-50">
            {confirm.isPending ? "Confirming…" : "Confirm replacement"}
          </button>
        </form>
      ) : (
        <p className="rounded-lg bg-surface-50 px-4 py-3 text-body-sm text-text-muted">
          We&apos;re reviewing your request. We&apos;ll let you know once it&apos;s approved so you can pick a replacement.
        </p>
      )}
    </div>
  );
}
