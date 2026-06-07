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
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Thank you for your order!</h1>
      <p className="mt-1 text-sm text-gray-600">
        Your order <span className="font-semibold">{orderNo}</span> has been placed.
      </p>

      {isLoading ? (
        <div className="mt-8 h-24 animate-pulse rounded-lg bg-gray-100" />
      ) : data ? (
        <div className="mt-8 rounded-lg border border-gray-200 p-5 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <span className="font-semibold text-gray-900">{formatBDT(Number(data.amounts?.grand_total ?? 0))}</span>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            {isCod
              ? "Pay cash when your order is delivered. We'll text you delivery updates."
              : "Your payment is confirmed. We'll text you delivery updates."}
          </p>
        </div>
      ) : null}

      {!isAuth && (
        <p className="mt-6 text-sm text-gray-500">
          Want to track this order anytime? <Link href="/track" className="font-medium text-brand-600 hover:underline">Track as guest</Link> or create an account.
        </p>
      )}

      <div className="mt-8 flex justify-center gap-3">
        {isAuth && (
          <Link href={`/account/orders/${orderNo}`} className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white hover:bg-gray-800">
            View order
          </Link>
        )}
        <Link href="/" className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-6 text-sm font-medium text-gray-800 hover:bg-gray-50">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
