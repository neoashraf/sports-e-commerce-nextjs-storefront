"use client";

import { useMemo, useRef, useState } from "react";
import type { ProductDetail } from "@/lib/api/schemas/catalog";
import { resolveVariant, sellableSizeIds } from "@/lib/api/hooks/catalog";
import { ProductGallery } from "./ProductGallery";
import { PriceBlock } from "./PriceBlock";
import { StockPill } from "./StockPill";
import { VariantSelector } from "./VariantSelector";
import { AddToBagBar, AssuranceRow } from "./AddToBagBar";
import { NotifyMe } from "./NotifyMe";
import { WishlistHeart } from "./WishlistHeart";
import { SpecsPanel } from "./SpecsPanel";
import { ProductDescription, DeliveryReturns, SizeFit } from "./ProductDescription";
import { ProductCarousel } from "./ProductCarousel";
import { SizeGuideSheet } from "./SizeGuideSheet";

/**
 * The full PDP body for a loaded product (product-detail). Owns variant
 * selection state and derives price / stock / CTA from the already-loaded
 * payload (client-side, instant, advisory — §9). Add-to-bag is server-confirmed
 * by CART (stubbed here). Loading / error / not-found states are owned by the
 * route's boundaries + the page wrapper.
 */
export function ProductDetailView({ product }: { product: ProductDetail }) {
  const colorAttr = product.configurable_attributes.find((a) => a.code === "color");
  const sizeAttr = product.configurable_attributes.find((a) => a.code === "size");

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const sizeGroupRef = useRef<HTMLDivElement>(null);
  // RW6: the size guide is the category chart resolved onto the product detail
  // (null → trigger stays hidden, same as before).
  const sizeGuide = product.size_guide ?? null;
  const openSizeGuide = sizeGuide ? () => setSizeGuideOpen(true) : undefined;

  const selected = useMemo(() => {
    const s: Record<string, string> = {};
    if (selectedColor && colorAttr) s[colorAttr.code] = selectedColor;
    if (selectedSize && sizeAttr) s[sizeAttr.code] = selectedSize;
    return s;
  }, [selectedColor, selectedSize, colorAttr, sizeAttr]);

  // Simple product (no configurable attributes) resolves immediately (§13.7).
  const resolvedVariant = useMemo(() => {
    if (product.configurable_attributes.length === 0) return product.variants[0];
    return resolveVariant(product, selected);
  }, [product, selected]);

  const sellableIds = useMemo(
    () =>
      sizeAttr
        ? sellableSizeIds(product, colorAttr?.code ?? null, selectedColor, sizeAttr.code)
        : new Set<string>(),
    [product, sizeAttr, colorAttr, selectedColor],
  );

  // Whole product OOS = every variant out of stock (§FR-CAT-044).
  const overallOos =
    product.variants.length > 0 &&
    product.variants.every((v) => v.stock_status === "out_of_stock");

  // A colour is picked but none of its sizes are sellable (§13.1).
  const colourOos = Boolean(
    sizeAttr && selectedColor && sellableIds.size === 0 && !overallOos,
  );

  const variantOos = resolvedVariant?.stock_status === "out_of_stock";
  const notifyMode = overallOos || variantOos || colourOos;

  const priceEffective = resolvedVariant?.price ?? product.effective_price;
  const sellableVariantId =
    resolvedVariant && resolvedVariant.stock_status !== "out_of_stock"
      ? resolvedVariant.id
      : undefined;

  function onSelectColor(id: string) {
    setSelectedColor(id);
    // Drop a now-invalid size when the colour changes.
    setSelectedSize(null);
    setSizeError(false);
  }
  function onSelectSize(id: string) {
    setSelectedSize(id);
    setSizeError(false);
  }
  function requireSize() {
    setSizeError(true);
    sizeGroupRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const stockStatus = overallOos
    ? "out_of_stock"
    : resolvedVariant?.stock_status ?? null;

  // Display snapshot for a guest wishlist save — lets the guest wishlist page
  // render a real card and link by slug (not the bare id, which 404s on /p/).
  const wishSnapshot = {
    slug: product.slug,
    title: product.name,
    brand: product.brand,
    primary_image:
      product.images.find((img) => img.is_primary)?.renditions.thumb ??
      product.images[0]?.renditions.thumb ??
      product.images[0]?.url ??
      null,
    effective_price: product.effective_price,
    base_price: product.base_price,
    on_sale: product.sale_active,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Breadcrumb */}
      {product.breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1 text-body-sm text-text-muted">
            {product.breadcrumb.map((crumb, i) => (
              <li key={`${crumb}-${i}`} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden="true">›</span>}
                <span className="break-words">{crumb}</span>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gallery (mosaic + lightbox) */}
        <div>
          <ProductGallery product={product} selectedColorId={selectedColor} />
        </div>

        {/* Sticky buy box (desktop) */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-[88px] lg:self-start">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <span className="text-label font-semibold uppercase tracking-wide text-text-muted">
                  {product.brand}
                </span>
              )}
              {product.is_new && (
                <span className="text-label font-bold uppercase tracking-wide text-volt-600">New</span>
              )}
              {product.is_featured && (
                <span className="text-label font-bold uppercase tracking-wide text-ink">Best Seller</span>
              )}
            </div>
            <h1 className="break-words text-h1 font-bold tracking-snug text-ink">{product.name}</h1>
          </div>

          <div className="space-y-1">
            <PriceBlock
              effective={priceEffective}
              base={product.base_price}
              saleActive={product.sale_active}
            />
            {/* Static VAT / free-delivery note (threshold is config). */}
            <p className="text-body-sm text-text-muted">
              Inclusive of VAT · Free delivery over ৳ 3,000
            </p>
          </div>

          {/* Size guide link sits beside the Size label — rendered only when a chart exists. */}
          {sizeAttr && openSizeGuide && (
            <button
              type="button"
              onClick={openSizeGuide}
              className="self-start text-body-sm font-semibold text-volt-600 hover:underline"
            >
              Size guide
            </button>
          )}

          <VariantSelector
            colorAttr={colorAttr}
            sizeAttr={sizeAttr}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            sellableSizeIds={sellableIds}
            onSelectColor={onSelectColor}
            onSelectSize={onSelectSize}
            sizeGroupRef={sizeGroupRef}
          />

          {sizeError && (
            <p role="alert" className="text-body-sm text-error">
              Please select a size.
            </p>
          )}

          {stockStatus && <StockPill status={stockStatus} colourOos={colourOos} />}

          {notifyMode ? (
            <div className="flex flex-col gap-3">
              <NotifyMe variantId={resolvedVariant?.id} />
              <WishlistHeart productId={product.id} snapshot={wishSnapshot} />
            </div>
          ) : (
            <AddToBagBar
              variantId={sellableVariantId}
              onRequireSize={requireSize}
              trailing={<WishlistHeart productId={product.id} snapshot={wishSnapshot} />}
            />
          )}

          <AssuranceRow />
        </div>
      </div>

      {/* Accordion details (full width below) */}
      <div className="mt-10">
        <ProductDescription short={product.short_description} long={product.description} />
        <SpecsPanel specs={product.specs} defaultOpen />
        <DeliveryReturns />
        <SizeFit onOpenSizeGuide={openSizeGuide} />
      </div>

      <ProductCarousel
        title="You may also like"
        items={[...product.links.related, ...product.links.up_sell]}
      />
      <ProductCarousel title="Complete the look" items={product.links.cross_sell} />

      {sizeGuide && sizeGuideOpen && (
        <SizeGuideSheet guide={sizeGuide} onClose={() => setSizeGuideOpen(false)} />
      )}
    </div>
  );
}
