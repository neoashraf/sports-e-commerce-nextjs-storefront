import Link from "next/link";

/**
 * Brand mark — the constant "home" affordance in the header (storefront-shell
 * §5 Logo). Placeholder wordmark for the MVP; swap for the final asset later.
 */
export function Logo() {
  return (
    <Link
      href="/"
      aria-label="Home"
      className="inline-flex shrink-0 items-center rounded-md text-lg font-extrabold tracking-tight text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      <span className="text-brand-600">Sport</span>Shop
      <span className="ml-1 text-xs font-semibold text-gray-400">BD</span>
    </Link>
  );
}
