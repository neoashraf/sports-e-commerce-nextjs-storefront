"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrderDetail } from "@/lib/api/hooks/orders";
import { useAuthStore } from "@/lib/stores/auth";
import { formatBDT, formatDate } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { Icon } from "@/components/ui/Icon";

/**
 * Order confirmation (order-confirmation.md, ord-storefront-fe AC1). Reached from
 * checkout (COD) / payment-result (online). Success header + full order summary
 * (item lines, amounts breakdown, delivery address, date) + next steps (COD vs
 * online) + a guest claim hint.
 *
 * RW6 (rw6-order-confirmation-data): the order-detail payload it already fetches
 * now also carries `placed_at` and per-item `product_image` / `product_title_bn`,
 * so this view renders the complete summary from the kit instead of just the total.
 * Presentation only — no new fetch (reuses `useOrderDetail`).
 *
 * Design source: docs/design/design-files/ui_kits/order-confirmation/OrderConfirmation.jsx
 */
function n(v?: string): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function ConfirmationView({ orderNo }: { orderNo: string }) {
  const { data, isLoading, isError } = useOrderDetail(orderNo);
  const isAuth = !!useAuthStore((s) => s.tokens);

  const isCod = data?.payment_method === "cod";
  const amounts = data?.amounts;
  const discount = n(amounts?.discount);
  const codFee = n(amounts?.cod_surcharge);
  const gatewayLabel = data?.payment_method === "bkash" ? "bKash" : data?.payment_method === "sslcommerz" ? "SSLCommerz" : null;

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-[920px] px-4 py-7 sm:px-6 sm:py-9">
        {/* Success header card */}
        <div className="rounded-lg border border-border bg-white px-6 py-7 text-center" aria-live="polite">
          <div className="mx-auto mb-[18px] grid h-[72px] w-[72px] place-items-center rounded-full bg-success motion-safe:animate-[pop_0.45s_cubic-bezier(0.16,1,0.3,1)_both]" aria-hidden="true">
            <Icon name="check" size={36} color="#fff" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Order confirmed</h1>
          <p className="mt-1 text-body-sm text-text-muted">Thank you for your order</p>
          <div className="mt-2 flex justify-center">
            <CopyOrderNo orderNo={orderNo} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
            {data?.placed_at && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar" size={14} aria-hidden="true" /> {formatDate(data.placed_at)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" /> Confirmed
            </span>
            {isCod ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="wallet" size={14} aria-hidden="true" /> Cash on delivery
              </span>
            ) : gatewayLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 font-semibold text-success">
                <Icon name="check-circle" size={13} aria-hidden="true" /> Paid via {gatewayLabel}
              </span>
            ) : null}
          </div>
        </div>

      {isLoading ? (
        <div className="mt-8 space-y-3" aria-hidden="true">
          <div className="h-24 animate-pulse rounded-lg bg-surface-100" />
          <div className="h-40 animate-pulse rounded-lg bg-surface-100" />
        </div>
      ) : isError || !data ? (
        // Fetch-error fallback: the order IS placed; we just couldn't load the details.
        <div className="mt-8 rounded-lg border border-border p-5 text-center text-body-sm text-text-muted">
          Your order is placed — we couldn&apos;t load the details right now.
          {isAuth && (
            <>
              {" "}
              <Link href={`/account/orders/${orderNo}`} className="font-semibold text-volt-600 hover:underline">
                View it in your orders
              </Link>
              .
            </>
          )}
        </div>
      ) : (
        <>
          {/* What happens next */}
          <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-surface-50 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-volt/15 text-volt-600" aria-hidden="true">
              <Icon name={isCod ? "truck" : "check-circle"} size={20} />
            </span>
            <div>
              <p className="text-body font-bold text-ink">
                {isCod
                  ? `Pay ${formatBDT(n(amounts?.grand_total))} when your order arrives.`
                  : "We've received your payment."}
              </p>
              <p className="mt-1 text-body-sm text-text-muted">
                We&apos;ll text and email you as your order progresses.
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="mt-4 rounded-lg border border-border p-5">
            <h2 className="text-h3 font-bold text-ink">Order summary</h2>

            {/* Item lines */}
            <ul className="mt-4 divide-y divide-border">
              {data.items.map((it, i) => (
                <li key={it.sku_code ?? i} className="flex items-start gap-3 py-3">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-100">
                    {it.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(it.product_image)}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon name="image" size={22} className="text-text-faint" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-body-sm font-semibold leading-snug text-ink">{it.product_title}</p>
                    {it.product_title_bn && (
                      <p className="font-bangla break-words text-[12px] leading-relaxed text-text-faint" lang="bn">
                        {it.product_title_bn}
                      </p>
                    )}
                    <p className="mt-0.5 text-[12px] text-text-muted">
                      {Object.entries(it.variant_options ?? {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                      {Object.keys(it.variant_options ?? {}).length > 0 ? " · " : ""}
                      Qty {it.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold tabular-nums text-ink">{formatBDT(n(it.line_total))}</span>
                </li>
              ))}
            </ul>

            {/* Amounts breakdown */}
            {amounts && (
              <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-body-sm">
                <div className="flex justify-between">
                  <dt className="text-text-muted">Subtotal</dt>
                  <dd className="tabular-nums text-ink">{formatBDT(n(amounts.subtotal))}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Discount</dt>
                    <dd className="tabular-nums">− {formatBDT(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-text-muted">Delivery</dt>
                  <dd className="tabular-nums text-ink">{formatBDT(n(amounts.delivery_charge))}</dd>
                </div>
                {isCod && codFee > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">COD fee</dt>
                    <dd className="tabular-nums text-ink">{formatBDT(codFee)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-text-muted">VAT (included)</dt>
                  <dd className="tabular-nums text-text-muted">{formatBDT(n(amounts.vat))}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-body font-bold">
                  <dt className="text-ink">Total</dt>
                  <dd className="tabular-nums text-ink">{formatBDT(n(amounts.grand_total))}</dd>
                </div>
              </dl>
            )}

            {/* Delivery to */}
            {data.address && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-faint">Delivery to</p>
                <p className="text-body-sm font-semibold text-ink">
                  {data.address.recipient_name}{" "}
                  <span className="font-normal text-text-muted">· {data.address.recipient_phone}</span>
                </p>
                <p className="break-words text-body-sm text-text-muted">
                  {[data.address.address_line, data.address.area, data.address.district, data.address.division]
                    .filter(Boolean)
                    .join(", ")}
                  {data.address.postal_code ? ` - ${data.address.postal_code}` : ""}
                </p>
              </div>
            )}
          </div>
        </>
      )}

        {/* Guest claim hint */}
        {!isAuth && (
          <div className="mt-4 flex items-start gap-3 rounded-md border border-cyan-600/25 bg-cyan-600/[0.07] p-4">
            <Icon name="bookmark" size={20} color="var(--cyan-600)" aria-hidden="true" className="mt-px shrink-0" />
            <div className="min-w-0">
              <p className="text-body-sm font-bold text-ink">Save your order — track anytime with your order number and phone</p>
              <p className="mt-0.5 text-xs text-text-muted">
                Track this order anytime, or create an account to save addresses and reorder faster.
              </p>
              <Link href="/track" className="mt-2 inline-flex items-center gap-1.5 text-body-sm font-semibold text-volt-600 hover:underline">
                <Icon name="search" size={16} aria-hidden="true" /> Track with order number &amp; phone
              </Link>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-[18px] grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Link
            href={isAuth ? `/account/orders/${orderNo}` : "/track"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-volt text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
          >
            <Icon name="package-search" size={18} aria-hidden="true" /> View / track order
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-md border border-border-strong text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            Continue shopping
          </Link>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-text-faint">
          <Icon name="refresh-cw" size={13} aria-hidden="true" />
          Returns are exchange-only within 30 days.
        </p>
      </div>
    </div>
  );
}

/** Order number with a Copy↔Copied button (kit CopyableOrderNo). Clipboard failure degrades silently. */
function CopyOrderNo({ orderNo }: { orderNo: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    try {
      void navigator.clipboard?.writeText(orderNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — degrade silently */
    }
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-white py-1 pl-3 pr-1.5 text-body-sm font-bold text-ink">
      {orderNo}
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Order number copied" : "Copy order number"}
        className="grid h-7 w-7 place-items-center rounded-full text-text-muted transition-colors duration-micro ease-out hover:bg-surface-100 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1"
      >
        <Icon name={copied ? "check" : "copy"} size={15} color={copied ? "var(--success)" : undefined} aria-hidden="true" />
      </button>
    </span>
  );
}
