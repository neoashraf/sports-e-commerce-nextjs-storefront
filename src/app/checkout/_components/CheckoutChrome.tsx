import Link from "next/link";

/**
 * Reduced checkout chrome (checkout.md §3, checkout-fe AC1). Rendered inside the
 * storefront shell's <main>; adds a slim "Secure checkout" bar + back-to-cart
 * above the steps. (A fully chrome-less route group is a follow-up; the shell
 * header still provides brand/nav — noted in the PR.)
 */
export function CheckoutChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
        <h1 className="text-h3 font-bold text-ink">Secure checkout</h1>
        <Link href="/cart" className="text-body-sm font-semibold text-volt-600 hover:underline">
          Back to cart
        </Link>
      </div>
      {children}
    </div>
  );
}
