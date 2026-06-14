"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from "@/lib/api/hooks/cart";
import { useAddToWishlist } from "@/lib/api/hooks/wishlist";
import type { CartItem } from "@/lib/api/schemas/cart";
import { formatBDT } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "@/lib/stores/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { CartOptionLine } from "./CartOptionLine";

/** Per-line max = min(per-line cap 10, live available if known). */
const PER_LINE_CAP = 10;

/**
 * Cart page — faithful port of the design kit
 * (docs/design/design-files/ui_kits/cart/{CartPage,CartLine,CartSummary,cart}.{jsx,css},
 * cart-page.md). Surface-50 canvas; one white bordered card holding the editable
 * line rows (4:5 thumb, title + Bangla, option values, unit price, 44px qty
 * stepper, Move to wishlist / Remove, line total); a sticky order-summary rail on
 * desktop and a sticky checkout bar on mobile. Subtotal is always the server value.
 */
export function CartView() {
  const { data, isLoading, isError, refetch } = useCart();
  const update = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clear = useClearCart();
  const addWish = useAddToWishlist();
  const [confirmClear, setConfirmClear] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50">
        <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6">
          <div className="h-9 w-48 animate-pulse rounded-sm bg-surface-100" />
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-px overflow-hidden rounded-lg border border-border bg-white">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse bg-surface-100" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-surface-100" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-surface-50">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
          <p className="text-body font-medium text-ink">Couldn&apos;t load your cart. Try again.</p>
          <button type="button" onClick={() => refetch()} className="inline-flex h-11 items-center rounded-md bg-volt px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const items = data?.items ?? [];
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const anyUnavailable = items.some((i) => i.availability === "unavailable" || i.availability === "out_of_stock");
  const subtotal = Number(data?.summary.subtotal ?? 0);

  async function onMoveToWishlist(item: CartItem) {
    try {
      await addWish.mutateAsync({ product_id: item.product_id, preferred_variant_id: item.variant_id });
      await removeItem.mutateAsync(item.item_id);
      toast("Moved to wishlist");
    } catch {
      toast("Something went wrong. Please try again.", "error");
    }
  }

  function onRemove(item: CartItem) {
    removeItem.mutate(item.item_id);
    toast("Removed"); // (Undo wiring is a follow-up; flagged.)
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-24 md:pb-0">
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-1.5 pt-6">
          <h1 className="text-display-lg font-extrabold tracking-tight text-ink">
            Your cart <span className="font-bold text-text-muted">({count})</span>
          </h1>
          {count > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-2 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
            >
              <Icon name="trash-2" size={15} aria-hidden="true" /> Clear cart
            </button>
          )}
        </div>

        {count === 0 ? (
          <div className="pb-12 pt-3">
            <EmptyCart />
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-7 pb-12 pt-3 lg:grid-cols-[1fr_360px] lg:gap-9">
            {/* Lines + continue */}
            <div>
              {anyUnavailable && (
                <div role="alert" className="mb-3.5 flex items-start gap-2.5 rounded-md bg-sale/[0.08] px-3.5 py-3 text-body-sm font-medium text-sale">
                  <Icon name="alert-circle" size={18} aria-hidden="true" className="mt-px shrink-0" />
                  <span>Some items are no longer available — remove them to continue.</span>
                </div>
              )}

              <ul className="overflow-hidden rounded-lg border border-border bg-white">
                {items.map((item) => (
                  <CartLineRow
                    key={item.item_id}
                    item={item}
                    pending={update.isPending}
                    onQty={(q) => update.mutate({ itemId: item.item_id, quantity: q })}
                    onRemove={() => onRemove(item)}
                    onMove={() => onMoveToWishlist(item)}
                  />
                ))}
              </ul>

              <Link href="/" className="mt-4 inline-flex items-center gap-2 text-body-sm font-semibold text-ink hover:underline">
                <Icon name="arrow-left" size={16} aria-hidden="true" /> Continue shopping
              </Link>
            </div>

            {/* Sticky summary rail (desktop) */}
            <aside className="lg:sticky lg:top-5">
              <OrderSummary subtotal={subtotal} count={count} blocked={anyUnavailable} />
            </aside>
          </div>
        )}
      </div>

      {/* Mobile sticky checkout bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3.5 border-t border-border bg-white/[0.97] px-4 py-3 backdrop-blur-md md:hidden">
          <div className="flex flex-col leading-tight">
            <span className="text-body-sm text-text-muted">Subtotal</span>
            <span className="text-lg font-extrabold tabular-nums text-ink">{formatBDT(subtotal)}</span>
          </div>
          <CheckoutButton blocked={anyUnavailable} className="flex-1" />
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Remove all items from your cart?"
        message="This can't be undone."
        confirmLabel="Clear cart"
        danger
        pending={clear.isPending}
        onConfirm={() =>
          clear.mutate(undefined, {
            onSuccess: () => {
              setConfirmClear(false);
              toast("Cart cleared");
            },
          })
        }
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}

/** Editable line row — thumb, title (+ Bangla), options, unit price, stepper, actions, line total. */
function CartLineRow({
  item,
  pending,
  onQty,
  onRemove,
  onMove,
}: {
  item: CartItem;
  pending?: boolean;
  onQty: (q: number) => void;
  onRemove: () => void;
  onMove: () => void;
}) {
  const unavailable = item.availability === "unavailable" || item.availability === "out_of_stock";
  const low = item.availability === "low_stock";
  const atMax = item.quantity >= PER_LINE_CAP;
  const lineTotal = Number(item.line_total);

  return (
    <li
      data-unavailable={unavailable ? "true" : "false"}
      className="grid grid-cols-[84px_1fr] gap-3.5 border-b border-border p-4 last:border-b-0 sm:grid-cols-[96px_1fr] sm:gap-4"
    >
      <Link
        href={`/p/${item.product_id}`}
        className="aspect-[4/5] w-[84px] shrink-0 overflow-hidden rounded-md bg-surface-100 sm:w-24"
      >
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
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/p/${item.product_id}`} className="line-clamp-2 break-words text-[15px] font-semibold leading-snug text-ink hover:underline">
              {item.title}
            </Link>
            {item.title_bn && (
              <span className="font-bangla block text-xs leading-relaxed text-text-faint" lang="bn">
                {item.title_bn}
              </span>
            )}
            <div className="mt-1">
              <CartOptionLine options={item.options} />
            </div>
          </div>
          <span className="whitespace-nowrap text-body-sm font-semibold tabular-nums text-ink">
            {formatBDT(Number(item.unit_price))}
          </span>
        </div>

        {/* Stock notice */}
        {low && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309]">
            <Icon name="alert-triangle" size={14} aria-hidden="true" />
            {item.stock_left != null ? `Only ${item.stock_left} in stock.` : "Only a few left"}
          </div>
        )}
        {unavailable && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Icon name="x-circle" size={14} aria-hidden="true" /> No longer available
          </div>
        )}
        {!unavailable && !low && atMax && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Icon name="info" size={14} aria-hidden="true" /> Max {PER_LINE_CAP} per item.
          </div>
        )}

        {/* Footer: stepper + actions + line total */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {unavailable ? (
            <span className="text-body-sm font-semibold text-text-faint">Remove to continue</span>
          ) : (
            <div className="inline-flex h-11 items-center rounded-md border border-border-strong" role="group" aria-label={`Quantity for ${item.title}`}>
              <button
                type="button"
                aria-label={item.quantity <= 1 ? `Remove ${item.title}` : `Decrease quantity of ${item.title}`}
                disabled={pending}
                onClick={() => (item.quantity <= 1 ? onRemove() : onQty(item.quantity - 1))}
                className="grid h-full w-11 place-items-center text-ink transition-colors duration-micro ease-out hover:bg-surface-100 disabled:opacity-40"
              >
                <Icon name={item.quantity <= 1 ? "trash-2" : "minus"} size={16} aria-hidden="true" />
              </button>
              <span aria-live="polite" className="min-w-9 text-center text-[15px] font-bold tabular-nums text-ink">
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label={`Increase quantity of ${item.title}`}
                disabled={pending || atMax}
                onClick={() => onQty(item.quantity + 1)}
                className="grid h-full w-11 place-items-center text-ink transition-colors duration-micro ease-out hover:bg-surface-100 disabled:text-text-faint"
              >
                <Icon name="plus" size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={onMove}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-2 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
            >
              <Icon name="heart" size={15} aria-hidden="true" /> Move to wishlist
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-2 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
            >
              <Icon name="trash-2" size={15} aria-hidden="true" /> Remove
            </button>
          </div>

          <span className={"ml-auto text-base font-bold tabular-nums " + (unavailable ? "text-text-faint" : "text-ink")}>
            {formatBDT(lineTotal)}
          </span>
        </div>
      </div>
    </li>
  );
}

/** Order summary card (desktop sticky rail). */
function OrderSummary({ subtotal, count, blocked }: { subtotal: number; count: number; blocked: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h2 className="mb-2 text-h3 font-bold text-ink">Order summary</h2>
      <div aria-live="polite">
        <div className="flex items-baseline justify-between gap-3 py-2 text-body-sm">
          <span className="text-text-muted">Subtotal ({count} {count === 1 ? "item" : "items"})</span>
          <span className="font-semibold tabular-nums text-ink">{formatBDT(subtotal)}</span>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-3 py-2 text-body-sm">
        <span className="text-text-muted">Delivery</span>
        <span className="font-medium text-text-muted">Calculated at checkout</span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-border pt-3.5 text-body-sm">
        <span className="text-[15px] font-bold text-ink">Total</span>
        <span className="font-medium text-text-muted">Calculated at checkout</span>
      </div>

      <div className="mt-4">
        <CheckoutButton blocked={blocked} className="w-full" />
      </div>
      {blocked && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-sale">
          <Icon name="alert-circle" size={14} aria-hidden="true" /> Remove unavailable items to continue.
        </p>
      )}
      <p className="mt-3 text-center text-xs text-text-faint">Delivery, VAT &amp; total are calculated at checkout.</p>

      <div className="mt-3.5 flex items-center justify-center gap-2 text-text-muted">
        <Icon name="shield-check" size={16} color="var(--volt-600)" aria-hidden="true" />
        <span className="text-xs">Secure checkout · Cash on Delivery available</span>
      </div>
    </div>
  );
}

/** Shared "Proceed to checkout" CTA — disabled when blocked. */
function CheckoutButton({ blocked, className = "" }: { blocked: boolean; className?: string }) {
  return (
    <Link
      href={blocked ? "#" : "/checkout"}
      aria-disabled={blocked}
      onClick={(e) => blocked && e.preventDefault()}
      className={
        "inline-flex h-12 items-center justify-center rounded-md text-body-sm font-semibold transition-colors duration-micro ease-out " +
        (blocked ? "cursor-not-allowed bg-surface-100 text-text-faint" : "bg-volt text-ink hover:bg-volt-600") +
        " " + className
      }
    >
      Proceed to checkout
    </Link>
  );
}

/** Empty cart state (design kit EmptyCart). */
function EmptyCart() {
  return (
    <div className="rounded-lg border border-border bg-white px-6 py-16 text-center">
      <div className="mx-auto mb-[18px] grid h-[60px] w-[60px] place-items-center rounded-full bg-surface-100">
        <Icon name="shopping-bag" size={26} color="var(--text-muted)" aria-hidden="true" />
      </div>
      <h2 className="mb-1.5 text-[19px] font-bold text-ink">Your cart is empty</h2>
      <p className="mb-5 text-body-sm text-text-muted">Browse our latest gear and add something you love.</p>
      <Link href="/" className="inline-flex h-12 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600">
        Continue shopping
      </Link>
    </div>
  );
}
