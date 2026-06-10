"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/stores/auth";
import { endSession } from "@/lib/auth/session";
import {
  ChevronDownIcon,
  HeartIcon,
  LogOutIcon,
  PackageIcon,
  UserIcon,
} from "./icons";

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
    return <span className="inline-block h-11 w-11 animate-pulse rounded-full bg-surface-100" />;
  }

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => requireAuth()}
        className="inline-flex h-10 min-h-[44px] items-center gap-2 rounded-full px-2 text-body-sm font-bold text-ink transition-colors duration-micro ease-out hover:bg-surface-100 sm:min-h-0 sm:border sm:border-border-strong sm:bg-white sm:px-3.5 sm:hover:border-ink sm:hover:bg-white"
      >
        <UserIcon className="h-6 w-6 sm:h-[18px] sm:w-[18px]" />
        <span className="hidden sm:inline">Log in / Sign up</span>
      </button>
    );
  }

  const name = firstName(customer?.full_name ?? null);
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 min-h-[44px] items-center gap-2 rounded-full px-2 text-body-sm font-bold text-ink transition-colors duration-micro ease-out hover:bg-surface-100 sm:min-h-0 sm:border sm:border-border-strong sm:bg-white sm:pl-2 sm:pr-3 sm:hover:border-ink sm:hover:bg-white"
      >
        <span
          aria-hidden="true"
          className="grid h-[26px] w-[26px] place-items-center rounded-full bg-ink text-[12px] font-extrabold text-white"
        >
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:inline">{name}</span>
        <ChevronDownIcon className="hidden h-4 w-4 text-text-muted sm:block" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-[230px] overflow-hidden rounded-md border border-border bg-white p-2 shadow-pop"
        >
          <div className="border-b border-border px-2.5 pb-2.5 pt-2">
            <p className="text-body-sm font-bold text-ink">Hi, {name}</p>
            {(customer?.email ?? customer?.full_name) && (
              <p className="truncate text-[12.5px] text-text-muted">
                {customer?.email ?? customer?.full_name}
              </p>
            )}
          </div>
          <div className="pt-1.5">
            {[
              { href: "/account", label: "My account", Icon: UserIcon },
              { href: "/account/orders", label: "My orders", Icon: PackageIcon },
              { href: "/wishlist", label: "Wishlist", Icon: HeartIcon },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-sm px-2.5 py-2.5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100 focus-visible:bg-surface-100"
              >
                <item.Icon className="h-[17px] w-[17px] text-text-muted" />
                {item.label}
              </Link>
            ))}
            <div className="my-1.5 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void endSession();
              }}
              className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2.5 text-left text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100 focus-visible:bg-surface-100"
            >
              <LogOutIcon className="h-[17px] w-[17px] text-text-muted" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
