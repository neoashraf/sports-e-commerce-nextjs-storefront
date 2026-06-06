import type { StockStatus } from "@/lib/api/schemas/catalog";

/**
 * Stock-status pill (product-detail §5, §8, AC4). Maps the resolved variant
 * `stock_status` to the verbatim pill copy. A special `colourOos` variant shows
 * "Out of stock for this colour" (§13.1). Announced politely.
 */
const COPY: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Only a few left",
  out_of_stock: "Out of stock",
};

const STYLE: Record<StockStatus, string> = {
  in_stock: "bg-green-50 text-green-700",
  low_stock: "bg-amber-50 text-amber-700",
  out_of_stock: "bg-gray-100 text-gray-600",
};

export function StockPill({
  status,
  colourOos = false,
}: {
  status: StockStatus;
  colourOos?: boolean;
}) {
  const label = colourOos ? "Out of stock for this colour" : COPY[status];
  return (
    <span
      aria-live="polite"
      className={
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium " +
        STYLE[colourOos ? "out_of_stock" : status]
      }
    >
      {label}
    </span>
  );
}
