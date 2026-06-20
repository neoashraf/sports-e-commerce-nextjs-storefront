"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "./Logo";
import { Nav } from "./Nav";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { SearchBox } from "./SearchBox";
import { AccountMenu } from "./AccountMenu";
import { WishlistIcon } from "./WishlistIcon";
import { CartIcon } from "./CartIcon";
import { MenuIcon, TruckIcon, LifeBuoyIcon } from "./icons";

/**
 * Sticky storefront header (storefront-shell §4, §5, AC1). Mobile: a single row
 * — hamburger (left), logo (center), search/wishlist/cart icons (right) — with
 * the category nav off-canvas in the drawer. Desktop (≥lg): logo + inline
 * search + account/wishlist/cart, with the horizontal category nav below.
 *
 * `role="banner"` via the <header>; the hamburger restores focus to itself when
 * the drawer closes.
 */
export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // On the category PLP (`/c/...`) the header scrolls away with the page so the
  // listing's own subcategory + Filter/Sort chrome can pin to the very top. Every
  // other page keeps the sticky header.
  const isPlp = pathname?.startsWith("/c/") ?? false;

  function closeDrawer() {
    setDrawerOpen(false);
    // Restore focus to the trigger (storefront-shell §10).
    hamburgerRef.current?.focus();
  }

  return (
    <header id="site-header" className={isPlp ? "relative z-40" : "sticky top-0 z-40"}>
      <AnnouncementBar />
      {/* relative z-50 lifts this whole bar (and its backdrop-blur stacking
          context) above the z-40 Nav, so the search autosuggest panel — which
          overflows down into the Nav region — paints OVER the category bar
          instead of being trapped behind it. */}
      <div className="relative z-50 border-b border-border bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        {/* Hamburger — mobile/tablet only */}
        <button
          ref={hamburgerRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors duration-micro ease-out hover:bg-surface-100 lg:hidden"
        >
          <MenuIcon />
        </button>

        <div className="flex flex-1 items-center justify-center lg:flex-none lg:justify-start">
          <Logo />
        </div>

        {/* Inline search — desktop/tablet */}
        <div className="hidden flex-1 px-4 md:block lg:px-8">
          <SearchBox />
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="hidden md:block">
            <AccountMenu />
          </div>
          <WishlistIcon />
          <CartIcon />
          {/* Account on mobile sits in the icon row */}
          <div className="md:hidden">
            <AccountMenu />
          </div>
        </div>
      </div>

      {/* Mobile search row (icons row stays compact above) */}
      <div className="px-4 pb-2.5 md:hidden">
        <SearchBox />
      </div>
      </div>

      {/* Desktop category nav */}
      <Nav />

      <MobileNavDrawer open={drawerOpen} onClose={closeDrawer} />
    </header>
  );
}

/**
 * Top ink announcement strip (storefront-shell §14 — no CMS announcement content
 * type in MVP, so the copy is hard-coded config). A real CMS "announcement bar"
 * content type (CMS §16) is the eventual source. Not dismissible for MVP.
 * ink-on-volt respected: the volt amount sits on ink, so it's volt text on ink
 * (fine) — there is no volt fill behind text here.
 */
export function AnnouncementBar() {
  return (
    <div className="bg-ink text-white">
      <div className="relative mx-auto flex max-w-7xl items-center justify-center px-4 py-1.5 sm:px-6">
        <p className="text-center text-[12px] font-medium">
          Free delivery on orders over{" "}
          <span className="font-bold text-volt">৳ 2,000</span>
          <span className="mx-2 text-ink-500" aria-hidden="true">
            ·
          </span>
          Cash on Delivery
        </p>

        {/* Header utility links (storefront-shell §5). Desktop/tablet only — on
            mobile these live in the nav drawer. Help is reachable from any page. */}
        <nav
          aria-label="Quick links"
          className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-4 sm:right-6 md:flex"
        >
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/85 transition-colors duration-micro ease-out hover:text-volt focus-visible:text-volt"
          >
            <TruckIcon className="h-[14px] w-[14px]" />
            Order Tracking
          </Link>
          <Link
            href="/pages/contact"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-volt transition-colors duration-micro ease-out hover:text-white focus-visible:text-white"
          >
            <LifeBuoyIcon className="h-[14px] w-[14px]" />
            Get Help
          </Link>
        </nav>
      </div>
    </div>
  );
}
