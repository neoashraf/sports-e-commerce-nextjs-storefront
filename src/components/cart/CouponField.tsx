"use client";

import { useState } from "react";
import { useApplyCoupon, useRemoveCoupon } from "@/lib/api/hooks/cart";
import { ApiError } from "@/lib/api/errors";
import { couponErrorMessage } from "@/lib/coupon-messages";
import { formatBDT } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

/**
 * Reusable coupon field (cart-coupon-fe). Host-agnostic — embedded in the cart
 * summary and the checkout review. When no coupon is applied, shows a
 * "Have a promo code?" input + Apply; when applied, shows the code chip +
 * discount + Remove (input hidden). Invalid → inline reason; a second apply
 * surfaces the 409 "one promo per order". Recomputed totals come from the cart
 * query the hooks invalidate, so the host re-renders.
 *
 * `variant`:
 *  - "default" (cart): bordered box + ink Apply button.
 *  - "chip" (checkout review, kit .co-chip): a green applied-pill with an inline
 *    remove ×, and a bordered-white Apply matching the kit's secondary button.
 */
export function CouponField({
  appliedCode,
  appliedDiscount,
  appliedFreeShipping,
  variant = "default",
}: {
  appliedCode?: string | null;
  appliedDiscount?: string | null;
  /** free_shipping coupons carry no ৳ discount — the benefit is the waived delivery. */
  appliedFreeShipping?: boolean;
  variant?: "default" | "chip";
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
      if (err instanceof ApiError && err.code === "COUPON_INVALID") {
        // (`details[0].message` was read here before — the backend never populates `details` for
        // COUPON_INVALID, so every rejection showed the same generic fallback.)
        setError(couponErrorMessage(err));
      } else if (err instanceof ApiError && err.status === 409) {
        setError("Only one promo code can be used per order.");
      } else {
        setError("Couldn’t apply this code. Try again.");
      }
    }
  }

  const isChip = variant === "chip";

  if (appliedCode) {
    // Kit .co-chip: green pill, inline check + remove ×.
    if (isChip) {
      return (
        <div aria-live="polite">
          <p className="mb-2 text-[13px] font-semibold text-ink">Have a promo code?</p>
          <span className="inline-flex h-9 items-center gap-2 rounded-full bg-success/10 py-0 pl-3 pr-1.5 text-[13px] font-bold text-success">
            <Icon name="check" size={14} />
            {appliedCode}
            {appliedFreeShipping ? (
              <span>· Free delivery</span>
            ) : (
              appliedDiscount && Number(appliedDiscount) > 0 && <span>· −{formatBDT(Number(appliedDiscount))}</span>
            )}
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              aria-label="Remove promo code"
              className="ml-0.5 grid h-[22px] w-[22px] place-items-center rounded-full transition-colors duration-micro ease-out hover:bg-success/15 disabled:opacity-50"
            >
              <Icon name="x" size={14} />
            </button>
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/10 px-3 py-2" aria-live="polite">
        <div className="text-body-sm">
          <span className="font-semibold text-success">{appliedCode}</span>
          {appliedFreeShipping ? (
            <span className="ml-2 text-success">Free delivery</span>
          ) : (
            appliedDiscount &&
            Number(appliedDiscount) > 0 && (
              <span className="ml-2 text-success">−{formatBDT(Number(appliedDiscount))}</span>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
          className="text-body-sm font-semibold text-text-muted transition-colors duration-micro ease-out hover:text-ink"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onApply} className="space-y-1">
      <label htmlFor="coupon-code" className={isChip ? "mb-2 block text-[13px] font-semibold text-ink" : "text-body-sm font-medium text-ink"}>
        Have a promo code?
      </label>
      <div className="flex gap-2.5">
        <input
          id="coupon-code"
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); if (error) setError(null); }}
          aria-invalid={!!error}
          aria-describedby={error ? "coupon-error" : undefined}
          placeholder="Enter code"
          className={
            isChip
              ? "h-11 min-w-0 flex-1 rounded-md border border-border-strong px-3 text-body uppercase text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_3px_rgba(166,212,0,0.3)]"
              : "h-11 min-w-0 flex-1 rounded-sm border border-border-strong px-3 text-body uppercase text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]"
          }
        />
        <button
          type="submit"
          disabled={apply.isPending || !code.trim()}
          className={
            isChip
              ? // Kit secondary button: bordered white, ink text.
                "inline-flex h-11 items-center rounded-md border border-border-strong bg-white px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100 disabled:opacity-50"
              : "inline-flex h-11 items-center rounded-md bg-ink px-5 text-body-sm font-semibold text-white transition-colors duration-micro ease-out hover:bg-ink-700 disabled:opacity-50"
          }
        >
          {apply.isPending ? "Applying…" : "Apply"}
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-1.5 text-body-sm text-error">
          {error}
        </p>
      )}
    </form>
  );
}
