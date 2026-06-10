"use client";

import type { CartSummary } from "@/lib/api/schemas/cart";
import { formatBDT } from "@/lib/format";
import { CouponField } from "@/components/cart/CouponField";

/**
 * Checkout order summary (checkout.md §5, checkout-fe AC4/AC7). Bound to the
 * latest server `quote` summary — never client-summed. Announced politely on
 * change. Embeds the reusable coupon field.
 */
function n(v?: string | null): number {
  return v ? Number(v) || 0 : 0;
}

export function OrderSummary({
  summary,
  appliedCode,
  appliedDiscount,
  quoting,
}: {
  summary?: CartSummary | null;
  appliedCode?: string | null;
  appliedDiscount?: string | null;
  quoting?: boolean;
}) {
  return (
    <aside className="h-max rounded-lg border border-border p-5">
      <h2 className="text-h3 font-bold text-ink">Order summary</h2>

      <div className="mt-4">
        <CouponField appliedCode={appliedCode} appliedDiscount={appliedDiscount} />
      </div>

      <dl className={"mt-4 space-y-2 text-body-sm " + (quoting ? "opacity-60" : "")} aria-live="polite">
        <Row label="Subtotal" value={formatBDT(n(summary?.subtotal))} />
        {n(summary?.discount) > 0 && (
          <Row label="Discount" value={`−${formatBDT(n(summary?.discount))}`} valueClass="text-success" />
        )}
        <Row
          label="Delivery"
          value={summary?.delivery_charge != null ? formatBDT(n(summary?.delivery_charge)) : "—"}
        />
        {n(summary?.cod_surcharge) > 0 && (
          <Row label="COD fee" value={formatBDT(n(summary?.cod_surcharge))} />
        )}
        {n(summary?.vat) > 0 && <Row label="VAT" value={formatBDT(n(summary?.vat))} />}
        <div className="flex justify-between border-t border-border pt-2 text-body font-bold text-ink">
          <dt>Total</dt>
          <dd className="tabular-nums">{summary?.grand_total != null ? formatBDT(n(summary?.grand_total)) : "—"}</dd>
        </div>
      </dl>
    </aside>
  );
}

function Row({ label, value, valueClass = "text-ink" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-text-muted">{label}</dt>
      <dd className={"font-semibold tabular-nums " + valueClass}>{value}</dd>
    </div>
  );
}
