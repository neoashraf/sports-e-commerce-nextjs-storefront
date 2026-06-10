"use client";

import Link from "next/link";
import { useOrderDetail } from "@/lib/api/hooks/orders";
import { useAuthStore } from "@/lib/stores/auth";
import { formatBDT } from "@/lib/format";

/**
 * Order confirmation (order-confirmation.md, ord-storefront-fe AC1). Reached
 * from checkout (COD) / payment-result (online). Success header + summary + next
 * steps (COD vs online) + a guest claim hint.
 */
export function ConfirmationView({ orderNo }: { orderNo: string }) {
  const { data, isLoading } = useOrderDetail(orderNo);
  const isAuth = !!useAuthStore((s) => s.tokens);

  const isCod = data?.payment_method === "cod";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-2xl text-success" aria-hidden="true">✓</div>
      <h1 className="mt-4 text-h1 font-bold text-ink">Thank you for your order!</h1>
      <p className="mt-1 text-body text-text-muted">
        Your order <span className="font-semibold text-ink">{orderNo}</span> has been placed.
      </p>

      {isLoading ? (
        <div className="mt-8 h-24 animate-pulse rounded-lg bg-surface-100" />
      ) : data ? (
        <div className="mt-8 rounded-lg border border-border p-5 text-left">
          <div className="flex justify-between text-body-sm">
            <span className="text-text-muted">Total</span>
            <span className="font-bold tabular-nums text-ink">{formatBDT(Number(data.amounts?.grand_total ?? 0))}</span>
          </div>
          <p className="mt-3 text-body-sm text-text-muted">
            {isCod
              ? "Pay cash when your order is delivered. We'll text you delivery updates."
              : "Your payment is confirmed. We'll text you delivery updates."}
          </p>
        </div>
      ) : null}

      {!isAuth && (
        <p className="mt-6 text-body-sm text-text-muted">
          Want to track this order anytime? <Link href="/track" className="font-semibold text-volt-600 hover:underline">Track as guest</Link> or create an account.
        </p>
      )}

      <div className="mt-8 flex justify-center gap-3">
        {isAuth && (
          <Link href={`/account/orders/${orderNo}`} className="inline-flex h-11 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600">
            View order
          </Link>
        )}
        <Link href="/" className="inline-flex h-11 items-center rounded-md border border-border-strong px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
