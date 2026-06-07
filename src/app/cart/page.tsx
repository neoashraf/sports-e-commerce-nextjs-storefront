import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

/**
 * Cart page — `/cart` (cart-core-fe). Public, no auth gate. Cart management
 * only; delivery/VAT/total are "calculated at checkout" placeholders and the
 * checkout CTA routes to the deferred stub.
 */
export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return <CartView />;
}
