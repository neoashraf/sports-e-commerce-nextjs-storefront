"use client";

import Link from "next/link";
import { useOrderHistory } from "@/lib/api/hooks/orders";
import { formatBDT, formatDate } from "@/lib/format";

/**
 * Order history (order-history.md, ord-storefront-fe AC2). Paginated
 * newest-first list under My Account; each row links to the detail page. Empty
 * + loading + error states.
 */
export function OrderHistoryView() {
  const { data, isLoading, isError, refetch } = useOrderHistory(1);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-100" />
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
  if (orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-h3 font-bold tracking-snug text-ink">No orders yet</h1>
        <Link href="/" className="mt-2 inline-block text-body-sm font-medium text-volt-600 hover:underline">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-h1 font-bold tracking-snug text-ink">My orders</h1>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.order_no}>
            <Link
              href={`/account/orders/${o.order_no}`}
              className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors duration-micro ease-out hover:border-border-strong"
            >
              <span>
                <span className="block text-body-sm font-semibold text-ink">{o.order_no}</span>
                <span className="block text-label text-text-muted">{formatDate(o.placed_at)} · {o.status.replace(/_/g, " ")}</span>
              </span>
              {o.grand_total && <span className="text-body-sm font-medium text-ink tabular-nums">{formatBDT(Number(o.grand_total))}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
