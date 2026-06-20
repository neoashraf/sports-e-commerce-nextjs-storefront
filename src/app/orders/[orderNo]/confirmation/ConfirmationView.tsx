"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrderDetail } from "@/lib/api/hooks/orders";
import { useAuthStore } from "@/lib/stores/auth";
import { formatBDT, formatDate } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { copyToClipboard } from "@/lib/clipboard";
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
          {/* Solid green ring sits inside a soft green halo (kit .oc-check) */}
          <div className="mx-auto mb-[18px] grid h-[72px] w-[72px] place-items-center rounded-full bg-success/[0.12]" aria-hidden="true">
            <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-success motion-safe:animate-[pop_0.45s_cubic-bezier(0.16,1,0.3,1)_both]">
              <Icon name="check" size={36} color="#fff" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Order confirmed</h1>
          <p className="mt-1 mb-[18px] text-[15px] text-text-muted">Thank you for your order</p>
          <div className="flex justify-center">
            <CopyOrderNo orderNo={orderNo} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-text-muted">
            {data?.placed_at && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar" size={14} aria-hidden="true" /> {formatDate(data.placed_at)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[7px] w-[7px] rounded-full bg-success" aria-hidden="true" /> Confirmed
            </span>
            {isCod ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="wallet" size={14} aria-hidden="true" /> Cash on delivery
              </span>
            ) : gatewayLabel ? (
              <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-success/[0.12] px-2.5 text-[12px] font-bold text-success">
                <Icon name="check-circle" size={13} aria-hidden="true" /> Paid via {gatewayLabel}
              </span>
            ) : null}
          </div>
        </div>

      {isLoading ? (
        <div className="mt-4 space-y-3" aria-hidden="true">
          <div className="h-24 animate-pulse rounded-lg bg-surface-100" />
          <div className="h-40 animate-pulse rounded-lg bg-surface-100" />
        </div>
      ) : isError || !data ? (
        // Fetch-error fallback: the order IS placed; we just couldn't load the details.
        <div className="mt-4 rounded-lg border border-border bg-white p-5 text-center text-body-sm text-text-muted">
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
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-white p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink" aria-hidden="true">
              <Icon name={isCod ? "truck" : "check-circle"} size={20} color="var(--volt)" />
            </span>
            <div>
              <p className="text-[15px] font-bold text-ink">
                {isCod
                  ? `Pay ${formatBDT(n(amounts?.grand_total))} when your order arrives.`
                  : "We've received your payment."}
              </p>
              <p className="mt-1 text-body-sm text-text-muted">
                We&apos;ll text and email you as your order progresses.
              </p>
            </div>
          </div>

          {/* Order summary — two columns on desktop: item lines left, totals + address right (kit .oc-summary-grid) */}
          <div className="mt-4 rounded-lg border border-border bg-white p-5">
            <h2 className="text-[16px] font-bold text-ink">Order summary</h2>

            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr] md:gap-7">
              {/* Left: item lines */}
              <ul className="divide-y divide-border">
                {data.items.map((it, i) => (
                  <li key={it.sku_code ?? i} className="grid grid-cols-[52px_1fr_auto] items-start gap-3 py-3">
                    <div className="aspect-[4/5] w-[52px] shrink-0 overflow-hidden rounded-sm bg-surface-100">
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
                        <span className="grid h-full w-full place-items-center">
                          <Icon name="image" size={20} className="text-text-faint" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
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

              {/* Right: amounts breakdown + delivery address */}
              <div>
                {amounts && (
                  <dl className="text-body-sm">
                    <div className="flex items-baseline justify-between gap-3 py-[7px]">
                      <dt className="text-text-muted">Subtotal</dt>
                      <dd className="font-semibold tabular-nums text-ink">{formatBDT(n(amounts.subtotal))}</dd>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-baseline justify-between gap-3 py-[7px]">
                        <dt className="text-text-muted">Discount</dt>
                        <dd className="font-semibold tabular-nums text-success">− {formatBDT(discount)}</dd>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between gap-3 py-[7px]">
                      <dt className="text-text-muted">Delivery</dt>
                      <dd className="font-semibold tabular-nums text-ink">{formatBDT(n(amounts.delivery_charge))}</dd>
                    </div>
                    {isCod && codFee > 0 && (
                      <div className="flex items-baseline justify-between gap-3 py-[7px]">
                        <dt className="text-text-muted">COD fee</dt>
                        <dd className="font-semibold tabular-nums text-ink">{formatBDT(codFee)}</dd>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between gap-3 py-[7px]">
                      <dt className="text-text-muted">VAT (included)</dt>
                      <dd className="font-medium tabular-nums text-text-muted">{formatBDT(n(amounts.vat))}</dd>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-border pt-3">
                      <dt className="text-[16px] font-extrabold text-ink">Total</dt>
                      <dd className="text-[19px] font-extrabold tabular-nums text-ink">{formatBDT(n(amounts.grand_total))}</dd>
                    </div>
                  </dl>
                )}

                {/* Delivery to */}
                {data.address && (
                  <div className="mt-[14px] border-t border-border pt-[14px]">
                    <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-faint">Delivery to</p>
                    <p className="text-body-sm font-semibold text-ink">
                      {data.address.recipient_name}{" "}
                      <span className="font-normal text-text-muted">· {data.address.recipient_phone}</span>
                    </p>
                    <p className="break-words text-body-sm leading-normal text-text-muted">
                      {[data.address.address_line, data.address.area, data.address.district, data.address.division]
                        .filter(Boolean)
                        .join(", ")}
                      {data.address.postal_code ? ` - ${data.address.postal_code}` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

        {/* Guest claim hint */}
        {!isAuth && (
          <div className="mt-4 flex items-start gap-3 rounded-md border border-cyan-600/25 bg-cyan-600/[0.07] p-4">
            <Icon name="bookmark" size={20} color="var(--cyan-600)" aria-hidden="true" className="mt-px shrink-0" />
            <div className="min-w-0">
              <p className="text-body-sm font-bold text-ink">Save your order — track anytime with your order number and phone</p>
              <p className="mt-1 text-[13px] text-text-muted">
                Track this order anytime, or create an account to save addresses and reorder faster.
              </p>
              <Link
                href="/track"
                className="mt-2.5 inline-flex h-[36px] items-center gap-2 whitespace-nowrap rounded-md border border-border-strong bg-transparent px-[14px] text-body-sm font-semibold leading-none text-ink transition-colors duration-micro ease-out hover:bg-surface-100 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1"
              >
                <Icon name="search" size={16} aria-hidden="true" /> Track with order number &amp; phone
              </Link>
            </div>
          </div>
        )}

        {/* Actions — DS Button lg: primary (volt) + secondary (bordered), full-width, two-up on ≥560px */}
        <div className="mt-[18px] grid grid-cols-1 gap-2.5 min-[560px]:grid-cols-2">
          <Link
            href={isAuth ? `/account/orders/${orderNo}` : "/track"}
            className="inline-flex h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent bg-volt px-[28px] text-[15px] font-semibold leading-none text-ink transition-colors duration-micro ease-out hover:bg-volt-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1"
          >
            <Icon name="package-search" size={18} aria-hidden="true" /> View / track order
          </Link>
          <Link
            href="/"
            className="inline-flex h-[52px] items-center justify-center whitespace-nowrap rounded-md border border-border-strong bg-white px-[28px] text-[15px] font-semibold leading-none text-ink transition-colors duration-micro ease-out hover:bg-surface-100 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1"
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
  async function copy() {
    // Copy the full order number (incl. the "SO-" prefix). Only confirm on a real success —
    // navigator.clipboard is undefined on non-secure origins, where copyToClipboard falls back
    // to execCommand so the whole value is actually written rather than silently dropped.
    const ok = await copyToClipboard(orderNo);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <span className="inline-flex items-center gap-2.5 rounded-md border border-border bg-surface-50 py-1.5 pl-3.5 pr-2 text-[15px] font-bold tabular-nums text-ink">
      {orderNo}
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Order number copied" : "Copy order number"}
        className="grid h-7 w-7 place-items-center rounded-full text-text-muted transition-colors duration-micro ease-out hover:bg-surface-100 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1"
      >
        <Icon name={copied ? "check" : "copy"} size={15} color={copied ? "var(--success)" : undefined} aria-hidden="true" />
      </button>
    </span>
  );
}
