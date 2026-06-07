"use client";

import { ColorSwatches } from "./ColorSwatches";
import { SizeButtons } from "./SizeButtons";
import type { ConfigurableAttribute } from "@/lib/api/schemas/catalog";

/**
 * Composes the Colour + Size selectors (product-detail §5). Purely presentational
 * wiring — the resolution logic (which sizes are sellable, which variant a
 * selection resolves to) lives in the parent ProductDetailView via the catalog
 * hook helpers. Either attribute may be absent (simple/partly-configurable).
 */
export function VariantSelector({
  colorAttr,
  sizeAttr,
  selectedColor,
  selectedSize,
  sellableSizeIds,
  onSelectColor,
  onSelectSize,
  sizeGroupRef,
}: {
  colorAttr?: ConfigurableAttribute;
  sizeAttr?: ConfigurableAttribute;
  selectedColor: string | null;
  selectedSize: string | null;
  sellableSizeIds: Set<string>;
  onSelectColor: (id: string) => void;
  onSelectSize: (id: string) => void;
  sizeGroupRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="space-y-5">
      {colorAttr && (
        <ColorSwatches
          label={colorAttr.label}
          options={colorAttr.options}
          selected={selectedColor}
          onSelect={onSelectColor}
        />
      )}
      {sizeAttr && (
        <SizeButtons
          label={sizeAttr.label}
          options={sizeAttr.options}
          sellableIds={sellableSizeIds}
          selected={selectedSize}
          onSelect={onSelectSize}
          groupRef={sizeGroupRef}
        />
      )}
    </div>
  );
}
