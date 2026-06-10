"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Persistent My-Account sub-nav (desktop) — account-home §3. */
const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="My account" className="space-y-1">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`block rounded-md px-3 py-2 text-body-sm transition-colors duration-micro ease-out ${
              active
                ? "border-l-2 border-volt-600 bg-surface-100 font-semibold text-ink"
                : "text-text-muted hover:bg-surface-50 hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
