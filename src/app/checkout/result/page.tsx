import { Suspense } from "react";
import type { Metadata } from "next";
import { ResultView } from "./ResultView";

export const metadata: Metadata = { title: "Payment", robots: { index: false, follow: false } };

/**
 * Payment result — `/checkout/result?order=…&status=…` (pay-result-fe). Polls
 * the authoritative payment status; never declares success from the URL.
 */
export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-20 text-center">Confirming…</div>}>
      <ResultView />
    </Suspense>
  );
}
