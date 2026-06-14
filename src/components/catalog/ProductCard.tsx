"use client";

import { useState } from "react";
import Link from "next/link";
import type { ListingProduct } from "@/lib/api/schemas/search";
import { formatBDT } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { WishlistHeart } from "@/components/wishlist/WishlistHeart";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

/**
 * Shared SRCH/PLP/wishlist product card (v2) — minimal at rest, rich on hover.
 *
 * AT REST: clean image on surface-50, brand · 2-line Bangla-safe name (+ optional
 * Bangla line) · price, and a light TEXT merch label (New → volt-600, Best Seller →
 * ink). The heart and quick action are hidden on desktop. ON HOVER / KEYBOARD-FOCUS
 * (desktop): the card lifts into a shadow-pop panel, the image cross-fades to
 * `hover_image` (or zooms ≤1.03 when none), a colour-swatch rail slides in with a
 * "+N colours" count (clicking a swatch swaps the displayed image), the wishlist
 * heart fades in, and a quick action appears — "Add to bag" (simple) or "Choose
 * size" (configurable; both still route to the PDP — no listing add-to-bag mutation
 * yet). ON TOUCH: heart + colour count are plain/persistent, no lift/motion.
 * prefers-reduced-motion reveals instantly.
 *
 * RW6 (data-enablement): `hover_image`, `swatches[]`, `name_bn`, `requires_variant`,
 * and `merch_label` now arrive on the listing/search/section/wishlist product payload
 * (docs/api-contracts/03-search-browse.md → Product-card fields). Each is optional with
 * a graceful fallback, so a pre-RW6 backend still renders the base card.
 *
 * The `.sv-pc*` hover stylesheet lives in `app/globals.css` (a faithful port of the
 * design kit) so it's always present in the SSR/build output — it is NOT injected at
 * runtime, which previously made the hover lift/cross-fade unreliable.
 *
 * Design source: docs/design/design-files/components/display/ProductCard.{jsx,prompt.md}
 */

function toAmount(p?: string): number {
  const n = Number(p);
  return Number.isFinite(n) ? n : 0;
}

/** Max swatches shown in the rail before the "+N colours" more-button (matches BE cap). */
const SWATCH_RAIL_SHOWN = 5;

