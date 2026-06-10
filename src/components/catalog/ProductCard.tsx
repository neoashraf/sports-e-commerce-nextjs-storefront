"use client";

import Link from "next/link";
import type { ListingProduct, Availability } from "@/lib/api/schemas/search";
import { formatBDT } from "@/lib/format";
import { WishlistHeart } from "@/components/wishlist/WishlistHeart";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

/**
 * Shared SRCH/PLP/wishlist product card (v2) — minimal at rest, rich on hover.
 *
 * AT REST: clean image on surface-50, brand · 2-line Bangla-safe name · price, and a
 * light TEXT merch label (New → volt-600). The heart and Add button are hidden on
 * desktop. ON HOVER / KEYBOARD-FOCUS (desktop): the card lifts into a shadow-pop panel,
 * the image zooms ≤1.03 (no hoverImage in the listing data — graceful fallback), the
 * wishlist heart fades in, and an "Add to bag" quick-action appears. ON TOUCH: heart +
 * action are persistent, no lift/motion. prefers-reduced-motion reveals instantly.
 *
 * Presentation-only reskin (RW0). All reveal behaviour is CSS (real hover capability +
 * :focus-within + motion preference) so it never JS-guesses pointer type. The wishlist
 * mutation + guest-OTP resume stays in <WishlistHeart>; the link/href wiring is unchanged.
 *
 * DATA GAP (flagged, not invented): the ListingProduct schema carries no hoverImage,
 * swatches, nameBn, or requiresVariant. Those v2 affordances fall back gracefully
 * (no cross-fade, no swatch rail, no Bangla line, "Add to bag" always) until the
 * catalog API/schema provides them in a later (non-presentation) task.
 *
 * Design source: docs/design/design-files/components/display/ProductCard.{jsx,prompt.md}
 */

const AVAILABILITY_LABEL: Record<Availability, string> = {
  in_stock: "In stock",
  low_stock: "Only a few left",
  out_of_stock: "Out of stock",
};

function toAmount(p?: string): number {
  const n = Number(p);
  return Number.isFinite(n) ? n : 0;
}

