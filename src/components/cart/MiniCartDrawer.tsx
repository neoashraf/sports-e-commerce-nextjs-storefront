"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCartStore } from "@/lib/stores/cart";
import { useCart } from "@/lib/api/hooks/cart";
import { formatBDT } from "@/lib/format";
import { CloseIcon } from "@/components/shell/icons";

/**
 * Mini-cart drawer (mini-cart.md, cart-core-fe AC3). A read-mostly summary:
 * right-side drawer ≥768px / bottom sheet on mobile; `role="dialog"` +
 * focus-trap + restore-to-trigger; just-added highlight; line list (thumb,
 * title, options, unit price, qty, line total); sticky footer with subtotal +
 * "Delivery & total calculated at checkout" + View cart + deferred Checkout.
 * No editable inputs. Mounted once in the shell.
 */
function optionsLabel(options: Record<string, string>): string {
  return Object.entries(options)
    .map(([k, v]) => `${cap(k)}: ${v}`)
    .join(" · ");
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function MiniCartDrawer() {
  const open = useCartStore((s) => s.drawerOpen);
  const justAdded = useCartStore((s) => s.justAddedItemId);
  const close = useCartStore((s) => s.closeDrawer);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch the cart whenever the drawer opens (read-only).
  const { data, isLoading } = useCart();

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>("a[href], button")?.focus(),
    );
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  const items = data?.items ?? [];
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[400px] sm:rounded-none motion-safe:animate-[slideUp_180ms_ease-out]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Cart ({count})</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid h-11 w-11 place-items-center rounded-full text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <ul className="space-y-4" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex gap-3">
                  <div className="h-16 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-gray-600">Your cart is empty</p>
              <button type="button" onClick={close} className="text-sm font-medium text-brand-600 hover:underline">
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.item_id}
                  className={
                    "flex gap-3 rounded-lg p-2 " +
                    (item.item_id === justAdded ? "bg-brand-50 ring-1 ring-brand-200" : "")
                  }
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                    {Object.keys(item.options).length > 0 && (
                      <p className="truncate text-xs text-gray-500">{optionsLabel(item.options)}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-700">
                      {item.quantity} × {formatBDT(Number(item.unit_price))}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-gray-900">
                    {formatBDT(Number(item.line_total))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                {formatBDT(Number(data?.summary.subtotal ?? 0))}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Delivery &amp; total calculated at checkout</p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/cart"
                onClick={close}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                View cart
              </Link>
              <Link
                href="/checkout"
                onClick={close}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
