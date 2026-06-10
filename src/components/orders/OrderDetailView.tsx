"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrderDetail, useCancelOrder, isNotFound } from "@/lib/api/hooks/orders";
import { ApiError } from "@/lib/api/errors";
import { formatBDT, formatDateTime } from "@/lib/format";
import { env } from "@/lib/env";
import { toast } from "@/lib/stores/toast";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { StatusTracker } from "./StatusTracker";

const CANCELLABLE = new Set(["pending_payment", "confirmed"]);

function optionsLabel(o: Record<string, string>): string {
  return Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(" · ");
}

/**
 * Order detail (order-detail.md, ord-storefront-fe AC2/AC3/AC4). Status tracker,
 * history, items/amounts/address, cancel (eligible only, prepaid-refund note),
 * request-exchange entry (delivered & in-window), invoice download.
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
  const exchangeEligible = data.status === "delivered" && data.exchange_eligible;

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-h1 font-bold tracking-snug text-ink">Order {data.order_no}</h1>
          {data.placed_at && <p className="text-body-sm text-text-muted">Placed {formatDateTime(data.placed_at)}</p>}
        </div>
        <a
          href={`${env.apiUrl}/me/orders/${encodeURIComponent(orderNo)}/invoice?format=pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-sm font-medium text-volt-600 hover:underline"
        >
          Download invoice
        </a>
      </div>

      <div className="rounded-lg border border-border p-4">
        <StatusTracker status={data.status} />
      </div>

      {data.shipment?.tracking_number && (
        <p className="text-body-sm text-text-muted">
          Courier: <span className="font-medium">{data.shipment.courier_name}</span> · Tracking{" "}
          <span className="font-medium">{data.shipment.tracking_number}</span>
        </p>
      )}

      {/* Items */}
      <section>
        <h2 className="mb-2 text-h3 font-bold tracking-snug text-ink">Items</h2>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {data.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3 p-3 text-body-sm">
              <span className="min-w-0">
                <span className="block break-words font-medium text-ink">{it.product_title}</span>
                {Object.keys(it.variant_options).length > 0 && (
                  <span className="block text-label text-text-muted">{optionsLabel(it.variant_options)}</span>
                )}
                <span className="text-text-muted">Qty {it.quantity}</span>
              </span>
              <span className="shrink-0 font-medium text-ink tabular-nums">{formatBDT(Number(it.line_total))}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Amounts + address */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data.amounts && (
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-2 text-h3 font-bold tracking-snug text-ink">Payment summary</h2>
            <dl className="space-y-1 text-body-sm">
              <Amt label="Subtotal" v={data.amounts.subtotal} />
              {Number(data.amounts.discount ?? 0) > 0 && <Amt label="Discount" v={`-${data.amounts.discount}`} green />}
              {data.amounts.delivery_charge && <Amt label="Delivery" v={data.amounts.delivery_charge} />}
              {Number(data.amounts.cod_surcharge ?? 0) > 0 && <Amt label="COD fee" v={data.amounts.cod_surcharge!} />}
              {Number(data.amounts.vat ?? 0) > 0 && <Amt label="VAT" v={data.amounts.vat!} />}
              <div className="flex justify-between border-t border-border pt-1 font-semibold text-ink">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatBDT(Number(data.amounts.grand_total))}</dd>
              </div>
            </dl>
            <p className="mt-2 text-label text-text-muted">
              {data.payment_method?.toUpperCase()} · {data.payment_state}
            </p>
          </section>
        )}
        {data.address && (
          <section className="rounded-lg border border-border p-4 text-body-sm text-text-muted">
            <h2 className="mb-2 text-h3 font-bold tracking-snug text-ink">Delivery address</h2>
            <p className="font-medium text-ink break-words">{data.address.recipient_name}</p>
            <p>{data.address.recipient_phone}</p>
            <p className="mt-1 break-words">
              {data.address.address_line}
              {data.address.area ? `, ${data.address.area}` : ""}
              {data.address.district ? `, ${data.address.district}` : ""}
              {data.address.division ? `, ${data.address.division}` : ""}
            </p>
          </section>
        )}
      </div>

      {/* History */}
      <section>
        <h2 className="mb-2 text-h3 font-bold tracking-snug text-ink">History</h2>
        <ol className="space-y-2">
          {data.history.map((h, i) => (
            <li key={i} className="flex justify-between gap-3 text-body-sm">
              <span className="break-words text-text-muted">{h.to_status.replace(/_/g, " ")}{h.note ? ` — ${h.note}` : ""}</span>
              <span className="shrink-0 text-text-faint">{formatDateTime(h.created_at)}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {cancellable && (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="inline-flex h-11 items-center rounded-md border border-border-strong px-5 text-body-sm font-medium text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            Cancel order
          </button>
        )}
        {exchangeEligible && (
          <Link
            href={`/account/orders/${orderNo}/exchange`}
            className="inline-flex h-11 items-center rounded-md border border-border-strong px-5 text-body-sm font-medium text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            Request exchange
          </Link>
        )}
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

function Amt({ label, v, green }: { label: string; v: string; green?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-text-muted">{label}</dt>
      <dd className={(green ? "text-success" : "text-ink") + " tabular-nums"}>{formatBDT(Number(v))}</dd>
    </div>
  );
}