export function ProductCard({
  product,
  withWishlist = false,
}: {
  product: ListingProduct;
  withWishlist?: boolean;
}) {
  // Clicking a swatch swaps the displayed base image (index 0 = the product's own image).
  const [activeSwatch, setActiveSwatch] = useState(0);

  const eff = toAmount(product.effective_price);
  const base = toAmount(product.base_price);
  const showStrike = product.on_sale && base > eff;
  const oos = product.availability === "out_of_stock";
  const low = product.availability === "low_stock";
  const discountPct = showStrike ? Math.round(((base - eff) / base) * 100) : 0;
  const href = `/p/${product.slug}`;

  // RW6 fields (each optional with a graceful fallback).
  const swatches = (product.swatches ?? []).filter((s) => s && s.image);
  const picked = swatches.length > 0 && activeSwatch > 0 ? swatches[activeSwatch] : null;
  const baseImage = picked ? picked.image : product.primary_image;
  // Cross-fade only when a hover image exists, the card isn't OOS, and no swatch override is active.
  const useHoverImg = !!product.hover_image && !oos && !picked;
  const colourCount = swatches.length;
  const shownSwatches = swatches.slice(0, SWATCH_RAIL_SHOWN);
  // `new` from merch_label or the legacy is_new flag; bestSeller/authentic from merch_label only.
  const merch = product.merch_label ?? (product.is_new ? "new" : null);
  const requiresVariant = product.requires_variant ?? false;
  const quickLabel = requiresVariant ? "Choose size" : "Add to bag";

  return (
    <div
      className="sv-pc"
      data-oos={oos ? "true" : "false"}
      data-hoverimg={useHoverImg ? "true" : "false"}
    >
      {/* Media */}
      <div className="sv-pc__media">
        {baseImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="sv-pc__img sv-pc__img--base"
            src={resolveMediaUrl(baseImage)}
            alt={product.title}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-surface-100 p-3 text-center" aria-hidden="true">
            <Icon name="image" size={40} className="text-text-faint" />
            <span className="line-clamp-2 text-[11px] font-medium text-text-faint">{product.title}</span>
          </div>
        )}
        {/* Hover cross-fade target (desktop, hover-capable only — see CSS) */}
        {useHoverImg && product.hover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="sv-pc__img sv-pc__img--hover"
            src={resolveMediaUrl(product.hover_image)}
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
        )}

        {/* Status flags — top-left, one primary per card */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
          {oos ? (
            <Badge variant="outStock">Out of stock</Badge>
          ) : showStrike ? (
            <Badge variant="sale">{discountPct > 0 ? `-${discountPct}%` : "Sale"}</Badge>
          ) : merch === "new" ? (
            <Badge variant="new">New</Badge>
          ) : null}
        </div>

        {/* Wishlist heart — fades in on hover/focus (desktop), persistent on touch */}
        {withWishlist && (
          <div className="sv-pc__heart">
            <WishlistHeart
              productId={product.id}
              snapshot={{
                slug: product.slug,
                title: product.title,
                brand: product.brand,
                primary_image: product.primary_image,
                effective_price: product.effective_price,
                base_price: product.base_price,
                on_sale: product.on_sale,
              }}
              size="md"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            />
          </div>
        )}

        {/* Full-media link target (sits under the heart/reveal) */}
        <Link href={href} aria-label={product.title} className="absolute inset-0 z-0" />

        {/* Desktop hover reveal: swatch rail + quick action. Hidden when OOS. The
            quick action and the "see all colours" more-button both route to the PDP. */}
        {!oos && (
          <div className="sv-pc__reveal">
            {shownSwatches.length > 0 && (
              <div className="sv-pc__swatches" role="group" aria-label="Colourways">
                {shownSwatches.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="sv-pc__swatch"
                    aria-pressed={i === activeSwatch}
                    aria-label={s.label || `Colourway ${i + 1}`}
                    style={s.color_hex ? { backgroundColor: s.color_hex } : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveSwatch(i);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.image && <img src={resolveMediaUrl(s.image)} alt="" loading="lazy" />}
                  </button>
                ))}
                {colourCount > shownSwatches.length && (
                  <Link
                    href={href}
                    className="sv-pc__swmore relative z-10"
                    aria-label={`See all ${colourCount} colours — ${product.title}`}
                    title={`+${colourCount - shownSwatches.length} colours`}
                  >
                    <Icon name="arrow-right" size={16} />
                  </Link>
                )}
              </div>
            )}
            <Link
              href={href}
              className={"sv-pc__quick relative z-10 " + (requiresVariant ? "sv-pc__quick--size" : "sv-pc__quick--add")}
              aria-label={`${quickLabel} — ${product.title}`}
              title={quickLabel}
            >
              <Icon name={requiresVariant ? "plus" : "shopping-bag"} size={18} />
            </Link>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            {product.brand}
          </span>
        )}
        <Link
          href={href}
          className="line-clamp-2 break-words text-body font-semibold leading-snug text-ink hover:underline hover:decoration-cyan-600 hover:underline-offset-2"
          style={{ minHeight: "calc(1.35em * 2)" }}
        >
          {product.title}
        </Link>
        {/* Optional Bangla name line — Hind Siliguri, 2-line truncate, never clips */}
        {product.name_bn && (
          <span className="font-bangla line-clamp-2 break-words text-body-sm leading-relaxed text-text-muted" lang="bn">
            {product.name_bn}
          </span>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-1">
          <span className={"font-bold tabular-nums " + (showStrike ? "text-sale" : "text-ink")}>
            {formatBDT(eff)}
          </span>
          {showStrike && (
            <span className="text-body-sm text-text-muted line-through tabular-nums">{formatBDT(base)}</span>
          )}
        </div>

        {/* Light text merch label — New (volt) / Best Seller · Authentic (ink). Not shown
            when a Sale/OOS flag already occupies the card's primary status slot. */}
        {!showStrike && !oos && merch === "new" && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-volt-600">New</span>
        )}
        {!oos && merch === "bestSeller" && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink">Best Seller</span>
        )}
        {!oos && merch === "authentic" && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink">Authentic</span>
        )}

        {/* Touch-only colour count (the hover swatch rail is desktop-only) */}
        {colourCount > 1 && (
          <span className="text-body-sm text-text-muted [@media(hover:hover)]:hidden">{colourCount} colours</span>
        )}

        {/* Low-stock nudge only — the design card shows no "In stock" label. */}
        {low && !oos && <span className="text-body-sm text-[#B45309]">Only a few left</span>}
      </div>
    </div>
  );
}
