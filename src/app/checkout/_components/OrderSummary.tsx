"use client";

import type { CartSummary } from "@/lib/api/schemas/cart";
import type { PaymentMethod } from "@/lib/api/schemas/checkout";
import { formatBDT } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { CouponField } from "@/components/cart/CouponField";

/**
 * Checkout order summary rail — faithful port of the design kit CheckoutSummary.jsx
 * (OrderSummary). Bound to the latest server `quote` summary (never client-summed)
 * and announced politely on change. Rows: Subtotal · Discount · Delivery · COD fee
 * (COD only) · VAT (included) · Total → coupon field → Place order → Secure-checkout /
 * exchange-only assurance.
 */
function n(v?: string | null): number {
  return v ? Number(v) || 0 : 0;
}

export function OrderSummary({
  summary,
  appliedCode,
  appliedDiscount,
  quoting,
  paymentMethod,
  onPlace,
  placeDisabled,
  placing,
}: {
  summary?: CartSummary | null;
  appliedCode?: string | null;
  appliedDiscount?: string | null;
  quoting?: boolean;
  paymentMethod?: PaymentMethod;
  onPlace?: () => void;
  placeDisabled?: boolean;
  placing?: boolean;
}) {
  const codFee = n(summary?.cod_surcharge);
  const showCodFee = paymentMethod === "cod" && codFee > 0;

  return (
    <div className="h-max rounded-lg border border-border bg-white p-5">
      <h2 className="mb-2.5 text-[17px] font-bold text-ink">Order summary</h2>

      <dl className={"text-body-sm " + (quoting ? "opacity-60" : "")} aria-live="polite">
        <Row label="Subtotal" value={formatBDT(n(summary?.subtotal))} />
        {n(summary?.discount) > 0 && (
          <Row label="Discount" value={`− ${formatBDT(n(summary?.discount))}`} valueClass="text-success" />
        )}
        <Row
          label="Delivery"
          value={
            summary?.delivery_charge == null
              ? "—"
              : n(summary?.delivery_charge) === 0
                ? "Free"
                : formatBDT(n(summary?.delivery_charge))
          }
        />
        {showCodFee && <Row label="COD fee" value={formatBDT(codFee)} />}
        {n(summary?.vat) > 0 && <Row label="VAT (included)" value={formatBDT(n(summary?.vat))} valueClass="font-medium text-text-muted" />}
        <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-border pt-3.5">
          <dt className="text-[16px] font-extrabold text-ink">Total</dt>
          <dd className="text-[20px] font-extrabold tabular-nums text-ink">
            {summary?.grand_total == null ? "—" : formatBDT(n(summary?.grand_total))}
          </dd>
        </div>
      </dl>

      {/* Coupon — chip variant (green pill when applied, bordered Apply when not) */}
      <div className="mt-4 border-t border-border pt-4">
        <CouponField variant="chip" appliedCode={appliedCode} appliedDiscount={appliedDiscount} />
      </div>

      {onPlace && (
        <button
          type="button"
          onClick={onPlace}
          disabled={placeDisabled}
          className="mt-4 inline-flex h-[52px] w-full items-center justify-center rounded-md bg-volt text-[15px] font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-text-faint"
        >
          {placing ? "Placing your order…" : "Place order"}
        </button>
      )}

      <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
          <Icon name="lock" size={14} color="var(--volt-600)" aria-hidden="true" /> Secure checkout
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
          <Icon name="refresh-cw" size={14} color="var(--volt-600)" aria-hidden="true" /> Returns are exchange-only within 30 days
        </span>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = "font-semibold text-ink" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[7px]">
      <dt className="text-text-muted">{label}</dt>
      <dd className={"tabular-nums " + valueClass}>{value}</dd>
    </div>
  );
}
