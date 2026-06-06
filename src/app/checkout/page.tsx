import type { Metadata } from "next";
import Link from "next/link";

/**
 * Deferred checkout stub (cart-core-fe Ambiguities). The cart/mini-cart CTAs
 * route here; the real checkout (address, delivery, payment, placement) lands in
 * checkout-fe. Until then this is a "coming soon" placeholder.
 */
export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Checkout is coming soon</h1>
      <p className="text-sm text-gray-500">
        We&apos;re putting the finishing touches on checkout. Your cart is saved.
      </p>
      <Link href="/cart" className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white hover:bg-gray-800">
        Back to cart
      </Link>
    </div>
  );
}
