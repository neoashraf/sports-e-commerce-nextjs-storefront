"use client";

import Link from "next/link";
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Success header */}
      <div className="text-center" aria-live="polite">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success" aria-hidden="true">
          <Icon name="check" size={32} />
        </div>
        <h1 className="mt-4 text-h1 font-bold text-ink">Order confirmed</h1>
        <p className="mt-1 text-body text-text-muted">
          Thank you for your order — <span className="font-semibold text-ink">{orderNo}</span> is placed.
        </p>
        {data?.placed_at && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-body-sm text-text-muted">
            <Icon name="calendar" size={14} aria-hidden="true" />
            {formatDate(data.placed_at)}
          </p>
        )}
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

      {!isAuth && (
        <p className="mt-6 text-center text-body-sm text-text-muted">
          Want to track this order anytime?{" "}
          <Link href="/track" className="font-semibold text-volt-600 hover:underline">
            Track as guest
          </Link>{" "}
          with your order number and phone, or create an account.
        </p>
      )}

      <div className="mt-8 flex justify-center gap-3">
        {isAuth && (
          <Link
            href={`/account/orders/${orderNo}`}
            className="inline-flex h-11 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
          >
            View / track order
          </Link>
        )}
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md border border-border-strong px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
        >
          Continue shopping
        </Link>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[12px] text-text-faint">
        <Icon name="refresh-cw" size={13} aria-hidden="true" />
        Returns are exchange-only within 30 days.
      </p>
    </div>
  );
}