// Inject the card stylesheet once (tokens come from globals.css). Mirrors the design
// kit: @media (hover:hover) drives the rest→reveal transition; reduced-motion kills it.
const SV_PC_STYLE_ID = "sv-productcard-v2-css";
function ensureProductCardStyles() {
  if (typeof document === "undefined" || document.getElementById(SV_PC_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = SV_PC_STYLE_ID;
  el.textContent = `
.sv-pc{position:relative;display:flex;flex-direction:column;height:100%;background:#fff;border:1px solid transparent;border-radius:10px;overflow:hidden;transition:box-shadow var(--dur-ui) var(--ease-out),transform var(--dur-ui) var(--ease-out);}
.sv-pc__media{position:relative;display:block;aspect-ratio:1/1;background:var(--surface-50);overflow:hidden;}
.sv-pc__img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform var(--dur-slow) var(--ease-out);}
.sv-pc[data-oos="true"] .sv-pc__img{opacity:.5;filter:grayscale(.35);}
.sv-pc__heart{position:absolute;top:8px;right:8px;z-index:10;}
.sv-pc__reveal{position:absolute;left:0;right:0;bottom:0;padding:10px;display:flex;align-items:center;gap:8px;z-index:10;}
.sv-pc__quick{flex:0 0 auto;margin-left:auto;width:40px;height:40px;padding:0;border-radius:6px;border:none;display:grid;place-items:center;cursor:pointer;box-shadow:0 1px 3px rgba(15,17,21,.16);background:var(--volt);color:var(--ink-900);transition:background var(--dur-micro) var(--ease-out);}
.sv-pc__quick:hover{background:var(--volt-600);}
.sv-pc__quick:disabled{background:var(--surface-100);color:var(--text-faint);cursor:not-allowed;box-shadow:none;}
.sv-pc__quick:focus-visible{outline:2px solid var(--volt);outline-offset:2px;}

/* ---- Desktop (hover-capable): minimal rest, rich reveal ---- */
@media (hover:hover){
  .sv-pc:hover,.sv-pc:focus-within{box-shadow:var(--shadow-pop);transform:translateY(-4px);z-index:2;}
  .sv-pc[data-oos="false"]:hover .sv-pc__img,.sv-pc[data-oos="false"]:focus-within .sv-pc__img{transform:scale(1.03);}
  .sv-pc__heart{opacity:0;transform:translateY(-3px);transition:opacity var(--dur-micro) var(--ease-out),transform var(--dur-micro) var(--ease-out);}
  .sv-pc:hover .sv-pc__heart,.sv-pc:focus-within .sv-pc__heart{opacity:1;transform:none;}
  .sv-pc__heart:focus-within{opacity:1;transform:none;}
  .sv-pc__reveal{opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity var(--dur-ui) var(--ease-out),transform var(--dur-ui) var(--ease-out);}
  .sv-pc:hover .sv-pc__reveal,.sv-pc:focus-within .sv-pc__reveal{opacity:1;transform:none;pointer-events:auto;}
}

/* ---- Touch (no hover): heart stays persistent; the whole card is the PDP link,
   so the hover-only quick action is simply hidden (no separate touch action row) ---- */
@media (hover:none){
  .sv-pc__reveal{display:none;}
}

/* ---- Reduced motion: reveal instantly, no movement ---- */
@media (prefers-reduced-motion:reduce){
  .sv-pc,.sv-pc__img,.sv-pc__heart,.sv-pc__reveal{transition:none !important;}
  .sv-pc:hover,.sv-pc:focus-within{transform:none !important;}
  .sv-pc__reveal,.sv-pc__heart{transform:none !important;}
  .sv-pc[data-oos="false"]:hover .sv-pc__img,.sv-pc[data-oos="false"]:focus-within .sv-pc__img{transform:none !important;}
}`;
  document.head.appendChild(el);
}
ensureProductCardStyles();

export function ProductCard({
  product,
  withWishlist = false,
}: {
  product: ListingProduct;
  withWishlist?: boolean;
}) {
  ensureProductCardStyles();

  const eff = toAmount(product.effective_price);
  const base = toAmount(product.base_price);
  const showStrike = product.on_sale && base > eff;
  const oos = product.availability === "out_of_stock";
  const low = product.availability === "low_stock";
  const discountPct = showStrike ? Math.round(((base - eff) / base) * 100) : 0;
  const href = `/p/${product.slug}`;

  return (
    <div className="sv-pc" data-oos={oos ? "true" : "false"}>
      {/* Media */}
      <div className="sv-pc__media">
        {product.primary_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="sv-pc__img" src={product.primary_image} alt={product.title} loading="lazy" />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-surface-100 p-3 text-center" aria-hidden="true">
            <Icon name="image" size={40} className="text-text-faint" />
            <span className="line-clamp-2 text-[11px] font-medium text-text-faint">{product.title}</span>
          </div>
        )}

        {/* Status flags — top-left, one primary per card */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
          {oos ? (
            <Badge variant="outStock">Out of stock</Badge>
          ) : showStrike ? (
            <Badge variant="sale">{discountPct > 0 ? `-${discountPct}%` : "Sale"}</Badge>
          ) : product.is_new ? (
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

        {/* Full-media link target (sits under the heart/quick action) */}
        <Link href={href} aria-label={product.title} className="absolute inset-0 z-0" />

        {/* Desktop hover reveal: "Choose size" routes to the PDP (variants are chosen
            there; the listing card carries no add-to-bag mutation). Hidden when OOS. */}
        {!oos && (
          <div className="sv-pc__reveal">
            <Link
              href={href}
              className="sv-pc__quick relative z-10"
              aria-label={`Choose size — ${product.title}`}
              title="Choose size"
            >
              <Icon name="plus" size={18} />
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

        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-1">
          <span className={"font-bold tabular-nums " + (showStrike ? "text-sale" : "text-ink")}>
            {formatBDT(eff)}
          </span>
          {showStrike && (
            <span className="text-body-sm text-text-muted line-through tabular-nums">{formatBDT(base)}</span>
          )}
        </div>

        {product.is_new && !showStrike && !oos && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-volt-600">New</span>
        )}
        {withWishlist && !oos && (
          <span className={"text-body-sm " + (low ? "text-[#B45309]" : "text-success")}>
            {AVAILABILITY_LABEL[product.availability]}
          </span>
        )}
      </div>
    </div>
  );
}
