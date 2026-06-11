"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useWishlist, useRemoveFromWishlist, useClearWishlist, useMoveToCart } from "@/lib/api/hooks/wishlist";
import { useWishlistStore } from "@/lib/stores/wishlist";
import type { WishlistItem } from "@/lib/api/schemas/wishlist";
import { formatBDT } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
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
        <h1 className="mb-2 text-h1 font-bold tracking-snug text-ink">Wishlist ({guestItems.length})</h1>
        <p className="text-body-sm text-text-muted">
          Saved on this device. <Link href="/" className="font-semibold text-volt-600 hover:underline">Log in</Link> to sync and move items to your bag.
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
                className="flex flex-col rounded-lg border border-border p-4"
              >
                {snap && href ? (
                  <>
                    <Link href={href} className="aspect-square overflow-hidden rounded-md bg-surface-50">
                      {snap.primary_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveMediaUrl(snap.primary_image)} alt={snap.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-100" aria-hidden="true">
                          <svg className="h-10 w-10 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 4.5h15a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18V6a1.5 1.5 0 011.5-1.5z" />
                          </svg>
                        </div>
                      )}
                    </Link>
                    <div className="mt-2 flex-1">
                      {snap.brand && <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{snap.brand}</p>}
                      <Link href={href} className="line-clamp-2 break-words text-body-sm font-semibold text-ink hover:text-volt-600">
                        {snap.title}
                      </Link>
                      {snap.effective_price && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className={"text-body-sm font-bold tabular-nums " + (showStrike ? "text-sale" : "text-ink")}>{formatBDT(Number(snap.effective_price))}</span>
                          {showStrike && <span className="text-body-sm text-text-muted line-through tabular-nums">{formatBDT(Number(snap.base_price))}</span>}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        href={href}
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-ink px-3 text-body-sm font-semibold text-white transition-colors duration-micro ease-out hover:bg-ink-700"
                      >
                        View product
                      </Link>
                      <button
                        type="button"
                        onClick={() => useWishlistStore.getState().removeGuest(g.product_id)}
                        aria-label={`Remove ${snap.title} from wishlist`}
                        className="grid h-10 w-10 place-items-center rounded-md border border-border-strong text-text-muted transition-colors duration-micro ease-out hover:bg-surface-100"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                ) : (
                  // Legacy id-only item (saved before snapshots) — no resolvable
                  // slug, so offer removal instead of a broken product link.
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-text-muted">Saved item</span>
                    <button
                      type="button"
                      onClick={() => useWishlistStore.getState().removeGuest(g.product_id)}
                      className="text-body-sm text-text-muted transition-colors duration-micro ease-out hover:text-ink"
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
        <div className="h-7 w-40 animate-pulse rounded-sm bg-surface-100" />
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-72 animate-pulse rounded-lg bg-surface-100" />
          ))}
        </ul>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
        <p className="text-body font-medium text-ink">Couldn&apos;t load your wishlist.</p>
        <button type="button" onClick={() => refetch()} className="inline-flex h-11 items-center rounded-md bg-volt px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600">
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
        <h1 className="text-h1 font-bold tracking-snug text-ink">Wishlist ({items.length})</h1>
        <button type="button" onClick={() => setConfirmClear(true)} className="text-body-sm font-medium text-text-muted transition-colors duration-micro ease-out hover:text-ink">
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
    <li className={"flex flex-col rounded-lg border border-border p-4 " + (unavailable ? "opacity-60" : "")}>
      <Link href={`/p/${p.slug}`} className="aspect-square overflow-hidden rounded-md bg-surface-50">
        {p.primary_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveMediaUrl(p.primary_image)} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-100" aria-hidden="true">
            <svg className="h-10 w-10 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 4.5h15a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18V6a1.5 1.5 0 011.5-1.5z" />
            </svg>
          </div>
        )}
      </Link>
      <div className="mt-2 flex-1">
        {p.brand && <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{p.brand}</p>}
        <Link href={`/p/${p.slug}`} className="line-clamp-2 break-words text-body-sm font-semibold text-ink hover:text-volt-600">
          {p.title}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className={"text-body-sm font-bold tabular-nums " + (showStrike ? "text-sale" : "text-ink")}>{formatBDT(Number(p.effective_price))}</span>
          {showStrike && <span className="text-body-sm text-text-muted line-through tabular-nums">{formatBDT(Number(p.base_price))}</span>}
        </div>
        {item.preferred_variant && (
          <p className="mt-0.5 text-body-sm text-text-muted">{variantLabel(item.preferred_variant.options)}</p>
        )}
        <p className={"mt-1 text-body-sm font-medium " + (unavailable ? "text-text-muted" : oos ? "text-text-muted" : "text-success")}>
          {unavailable ? "✕ No longer available" : oos ? "● Out of stock" : "✓ In stock"}
        </p>
        {oos && !unavailable && <p className="mt-0.5 text-body-sm text-text-faint">Out of stock — we&apos;ll keep it saved.</p>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={oos || unavailable || move.isPending}
          onClick={onMove}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-volt px-3 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-text-faint"
        >
          {move.isPending ? "Adding…" : "Move to Bag"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${p.title} from wishlist`}
          className="grid h-10 w-10 place-items-center rounded-md border border-border-strong text-text-muted transition-colors duration-micro ease-out hover:bg-surface-100"
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
      <h1 className="text-h1 font-bold text-ink">Your wishlist is empty</h1>
      <Link href="/" className="inline-flex h-11 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600">
        Browse products
      </Link>
    </div>
  );
}
