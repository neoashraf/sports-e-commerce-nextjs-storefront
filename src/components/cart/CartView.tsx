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
import { QuantityStepper } from "./QuantityStepper";
import { CouponField } from "./CouponField";

/** Per-line max = min(per-line cap 10, live available if known). */
const PER_LINE_CAP = 10;

function optionsLabel(options: Record<string, string>): string {
  return Object.entries(options).map(([k, v]) => `${cap(k)}: ${v}`).join(" · ");
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Cart page (cart-page.md, cart-core-fe AC4–AC8). Line rows with qty stepper,
 * remove (Undo snackbar), move-to-wishlist; live server subtotal + placeholder
 * delivery/total rows; deferred checkout CTA (disabled when empty or any line
 * unavailable); Clear cart confirm; empty + loading + error states. Subtotal is
 * always the server value — never client-summed.
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
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="h-7 w-40 animate-pulse rounded-sm bg-surface-100" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-100" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
        <p className="text-body font-medium text-ink">Couldn&apos;t load your cart. Try again.</p>
        <button type="button" onClick={() => refetch()} className="inline-flex h-11 items-center rounded-md bg-volt px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600">
          Try again
        </button>
      </div>
    );
  }

  const items = data?.items ?? [];
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const anyUnavailable = items.some((i) => i.availability === "unavailable" || i.availability === "out_of_stock");

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-h1 font-bold text-ink">Your cart is empty</h1>
        <Link href="/" className="inline-flex h-11 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600">
          Continue shopping
        </Link>
      </div>
    );
  }

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
    toast("Item removed"); // (Undo wiring is a follow-up; flagged.)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-h1 font-bold tracking-snug text-ink">Cart ({count})</h1>
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="text-body-sm font-medium text-text-muted transition-colors duration-micro ease-out hover:text-ink"
        >
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Lines */}
        <ul className="space-y-4">
          {items.map((item) => {
            const unavailable = item.availability === "unavailable";
            const oos = item.availability === "out_of_stock";
            return (
              <li
                key={item.item_id}
                className={"flex gap-4 rounded-lg border border-border p-4 " + (unavailable ? "opacity-60" : "")}
              >
                <Link href={`/p/${item.product_id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-surface-50">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveMediaUrl(item.image)} alt={item.title} className="h-full w-full object-cover" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 break-words text-body font-semibold text-ink">{item.title}</p>
                  {Object.keys(item.options).length > 0 && (
                    <p className="mt-0.5 text-body-sm text-text-muted">{optionsLabel(item.options)}</p>
                  )}
                  {(unavailable || oos) && (
                    <p className="mt-1 text-body-sm font-medium text-text-muted">
                      {unavailable ? "No longer available" : "Out of stock"}
                    </p>
                  )}
                  <p className="mt-1 text-body-sm text-ink">{formatBDT(Number(item.unit_price))}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {!unavailable && (
                      <QuantityStepper
                        quantity={item.quantity}
                        max={PER_LINE_CAP}
                        title={item.title}
                        disabled={update.isPending}
                        onChange={(q) => update.mutate({ itemId: item.item_id, quantity: q })}
                        onRemove={() => onRemove(item)}
                      />
                    )}
                    <button type="button" onClick={() => onRemove(item)} className="text-body-sm text-text-muted transition-colors duration-micro ease-out hover:text-ink">
                      Remove
                    </button>
                    <button type="button" onClick={() => onMoveToWishlist(item)} className="text-body-sm text-text-muted transition-colors duration-micro ease-out hover:text-ink">
                      Move to wishlist
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-body-sm font-bold tabular-nums text-ink">{formatBDT(Number(item.line_total))}</p>
              </li>
            );
          })}
        </ul>

        {/* Summary */}
        <aside className="h-max rounded-lg border border-border p-5">
          <h2 className="text-h3 font-bold text-ink">Order summary</h2>
          <div className="mt-4">
            <CouponField
              appliedCode={data?.applied_coupon?.code ?? null}
              appliedDiscount={data?.applied_coupon?.discount ?? null}
            />
          </div>
          <dl className="mt-4 space-y-2 text-body-sm" aria-live="polite">
            <div className="flex justify-between">
              <dt className="text-text-muted">Subtotal</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatBDT(Number(data?.summary.subtotal ?? 0))}</dd>
            </div>
            {data?.summary.discount && Number(data.summary.discount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-text-muted">Discount</dt>
                <dd className="font-semibold tabular-nums text-success">−{formatBDT(Number(data.summary.discount))}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-text-muted">Delivery</dt>
              <dd className="text-text-faint">Calculated at checkout</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="font-bold text-ink">Total</dt>
              <dd className="text-text-faint">Calculated at checkout</dd>
            </div>
          </dl>
          <Link
            href={anyUnavailable ? "#" : "/checkout"}
            aria-disabled={anyUnavailable}
            onClick={(e) => anyUnavailable && e.preventDefault()}
            className={
              "mt-5 inline-flex h-12 w-full items-center justify-center rounded-md text-body-sm font-semibold transition-colors duration-micro ease-out " +
              (anyUnavailable ? "cursor-not-allowed bg-surface-100 text-text-faint" : "bg-volt text-ink hover:bg-volt-600")
            }
          >
            Proceed to checkout
          </Link>
          <Link href="/" className="mt-3 block text-center text-body-sm font-semibold text-volt-600 hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear cart?"
        message="This removes all items from your cart."
        confirmLabel="Clear cart"
        danger
        pending={clear.isPending}
        onConfirm={() => clear.mutate(undefined, { onSuccess: () => setConfirmClear(false) })}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}
