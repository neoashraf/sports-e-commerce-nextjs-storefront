"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/stores/auth";
import { endSession } from "@/lib/auth/session";
import { ChevronDownIcon, UserIcon } from "./icons";

/** First name, truncated to ~16 chars (storefront-shell §5, §12). */
function firstName(full: string | null): string {
  if (!full) return "Account";
  const first = full.trim().split(/\s+/)[0] ?? "Account";
  return first.length > 16 ? `${first.slice(0, 15)}…` : first;
}

/**
 * Account menu (storefront-shell §5, §11). Guest → "Log in / Sign up" opens the
 * shared auth sheet. Logged-in → first name + a keyboard-accessible dropdown
 * (My account / My orders / Wishlist / Log out) with Esc-to-close,
 * outside-click dismiss, and focus restore to the trigger.
 */
export function AccountMenu() {
  const { isAuthenticated, hydrated, requireAuth } = useAuth();
  const customer = useAuthStore((s) => s.customer);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Avoid an SSR/CSR mismatch reading the persisted token before hydration.
  if (!hydrated) {
    return <span className="inline-block h-11 w-11 animate-pulse rounded-lg bg-gray-100" />;
  }

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => requireAuth()}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:px-3"
      >
        <UserIcon className="h-6 w-6 sm:h-5 sm:w-5" />
        <span className="hidden sm:inline">Log in / Sign up</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:px-3"
      >
        <UserIcon className="h-6 w-6 sm:h-5 sm:w-5" />
        <span className="hidden max-w-[8rem] truncate sm:inline">{firstName(customer?.full_name ?? null)}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {[
            { href: "/account", label: "My account" },
            { href: "/account/orders", label: "My orders" },
            { href: "/wishlist", label: "Wishlist" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void endSession();
            }}
            className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
