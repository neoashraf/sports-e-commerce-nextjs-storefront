"use client";

/**
 * Active-filter chips + Clear all (product-listing §5, §8, AC4). One chip per
 * applied facet value (term values, price range, booleans). Each chip's ✕
 * removes that single value; "Clear all" drops every facet param. Chips mirror
 * the filter panel's selections (search-filter-fe).
 */
export interface Chip {
  /** Facet key (e.g. "color", "price", "on_sale"). */
  key: string;
  /** The specific value to remove (term value or boolean marker). */
  value: string;
  /** Human label, e.g. "Color: Black" or "৳2,000–৳10,000". */
  label: string;
}

export function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
}: {
  chips: Chip[];
  onRemove: (chip: Chip) => void;
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={`${chip.key}:${chip.value}`}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-3 pr-1 text-sm text-gray-700"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remove filter ${chip.label}`}
            onClick={() => onRemove(chip)}
            className="grid h-7 w-7 place-items-center rounded-full text-gray-500 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="rounded-md px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        Clear all
      </button>
    </div>
  );
}
