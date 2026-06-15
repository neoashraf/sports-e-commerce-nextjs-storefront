"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrderDetail, useCancelOrder, isNotFound } from "@/lib/api/hooks/orders";
import { ApiError } from "@/lib/api/errors";
import { formatBDT, formatDate, formatDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "@/lib/stores/toast";
import { Icon } from "@/components/ui/Icon";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { StatusTracker, ShipmentNote } from "./StatusTracker";
import { StatusBadge } from "./StatusBadge";

const CANCELLABLE = new Set(["pending_payment", "confirmed"]);
const PAYMENT_LABEL: Record<string, string> = {
  cod: "Cash on delivery",
  bkash: "bKash",
  card: "Card",
  sslcommerz: "Card / mobile banking",
};

function optionsLabel(o: Record<string, string>): string {
  return Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(" · ");
}

/**
 * Order detail (order-detail.md) — RW7 fidelity per ui_kits/account-orders.
 * Desktop 2-column (items + amounts left; tracker + address + actions right ≥880px),
 * a vertical volt-glow stepper with the shipment note + collapsible history inside
 * the tracker card, and always-visible Cancel/Exchange/Invoice actions that are
 * disabled-with-reason when ineligible. Presentation-only — cancel/exchange wiring
 * is reused as-is.
 *
 * DATA GAP (flagged, owned by rw6-order-confirmation-data): the item payload has no
 * per-item base/compare price, so the struck-on-sale price is omitted (single price
 * shown). Per-item thumbnail + Bangla title come from RW6's product_image/
 * product_title_bn (placeholder when null).
 */
export function OrderDetailView({ orderNo }: { orderNo: string }) {
  const { data, isLoading, isError, error } = useOrderDetail(orderNo);
  const cancel = useCancelOrder(orderNo);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-surface-100" />;

  if (isError) {
    if (isNotFound(error)) {
      return (
        <div className="py-16 text-center">
          <p className="text-body-sm font-medium text-ink">We couldn&apos;t find that order.</p>
          <Link href="/account/orders" className="mt-2 inline-block text-body-sm font-medium text-volt-600 hover:underline">
            Back to my orders
          </Link>
        </div>
      );
    }
    return <p className="py-16 text-center text-body-sm text-text-muted">Couldn&apos;t load this order.</p>;
  }
  if (!data) return null;

  const cancellable = CANCELLABLE.has(data.status);
  const isPrepaid = data.payment_state === "paid";
  const exchangeEligible = data.status === "delivered" && !!data.exchange_eligible;
  const paymentLabel = data.payment_method ? (PAYMENT_LABEL[data.payment_method] ?? data.payment_method.toUpperCase()) : null;
  const hasShipment = !!(data.shipment?.courier_name || data.shipment?.tracking_number);

  const cancelReason = cancellable ? "" : "This order can no longer be cancelled.";
  const exchangeReason = exchangeEligible ? "" : "Available for delivered orders within the 30-day window.";

  async function onCancel(reason: string) {
    try {
      const res = await cancel.mutateAsync(reason);
      setConfirmCancel(false);
      toast(res.refund_note || "Your order has been cancelled.");
    } catch (err) {
      setConfirmCancel(false);
      if (err instanceof ApiError && err.status === 409) {
        toast("This order can no longer be cancelled.", "error");
      } else {
        toast("Couldn't cancel your order. Please try again.", "error");
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-h1 font-bold tracking-snug text-ink">Order {data.order_no}</h1>
          {data.placed_at && (
            <p className="text-body-sm text-text-muted">
              Placed {formatDate(data.placed_at)}
              {paymentLabel ? ` · ${paymentLabel}` : ""}
            </p>
          )}
        </div>
        <StatusBadge status={data.status} />
      </div>

      {/* 2-column: items + amounts (left) · tracker + address + actions (right) */}
      <div className="grid grid-cols-1 gap-5 min-[880px]:grid-cols-[1.3fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Items */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 text-h3 font-bold tracking-snug text-ink">Items</h2>
            <ul className="divide-y divide-border">
              {data.items.map((it, i) => (
                <li key={i} className="grid grid-cols-[52px_1fr_auto] items-start gap-3 py-3 text-body-sm">
                  <span className="grid h-[52px] w-[52px] place-items-center overflow-hidden rounded-md bg-surface-100" aria-hidden="true">
                    {it.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveMediaUrl(it.product_image)} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <Icon name="package" size={20} className="text-text-faint" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block break-words font-semibold text-ink">{it.product_title}</span>
                    {it.product_title_bn && (
                      <span className="font-bangla block break-words text-[12px] text-text-faint" lang="bn">{it.product_title_bn}</span>
                    )}
                    {Object.keys(it.variant_options).length > 0 && (
                      <span className="block text-label text-text-muted">{optionsLabel(it.variant_options)}</span>
                    )}
                    <span className="text-label text-text-muted">
                      Qty {it.quantity} · {formatBDT(Number(it.unit_price))}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-ink tabular-nums">{formatBDT(Number(it.line_total))}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Amounts */}
          {data.amounts && (
            <section className="rounded-lg border border-border p-4">
              <h2 className="mb-3 text-h3 font-bold tracking-snug text-ink">Payment summary</h2>
              <dl className="space-y-1.5 text-body-sm">
                <Amt label="Subtotal" v={data.amounts.subtotal} />
                {Number(data.amounts.discount ?? 0) > 0 && <Amt label="Discount" v={data.amounts.discount!} green prefix="− " />}
                {data.amounts.delivery_charge && <Amt label="Delivery" v={data.amounts.delivery_charge} />}
                {Number(data.amounts.cod_surcharge ?? 0) > 0 && <Amt label="COD fee" v={data.amounts.cod_surcharge!} />}
                {Number(data.amounts.vat ?? 0) > 0 && <Amt label="VAT (included)" v={data.amounts.vat!} muted />}
                <div className="flex justify-between border-t border-border pt-2 text-body font-bold text-ink">
                  <dt>Grand total</dt>
                  <dd className="tabular-nums">{formatBDT(Number(data.amounts.grand_total))}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Tracker card with shipment note inside + collapsible history */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 text-h3 font-bold tracking-snug text-ink">Tracking</h2>
            <StatusTracker
              status={data.status}
              shipmentNote={hasShipment ? <ShipmentNote courier={data.shipment?.courier_name} tracking={data.shipment?.tracking_number} /> : undefined}
            />
            {data.history.length > 0 && (
              <details className="mt-4 border-t border-border pt-3">
                <summary className="cursor-pointer text-body-sm font-semibold text-ink">Status history</summary>
                <ol className="mt-2 space-y-2">
                  {data.history.map((h, i) => (
                    <li key={i} className="flex justify-between gap-3 text-label">
                      <span className="break-words text-text-muted">
                        {h.to_status.replace(/_/g, " ")}{h.note ? ` — ${h.note}` : ""}
                      </span>
                      <span className="shrink-0 text-text-faint">{formatDateTime(h.created_at)}</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </section>

          {/* Delivery address */}
          {data.address && (
            <section className="rounded-lg border border-border p-4 text-body-sm text-text-muted">
              <h2 className="mb-2 text-h3 font-bold tracking-snug text-ink">Delivery address</h2>
              <p className="break-words font-semibold text-ink">{data.address.recipient_name}</p>
              <p>{data.address.recipient_phone}</p>
              <p className="mt-1 break-words">
                {data.address.address_line}
                {data.address.area ? `, ${data.address.area}` : ""}
                {data.address.district ? `, ${data.address.district}` : ""}
                {data.address.division ? `, ${data.address.division}` : ""}
              </p>
            </section>
          )}

          {/* Actions — always rendered; disabled-with-reason when ineligible */}
          <section className="rounded-lg border border-border p-4" aria-live="polite">
            <h2 className="mb-3 text-h3 font-bold tracking-snug text-ink">Need help with this order?</h2>
            <div className="space-y-2">
              <ActionButton
                label="Cancel order"
                onClick={() => setConfirmCancel(true)}
                disabled={!cancellable}
                reason={cancelReason}
                reasonId="cancel-reason"
              />
              {exchangeEligible ? (
                <Link
                  href={`/account/orders/${orderNo}/exchange`}
                  className="flex h-11 w-full items-center justify-center rounded-md border border-border-strong text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-50"
                >
                  Request exchange
                </Link>
              ) : (
                <ActionButton label="Request exchange" disabled reason={exchangeReason} reasonId="exchange-reason" />
              )}
              <Link
                href={`/orders/${encodeURIComponent(orderNo)}/invoice`}
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-md border border-border-strong text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-50"
              >
                <Icon name="download" size={16} aria-hidden="true" /> Download invoice
              </Link>
            </div>
            <p className="mt-3 text-label text-text-muted">
              Returns are exchange-only within 30 days. Worn or used items aren&apos;t eligible.
            </p>
          </section>
        </div>
      </div>

      <CancelOrderDialog
        open={confirmCancel}
        isPrepaid={isPrepaid}
        pending={cancel.isPending}
        onConfirm={onCancel}
        onClose={() => setConfirmCancel(false)}
      />
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  reason,
  reasonId,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  reason?: string;
  reasonId?: string;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-describedby={disabled && reason ? reasonId : undefined}
        className="flex h-11 w-full items-center justify-center rounded-md border border-border-strong text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
      >
        {label}
      </button>
      {disabled && reason && (
        <p id={reasonId} className="mt-1 text-label text-text-muted">{reason}</p>
      )}
    </div>
  );
}

function Amt({ label, v, green, muted, prefix }: { label: string; v: string; green?: boolean; muted?: boolean; prefix?: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-text-muted">{label}</dt>
      <dd className={(green ? "text-success" : muted ? "text-text-muted" : "text-ink") + " tabular-nums"}>
        {prefix}{formatBDT(Number(v))}
      </dd>
    </div>
  );
}
