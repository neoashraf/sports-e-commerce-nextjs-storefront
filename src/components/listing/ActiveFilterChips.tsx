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
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-50 py-1 pl-3 pr-1 text-body-sm text-ink"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remove filter ${chip.label}`}
            onClick={() => onRemove(chip)}
            className="grid h-7 w-7 place-items-center rounded-full text-text-muted transition-colors duration-micro ease-out hover:bg-surface-100 hover:text-ink"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="rounded-sm px-2 py-1 text-body-sm font-semibold text-volt-600 hover:bg-surface-100"
      >
        Clear all
      </button>
    </div>
  );
}
