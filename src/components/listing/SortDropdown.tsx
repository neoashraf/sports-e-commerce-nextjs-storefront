"use client";

import type { SortValue } from "@/lib/listing/url-state";

/**
 * Sort options (product-listing §5, §8; filter-panel §4). In the final design the
 * sort lives INSIDE the Filter & Sort drawer as a radio group (not an above-grid
 * dropdown), so this module exposes `SortRadioGroup` + the shared label map.
 * `relevance` is offered on search scope only; the caller writes `sort` to the
 * URL + resets page. The `SortValue` logic itself is untouched (url-state owns it).
 */
export const SORT_LABELS: Record<SortValue, string> = {
  relevance: "Relevance",
  newest: "Newest",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  best_selling: "Best Selling",
  discount: "Discount",
};

const ORDER: SortValue[] = [
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "best_selling",
  "discount",
];

/** A radio group of the sort options (used inside the Filter & Sort drawer). */
export function SortRadioGroup({
  value,
  isSearch,
  name = "sort",
  onChange,
}: {
  value: SortValue;
  isSearch: boolean;
  name?: string;
  onChange: (sort: SortValue) => void;
}) {
  const options = ORDER.filter((s) => s !== "relevance" || isSearch);

  return (
    <fieldset className="py-3">
      <legend className="text-body-sm font-semibold text-ink">Sort by</legend>
      <ul className="mt-2 space-y-1.5">
        {options.map((s) => (
          <li key={s}>
            <label className="flex min-h-[36px] cursor-pointer items-center gap-2 text-body-sm text-ink">
              <input
                type="radio"
                name={name}
                value={s}
                checked={value === s}
                onChange={() => onChange(s)}
                className="h-4 w-4 border-border-strong accent-volt"
              />
              <span>{SORT_LABELS[s]}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
