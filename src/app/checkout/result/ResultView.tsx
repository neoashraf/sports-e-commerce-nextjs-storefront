"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePaymentStatus, useRetryPayment } from "@/lib/api/hooks/payments";
import { toast } from "@/lib/stores/toast";

const POLL_TIMEOUT_MS = 30_000;

/**
 * Payment result (payment-result.md, pay-result-fe). A processing interstitial
 * that polls the AUTHORITATIVE payment status (never trusts the URL `status`),
 * then renders success / failed / cancelled / still-confirming. Retry
 * re-initiates payment; "choose another method" returns to checkout.
 */
export function ResultView() {
  const router = useRouter();
  const sp = useSearchParams();
  // The gateway return carries `ref` (the PAY-… capability token); status is polled by ref.
  const ref = sp.get("ref") ?? "";

  const { data, isError } = usePaymentStatus(ref);
  const retry = useRetryPayment();
  const [timedOut, setTimedOut] = useState(false);

  // Order number for deep-links comes from the authoritative status, falling back to the URL.
  const orderNo = data?.order_no ?? sp.get("order") ?? "";

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  const status = data?.status;
  const terminal = status === "paid" || status === "failed" || status === "cancelled" || status === "cod_pending";

  async function onRetry() {
    if (!data?.order_id) {
      router.push("/checkout");
      return;
    }
    try {
      const res = await retry.mutateAsync({ order_id: data.order_id, method: data.method ?? "bkash" });
      if (res.action === "redirect" && res.redirect_url) window.location.href = res.redirect_url;
      else router.refresh();
    } catch {
      toast("Couldn't retry the payment. Try another method.", "error");
    }
  }

  // Processing (not yet terminal).
  if (!terminal) {
    return (
      <Centered>
        <div aria-live="polite">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <h1 className="mt-4 text-lg font-semibold text-gray-900">
            {timedOut ? "Still confirming your payment…" : "Confirming your payment…"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {timedOut
              ? "This is taking a little longer than usual. You don't need to pay again — we'll update your order as soon as it's confirmed."
              : "Please wait a moment — don't close this page."}
          </p>
          {(timedOut || isError) && (
            <Link href={orderNo ? `/account/orders/${orderNo}` : "/account/orders"} className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
              Check your order
            </Link>
          )}
        </div>
      </Centered>
    );
  }

  if (status === "paid" || status === "cod_pending") {
    return (
      <Centered>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Payment successful</h1>
        <p className="mt-1 text-sm text-gray-600">Your order {orderNo} is confirmed.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/orders/${orderNo}/confirmation`} className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white hover:bg-gray-800">
            View order
          </Link>
        </div>
      </Centered>
    );
  }

  // failed / cancelled
  return (
    <Centered>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-2xl text-red-700">!</div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        {status === "cancelled" ? "Payment cancelled" : "Payment failed"}
      </h1>
      <p className="mt-1 text-sm text-gray-600">No charge was made. You can try again.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={onRetry} disabled={retry.isPending} className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
          {retry.isPending ? "Retrying…" : "Retry payment"}
        </button>
        <Link href="/checkout" className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-6 text-sm font-medium text-gray-800 hover:bg-gray-50">
          Choose another method
        </Link>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">{children}</div>;
}
