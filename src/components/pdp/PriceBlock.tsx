import { formatBDT } from "@/lib/format";

/** Parse a decimal-string price ("12500.00") to a number for formatting. */
function toAmount(price: string): number {
  const n = Number(price);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Price block (product-detail §5, AC3). Shows the effective price; when on sale
 * the base price is struck through with a "Sale" badge. `effective`/`base`
 * update to the resolved variant price. Price changes are announced politely.
 */
export function PriceBlock({
  effective,
  base,
  saleActive,
}: {
  effective: string;
  base: string;
  saleActive: boolean;
}) {
  const eff = toAmount(effective);
  const baseAmt = toAmount(base);
  const showStrike = saleActive && baseAmt > eff;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-live="polite">
      <span className="text-2xl font-bold text-gray-900">{formatBDT(eff)}</span>
      {showStrike && (
        <span className="text-base text-gray-400 line-through">{formatBDT(baseAmt)}</span>
      )}
      {showStrike && (
        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
          Sale
        </span>
      )}
    </div>
  );
}
