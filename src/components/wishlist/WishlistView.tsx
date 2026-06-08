"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useWishlist, useRemoveFromWishlist, useClearWishlist, useMoveToCart } from "@/lib/api/hooks/wishlist";
import { useWishlistStore } from "@/lib/stores/wishlist";
import type { WishlistItem } from "@/lib/api/schemas/wishlist";
import { formatBDT } from "@/lib/format";
import { toast } from "@/lib/stores/toast";
import { ApiError } from "@/lib/api/errors";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * Wishlist page (wishlist-page.md, wishlist-fe). Customer → server list; guest →
 * local store. Responsive grid of cards with live price, availability pill
 * (icon+text), Move to Bag (size prompt on VARIANT_NEEDED), Remove (optimistic),
 * Clear all (confirm), and both empty states. Subtotal/price are server-fresh.
 */
function variantLabel(options?: Record<string, string>): string {
  if (!options) return "";
  return Object.entries(options).map(([k, v]) => `${cap(k)}: ${v}`).join(" · ");
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function WishlistView() {
  const tokens = useAuthStore((s) => s.tokens);
  const isAuth = !!tokens;
  const guestItems = useWishlistStore((s) => s.guestItems);

  const { data, isLoading, isError, refetch } = useWishlist();
  const remove = useRemoveFromWishlist();
  const clear = useClearWishlist();
  const [confirmClear, setConfirmClear] = useState(false);

  // Guest view: no server fetch — render cards from the local snapshots. Links
  // go to the product SLUG (the bare id 404s on /p/); items saved before
  // snapshots existed fall back to an id-only "View product" row.
  if (!isAuth) {
    if (guestItems.length === 0) return <EmptyWishlist />;
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">Wishlist ({guestItems.length})</h1>
        <p className="text-sm text-gray-500">
          Saved on this device. <Link href="/" className="font-medium text-brand-600 hover:underline">Log in</Link> to sync and move items to your bag.
        </p>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guestItems.map((g) => {
            const snap = g.snapshot;
            const href = snap ? `/p/${snap.slug}` : null;
            const showStrike =
              snap?.on_sale &&
              snap.base_price &&
              snap.effective_price &&
              Number(snap.base_price) > Number(snap.effective_price);
            return (
              <li
                key={g.product_id}
                className="flex flex-col rounded-lg border border-gray-200 p-4"
              >
                {snap && href ? (
                  <>
                    <Link href={href} className="aspect-square overflow-hidden rounded bg-gray-100">
                      {snap.primary_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={snap.primary_image} alt={snap.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200" aria-hidden="true">
                          <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 4.5h15a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18V6a1.5 1.5 0 011.5-1.5z" />
                          </svg>
                        </div>
                      )}
                    </Link>
                    <div className="mt-2 flex-1">
                      {snap.brand && <p className="text-xs uppercase tracking-wide text-gray-400">{snap.brand}</p>}
                      <Link href={href} className="line-clamp-2 break-words text-sm font-medium text-gray-900 hover:text-brand-600">
                        {snap.title}
                      </Link>
                      {snap.effective_price && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{formatBDT(Number(snap.effective_price))}</span>
                          {showStrike && <span className="text-xs text-gray-400 line-through">{formatBDT(Number(snap.base_price))}</span>}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        href={href}
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-gray-900 px-3 text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        View product
                      </Link>
                      <button
                        type="button"
                        onClick={() => useWishlistStore.getState().removeGuest(g.product_id)}
                        aria-label={`Remove ${snap.title} from wishlist`}
                        className="grid h-10 w-10 place-items-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                ) : (
                  // Legacy id-only item (saved before snapshots) — no resolvable
                  // slug, so offer removal instead of a broken product link.
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Saved item</span>
                    <button
                      type="button"
                      onClick={() => useWishlistStore.getState().removeGuest(g.product_id)}
                      className="text-sm text-gray-500 hover:text-gray-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="h-7 w-40 animate-pulse rounded bg-gray-100" />
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-72 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </ul>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
        <p className="text-sm font-medium text-gray-700">Couldn&apos;t load your wishlist.</p>
        <button type="button" onClick={() => refetch()} className="inline-flex h-10 items-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800">
          Try again
        </button>
      </div>
    );
  }

  const items = data ?? [];
  if (items.length === 0) return <EmptyWishlist />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Wishlist ({items.length})</h1>
        <button type="button" onClick={() => setConfirmClear(true)} className="text-sm font-medium text-gray-500 hover:text-gray-800">
          Clear all
        </button>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <WishlistCard key={item.item_id} item={item} onRemove={() => remove.mutate(item.item_id)} />
        ))}
      </ul>

      <ConfirmDialog
        open={confirmClear}
        title="Clear wishlist?"
        message="This removes all saved items."
        confirmLabel="Clear all"
        danger
        pending={clear.isPending}
        onConfirm={() => clear.mutate(undefined, { onSuccess: () => setConfirmClear(false) })}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}

function WishlistCard({ item, onRemove }: { item: WishlistItem; onRemove: () => void }) {
  const move = useMoveToCart();
  const oos = item.availability === "out_of_stock";
  const unavailable = item.availability === "unavailable" || !item.is_available;
  const p = item.product;
  const showStrike = p.on_sale && Number(p.base_price) > Number(p.effective_price);

  async function onMove() {
    try {
      await move.mutateAsync({ itemId: item.item_id, variant_id: item.preferred_variant?.id });
      toast("Added to bag");
    } catch (err) {
      if (err instanceof ApiError && err.code === "VARIANT_NEEDED") {
        toast("Select a size on the product page to add to your bag.", "error");
      } else if (err instanceof ApiError && err.code === "OUT_OF_STOCK") {
        toast("Out of stock — we'll keep it saved.", "error");
      } else {
        toast("Something went wrong. Please try again.", "error");
      }
    }
  }

  return (
    <li className={"flex flex-col rounded-lg border border-gray-200 p-4 " + (unavailable ? "opacity-60" : "")}>
      <Link href={`/p/${p.slug}`} className="aspect-square overflow-hidden rounded bg-gray-100">
        {p.primary_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.primary_image} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200" aria-hidden="true">
            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 4.5h15a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18V6a1.5 1.5 0 011.5-1.5z" />
            </svg>
          </div>
        )}
      </Link>
      <div className="mt-2 flex-1">
        {p.brand && <p className="text-xs uppercase tracking-wide text-gray-400">{p.brand}</p>}
        <Link href={`/p/${p.slug}`} className="line-clamp-2 break-words text-sm font-medium text-gray-900 hover:text-brand-600">
          {p.title}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{formatBDT(Number(p.effective_price))}</span>
          {showStrike && <span className="text-xs text-gray-400 line-through">{formatBDT(Number(p.base_price))}</span>}
        </div>
        {item.preferred_variant && (
          <p className="mt-0.5 text-xs text-gray-500">{variantLabel(item.preferred_variant.options)}</p>
        )}
        <p className={"mt-1 text-xs font-medium " + (unavailable ? "text-gray-500" : oos ? "text-gray-600" : "text-green-700")}>
          {unavailable ? "✕ No longer available" : oos ? "● Out of stock" : "✓ In stock"}
        </p>
        {oos && !unavailable && <p className="mt-0.5 text-xs text-gray-400">Out of stock — we&apos;ll keep it saved.</p>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={oos || unavailable || move.isPending}
          onClick={onMove}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-gray-900 px-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
        >
          {move.isPending ? "Adding…" : "Move to Bag"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${p.title} from wishlist`}
          className="grid h-10 w-10 place-items-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

function EmptyWishlist() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Your wishlist is empty</h1>
      <Link href="/" className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white hover:bg-gray-800">
        Browse products
      </Link>
    </div>
  );
}
