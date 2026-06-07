import type { Metadata } from "next";
import { CheckoutChrome } from "./_components/CheckoutChrome";
import { CheckoutFlow } from "./_components/CheckoutFlow";

/**
 * Checkout — `/checkout` (checkout-fe). Address → delivery & payment → review →
 * place, inside the reduced checkout chrome. The order summary is always the
 * server quote value; placement is idempotent. COD → confirmation, online →
 * gateway redirect.
 */
export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <CheckoutChrome>
      <CheckoutFlow />
    </CheckoutChrome>
  );
}
