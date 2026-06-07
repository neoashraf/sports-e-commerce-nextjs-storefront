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

  if (isLoading) return <div className="h-48 animate-pulse rounded-lg bg-gray-100" />;
  if (!data) return <p className="py-12 text-center text-sm text-gray-600">Couldn&apos;t load this exchange.</p>;

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
        <Link href={`/account/orders/${orderNo}`} className="text-sm text-brand-600 hover:underline">← Back to order</Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Exchange {data.exchange_id}</h1>
        <p className="text-xs text-gray-500">Status: {data.status.replace(/_/g, " ")}</p>
      </div>

      {issued ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-center">
          <p className="text-sm font-medium text-green-800">Your replacement order {issued} has been issued.</p>
          <Link href={`/account/orders/${issued}`} className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">
            View replacement order
          </Link>
        </div>
      ) : approved ? (
        <form onSubmit={onConfirm} className="space-y-4">
          {data.replacement_options_hint && (
            <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">{data.replacement_options_hint}</p>
          )}
          {data.price_difference && Number(data.price_difference) > 0 && (
            <p className="text-sm text-gray-700" aria-live="polite">
              Price difference to pay: <span className="font-semibold">{formatBDT(Number(data.price_difference))}</span>
            </p>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-900">Replacement item (variant)</span>
            <input
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              placeholder="Choose a replacement variant"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
            <span className="mt-1 block text-xs text-gray-400">CAT replacement picker integration pending — flagged.</span>
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={confirm.isPending} className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
            {confirm.isPending ? "Confirming…" : "Confirm replacement"}
          </button>
        </form>
      ) : (
        <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          We&apos;re reviewing your request. We&apos;ll let you know once it&apos;s approved so you can pick a replacement.
        </p>
      )}
    </div>
  );
}
