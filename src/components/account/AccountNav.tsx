"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

/**
 * My-Account sub-nav (account-home §3). Kit `.ac2-subnav`: a sticky vertical
 * sidebar at ≥880px (active item = ink bg + volt icon), collapsing to a
 * horizontal, scrollable segmented tab control below 880px (RW7 — so the nav
 * never disappears on mobile). Active detection + hrefs unchanged.
 */
const LINKS = [
  { href: "/account", label: "Overview", icon: "layout-grid" },
  { href: "/account/orders", label: "Orders", icon: "package" },
  { href: "/account/enquiries", label: "My enquiries", icon: "inbox" },
  { href: "/account/addresses", label: "Addresses", icon: "map-pin" },
  { href: "/wishlist", label: "Wishlist", icon: "heart" },
  { href: "/account/settings", label: "Settings", icon: "settings" },
];

export function AccountNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <nav aria-label="My account">
      {/* Desktop (≥880px) — vertical sidebar */}
      <ul className="hidden min-[880px]:flex min-[880px]:flex-col min-[880px]:gap-1">
        {LINKS.map((l) => {
          const active = isActive(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-body-sm font-semibold transition-colors duration-micro ease-out focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 motion-reduce:transition-none ${
                  active ? "bg-ink text-white" : "text-ink hover:bg-surface-100"
                }`}
              >
                <Icon name={l.icon} size={18} color={active ? "var(--volt)" : "currentColor"} />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Mobile (<880px) — horizontal scrollable segmented tabs */}
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 min-[880px]:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LINKS.map((l) => {
          const active = isActive(l.href);
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-body-sm font-semibold transition-colors duration-micro ease-out focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 motion-reduce:transition-none ${
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-border-strong text-ink hover:border-volt-600 hover:text-volt-600"
                }`}
              >
                <Icon name={l.icon} size={16} color={active ? "var(--volt)" : "currentColor"} />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
