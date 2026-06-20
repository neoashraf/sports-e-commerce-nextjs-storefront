"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrderHistory } from "@/lib/api/hooks/orders";
import { formatBDT, formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "./StatusBadge";

/**
 * Order history (order-history.md) — RW7 fidelity per ui_kits/account-orders.
 * Thumb'd rows with a "Placed {date} · {N} items" subline + total, a semantic
 * status badge, View-order always + Track for shipped/out-for-delivery, a count
 * subhead, Prev/Next pagination (presentation-only — bound to the existing page
 * param, no new fetch), and a two-line empty state.
 *
 * DATA GAP (flagged, owned by rw6-order-confirmation-data): the list payload has
 * no per-order thumbnail, no payment label, and no page-total — so each row uses a
 * placeholder thumb, the line shows just the total, and the pager is a minimal
 * Prev/Next driven by the returned page length (no total-count endpoint).
 */
const TRACKABLE = new Set(["shipped", "out_for_delivery"]);
const PAGE_SIZE = 20;

export function OrderHistoryView() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = useOrderHistory(page);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-100" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-lg border border-border p-4">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-md bg-surface-100" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-28 animate-pulse rounded bg-surface-100" />
              <div className="h-3 w-40 animate-pulse rounded bg-surface-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-body-sm text-text-muted">Couldn&apos;t load your orders.</p>
        <button type="button" onClick={() => refetch()} className="mt-2 text-body-sm font-medium text-volt-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const orders = data ?? [];
  if (orders.length === 0 && page === 1) {
    return (
      <div className="rounded-lg border border-border bg-white px-6 py-16 text-center">
        <span className="mx-auto mb-[18px] grid h-[60px] w-[60px] place-items-center rounded-full bg-surface-100" aria-hidden="true">
          <Icon name="package" size={26} className="text-text-muted" />
        </span>
        <h1 className="text-[19px] font-bold tracking-snug text-ink">No orders yet — your past orders will appear here.</h1>
        <p className="mt-1.5 text-body-sm text-text-muted">When you place an order, you can track it from here.</p>
        <Link
          href="/"
          className="mt-5 inline-flex h-[52px] items-center rounded-md bg-volt px-7 text-[15px] font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  // No total-count on the payload (flagged): show "{N} orders" for the current page;
  // a full page implies a possible next page.
  const hasNext = orders.length >= PAGE_SIZE;

  return (
    <div>
      {/* Breadcrumb (kit .ac-bc): Account › Orders */}
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-[13px] text-text-muted">
        <Link href="/account" className="hover:text-cyan-600">Account</Link>
        <Icon name="chevron-right" size={14} className="text-text-faint" aria-hidden="true" />
        <span className="font-semibold text-ink">Orders</span>
      </nav>

      <h1 className="text-h1 font-extrabold tracking-snug text-ink">Your orders</h1>
      <p className="mb-4 mt-1 text-body-sm text-text-muted">
        {orders.length} {orders.length === 1 ? "order" : "orders"}
        {page > 1 ? ` · page ${page}` : ""}
      </p>

      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.order_no}>
            <div className="grid grid-cols-[64px_1fr] items-center gap-3.5 rounded-lg border border-border bg-white p-4 transition-shadow duration-micro ease-out hover:shadow-card sm:grid-cols-[72px_1fr_auto] motion-reduce:transition-none">
              {/* Thumbnail placeholder — the list payload has no per-order image (flagged in header doc). */}
              <Link
                href={`/account/orders/${o.order_no}`}
                aria-label={`Order ${o.order_no}`}
                className="grid aspect-[4/5] w-16 place-items-center overflow-hidden rounded-md bg-surface-100 sm:w-[72px]"
              >
                <Icon name="package" size={24} className="text-text-faint" aria-hidden="true" />
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/account/orders/${o.order_no}`}
                  className="text-[15px] font-bold tabular-nums text-ink hover:underline hover:decoration-cyan-600"
                >
                  {o.order_no}
                </Link>
                <p className="mt-0.5 text-[13px] text-text-muted">
                  Placed {formatDate(o.placed_at)}
                  {typeof o.item_count === "number" ? ` · ${o.item_count} ${o.item_count === 1 ? "item" : "items"}` : ""}
                </p>
                {o.grand_total && (
                  <p className="mt-0.5 text-[13px] text-text-muted">
                    Total <span className="font-bold text-ink tabular-nums">{formatBDT(Number(o.grand_total))}</span>
                  </p>
                )}
              </div>
              <div className="col-span-2 mt-2.5 flex flex-wrap items-center justify-between gap-3 sm:col-span-1 sm:mt-0 sm:flex-col sm:items-end">
                <StatusBadge status={o.status} />
                <div className="flex gap-2">
                  {TRACKABLE.has(o.status) && (
                    <Link
                      href={`/account/orders/${o.order_no}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border-strong bg-white px-3.5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
                    >
                      <Icon name="truck" size={15} aria-hidden="true" /> Track
                    </Link>
                  )}
                  {/* Kit "View order" = secondary (bordered white), not filled ink. */}
                  <Link
                    href={`/account/orders/${o.order_no}`}
                    className="inline-flex h-9 items-center rounded-md border border-border-strong bg-white px-3.5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
                  >
                    View order
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pager — Prev / page / Next bound to the existing page param (no new fetch) */}
      {(page > 1 || hasNext) && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="inline-flex h-10 items-center gap-1 rounded-md border border-border-strong px-3 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-50 disabled:opacity-40"
          >
            <Icon name="chevron-left" size={16} aria-hidden="true" /> Previous
          </button>
          <span aria-current="page" className="grid h-10 min-w-10 place-items-center rounded-md bg-ink px-3 text-body-sm font-bold text-white">
            {page}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || isFetching}
            className="inline-flex h-10 items-center gap-1 rounded-md border border-border-strong px-3 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-50 disabled:opacity-40"
          >
            Next <Icon name="chevron-right" size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
