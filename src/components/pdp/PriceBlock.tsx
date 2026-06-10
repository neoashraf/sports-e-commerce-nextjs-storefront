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
      <span className={"text-h1 font-bold tabular-nums " + (showStrike ? "text-sale" : "text-ink")}>
        {formatBDT(eff)}
      </span>
      {showStrike && (
        <span className="text-body text-text-muted line-through tabular-nums">{formatBDT(baseAmt)}</span>
      )}
      {showStrike && (
        <span className="rounded-sm bg-sale px-2 py-0.5 text-label font-bold text-white">
          Sale
        </span>
      )}
    </div>
  );
}
