"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCartStore } from "@/lib/stores/cart";
import { useCart } from "@/lib/api/hooks/cart";
import { formatBDT } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { Icon } from "@/components/ui/Icon";
import { CartOptionLine } from "./CartOptionLine";

/**
 * Mini-cart drawer — faithful port of the design kit
 * (docs/design/design-files/ui_kits/cart/{MiniCart,cart}.{jsx,css}, mini-cart.md).
 * Right-side drawer ≥640px (~420px) / bottom sheet on mobile; `role="dialog"` +
 * focus-trap + restore-to-trigger. Read-only: a full-width volt "Added to bag"
 * strip on an add, a glanceable line list (56px 4:5 thumb, title, options, "Qty N",
 * unit price; low-stock + unavailable notes), and a sticky footer with the
 * subtotal + "View cart" / "Checkout". Editing lives on the cart page.
 */
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
  const showAddedBanner = !!justAdded && items.some((i) => i.item_id === justAdded);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-ink/45" onClick={close} aria-hidden="true" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-2xl bg-white shadow-pop sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(420px,94vw)] sm:rounded-none motion-safe:animate-[slideUp_220ms_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-[18px] py-4">
          <span className="text-[17px] font-bold text-ink">Cart ({count})</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            <Icon name="x" size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Just-added banner (full-width volt strip) */}
        {showAddedBanner && (
          <div className="flex items-center gap-2 bg-volt px-[18px] py-3 text-ink" role="status">
            <Icon name="check-circle" size={18} color="var(--ink-900)" aria-hidden="true" />
            <span className="text-body-sm font-bold">Added to bag</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ul className="space-y-4 p-[18px]" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex gap-3">
                  <div className="h-[70px] w-14 animate-pulse rounded-sm bg-surface-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded-sm bg-surface-100" />
                    <div className="h-4 w-1/3 animate-pulse rounded-sm bg-surface-100" />
                  </div>
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-body text-text-muted">Your cart is empty</p>
              <button type="button" onClick={close} className="text-body-sm font-semibold text-volt-600 hover:underline">
                Start shopping
              </button>
            </div>
          ) : (
            <ul>
              {items.map((item) => {
                const unavailable = item.availability === "unavailable" || item.availability === "out_of_stock";
                const low = item.availability === "low_stock";
                return (
                  <li
                    key={item.item_id}
                    data-unavailable={unavailable ? "true" : "false"}
                    className={
                      "grid grid-cols-[56px_1fr_auto] gap-3 border-b border-border px-[18px] py-3.5 " +
                      (item.item_id === justAdded ? "bg-volt/10" : "")
                    }
                  >
                    <Link href={`/p/${item.product_id}`} className="aspect-[4/5] w-14 overflow-hidden rounded-sm bg-surface-100">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveMediaUrl(item.image)}
                          alt={item.title}
                          className={"h-full w-full object-cover " + (unavailable ? "opacity-50 grayscale-[0.4]" : "")}
                        />
                      )}
                    </Link>

                    <div className="min-w-0">
                      <Link href={`/p/${item.product_id}`} className="line-clamp-2 break-words text-body-sm font-semibold leading-snug text-ink hover:underline">
                        {item.title}
                      </Link>
                      <CartOptionLine options={item.options} />
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-body-sm text-text-muted">Qty {item.quantity}</span>
                        {low && <span className="text-xs font-semibold text-[#B45309]">· Only a few left</span>}
                        {unavailable && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted">
                            <Icon name="x-circle" size={13} aria-hidden="true" /> No longer available
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={"whitespace-nowrap text-body-sm font-bold tabular-nums " + (unavailable ? "text-text-faint" : "text-ink")}>
                      {formatBDT(Number(item.unit_price))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Sticky footer */}
        {items.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-[18px] py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold text-ink">Subtotal</span>
              <span className="text-lg font-extrabold tabular-nums text-ink">
                {formatBDT(Number(data?.summary.subtotal ?? 0))}
              </span>
            </div>
            <span className="text-xs text-text-faint">Delivery &amp; total calculated at checkout.</span>
            <div className="flex gap-2.5">
              <Link
                href="/cart"
                onClick={close}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-md border border-border-strong text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
              >
                View cart
              </Link>
              <Link
                href="/checkout"
                onClick={close}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-volt text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
