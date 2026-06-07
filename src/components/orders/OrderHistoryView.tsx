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
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-600">Couldn&apos;t load your orders.</p>
        <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-medium text-brand-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const orders = data ?? [];
  if (orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-lg font-semibold text-gray-900">No orders yet</h1>
        <Link href="/" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">My orders</h1>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.order_no}>
            <Link
              href={`/account/orders/${o.order_no}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-400"
            >
              <span>
                <span className="block text-sm font-semibold text-gray-900">{o.order_no}</span>
                <span className="block text-xs text-gray-500">{formatDate(o.placed_at)} · {o.status.replace(/_/g, " ")}</span>
              </span>
              {o.grand_total && <span className="text-sm font-medium text-gray-900">{formatBDT(Number(o.grand_total))}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
