"use client";

import type { SortValue } from "@/lib/listing/url-state";

/**
 * Sort control (product-listing §5, §8, AC3). Native <select> for built-in
 * listbox semantics + keyboard. `relevance` is offered on search scope only;
 * defaults differ by scope (category → best_selling, search → relevance).
 * Selecting calls `onChange` (caller writes `sort` to the URL + resets page).
 */
const LABELS: Record<SortValue, string> = {
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

export function SortDropdown({
  value,
  isSearch,
  disabled,
  onChange,
}: {
  value: SortValue;
  isSearch: boolean;
  disabled?: boolean;
  onChange: (sort: SortValue) => void;
}) {
  const options = ORDER.filter((s) => s !== "relevance" || isSearch);

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">Sort by</span>
      <span aria-hidden="true" className="text-gray-500">Sort:</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:opacity-50"
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
