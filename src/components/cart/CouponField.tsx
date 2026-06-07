"use client";

import { useState } from "react";
import { useApplyCoupon, useRemoveCoupon } from "@/lib/api/hooks/cart";
import { ApiError } from "@/lib/api/errors";
import { formatBDT } from "@/lib/format";

/**
 * Reusable coupon field (cart-coupon-fe). Host-agnostic — embedded in the cart
 * summary and the checkout review. When no coupon is applied, shows a
 * "Have a promo code?" input + Apply; when applied, shows the code chip +
 * discount + Remove (input hidden). Invalid → inline reason; a second apply
 * surfaces the 409 "one promo per order". Recomputed totals come from the cart
 * query the hooks invalidate, so the host re-renders.
 */
export function CouponField({
  appliedCode,
  appliedDiscount,
}: {
  appliedCode?: string | null;
  appliedDiscount?: string | null;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const apply = useApplyCoupon();
  const remove = useRemoveCoupon();

  async function onApply(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    setError(null);
    try {
      await apply.mutateAsync(c);
      setCode("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const reason = (err.details?.[0]?.message ?? "This code isn’t valid.").toString();
        setError(reason);
      } else if (err instanceof ApiError && err.status === 409) {
        setError("Only one promo code can be used per order.");
      } else {
        setError("Couldn’t apply this code. Try again.");
      }
    }
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2" aria-live="polite">
        <div className="text-sm">
          <span className="font-medium text-green-800">{appliedCode}</span>
          {appliedDiscount && (
            <span className="ml-2 text-green-700">−{formatBDT(Number(appliedDiscount))}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onApply} className="space-y-1">
      <label htmlFor="coupon-code" className="text-sm font-medium text-gray-700">
        Have a promo code?
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); if (error) setError(null); }}
          aria-invalid={!!error}
          aria-describedby={error ? "coupon-error" : undefined}
          placeholder="Enter code"
          className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm uppercase focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        />
        <button
          type="submit"
          disabled={apply.isPending || !code.trim()}
          className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {apply.isPending ? "Applying…" : "Apply"}
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
