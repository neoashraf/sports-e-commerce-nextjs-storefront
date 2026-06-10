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
  const orderNo = sp.get("order") ?? "";

  const { data, isError } = usePaymentStatus(orderNo);
  const retry = useRetryPayment();
  const [timedOut, setTimedOut] = useState(false);

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

  // Processing — still polling, within the confirmation window. Spinner.
  if (!terminal && !timedOut && !isError) {
    return (
      <Centered>
        <div aria-live="polite">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-ink motion-reduce:animate-none" />
          <h1 className="mt-4 text-h3 font-bold text-ink">Confirming your payment…</h1>
          <p className="mt-1 text-body-sm text-text-muted">Please wait a moment — don&apos;t close this page.</p>
        </div>
      </Centered>
    );
  }

  // Non-terminal but we've stopped waiting (timed out or the status lookup failed).
  // The payment may still be confirmed out-of-band by the gateway IPN / reconciliation,
  // so reassure rather than spin forever, and offer clear next steps.
  if (!terminal) {
    return (
      <Centered>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-warning/10 text-2xl text-warning" aria-hidden="true">⏳</div>
        <h1 className="mt-4 text-h1 font-bold text-ink">Still confirming your payment</h1>
        <p className="mt-1 text-body text-text-muted">
          You don&apos;t need to pay again. If your account was charged, your order
          {orderNo ? ` ${orderNo}` : ""} will update automatically once the bank confirms — usually within a few minutes.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={orderNo ? `/account/orders/${orderNo}` : "/account/orders"}
            className="inline-flex h-11 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
          >
            Check your order
          </Link>
          {data?.order_id && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retry.isPending}
              className="inline-flex h-11 items-center rounded-md border border-border-strong px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100 disabled:opacity-50"
            >
              {retry.isPending ? "Retrying…" : "Retry payment"}
            </button>
          )}
        </div>
      </Centered>
    );
  }

  if (status === "paid" || status === "cod_pending") {
    return (
      <Centered>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-2xl text-success" aria-hidden="true">✓</div>
        <h1 className="mt-4 text-h1 font-bold text-ink">Payment successful</h1>
        <p className="mt-1 text-body text-text-muted">Your order {orderNo} is confirmed.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/orders/${orderNo}/confirmation`} className="inline-flex h-11 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600">
            View order
          </Link>
        </div>
      </Centered>
    );
  }

  // failed / cancelled
  return (
    <Centered>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-error/10 text-2xl text-error" aria-hidden="true">!</div>
      <h1 className="mt-4 text-h1 font-bold text-ink">
        {status === "cancelled" ? "Payment cancelled" : "Payment failed"}
      </h1>
      <p className="mt-1 text-body text-text-muted">No charge was made. You can try again.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={onRetry} disabled={retry.isPending} className="inline-flex h-11 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:opacity-50">
          {retry.isPending ? "Retrying…" : "Retry payment"}
        </button>
        <Link href="/checkout" className="inline-flex h-11 items-center rounded-md border border-border-strong px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100">
          Choose another method
        </Link>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">{children}</div>;
}
