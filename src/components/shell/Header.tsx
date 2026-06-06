"use client";

import { useRef, useState } from "react";
import { Logo } from "./Logo";
import { Nav } from "./Nav";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { SearchBox } from "./SearchBox";
import { AccountMenu } from "./AccountMenu";
import { WishlistIcon } from "./WishlistIcon";
import { CartIcon } from "./CartIcon";
import { MenuIcon } from "./icons";

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

  function closeDrawer() {
    setDrawerOpen(false);
    // Restore focus to the trigger (storefront-shell §10).
    hamburgerRef.current?.focus();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        {/* Hamburger — mobile/tablet only */}
        <button
          ref={hamburgerRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 lg:hidden"
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

      {/* Desktop category nav */}
      <Nav />

      <MobileNavDrawer open={drawerOpen} onClose={closeDrawer} />
    </header>
  );
}
