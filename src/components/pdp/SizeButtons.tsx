"use client";

import { useRef } from "react";
import type { AttributeOption } from "@/lib/api/schemas/catalog";

/**
 * Size button group (product-detail §5, §10, AC3/AC4). A `radiogroup` of size
 * buttons; a size is enabled only when it's in `sellableIds`. Disabled/OOS sizes
 * render struck + reduced-opacity AND are announced ("Size 43, out of stock") —
 * never disabled by colour alone. Arrow keys move between ENABLED sizes.
 */
export function SizeButtons({
  label,
  options,
  sellableIds,
  selected,
  onSelect,
  groupRef,
}: {
  label: string;
  options: AttributeOption[];
  sellableIds: Set<string>;
  selected: string | null;
  onSelect: (id: string) => void;
  groupRef?: React.Ref<HTMLDivElement>;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function moveTo(fromIdx: number, dir: 1 | -1) {
    const n = options.length;
    for (let step = 1; step <= n; step++) {
      const i = (fromIdx + dir * step + n * step) % n;
      if (sellableIds.has(options[i].id)) {
        refs.current[i]?.focus();
        onSelect(options[i].id);
        return;
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveTo(idx, 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveTo(idx, -1);
    }
  }

  const firstEnabledIdx = options.findIndex((o) => sellableIds.has(o.id));

  return (
    <div ref={groupRef}>
      <p className="mb-2 text-sm font-medium text-gray-900">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((opt, idx) => {
          const enabled = sellableIds.has(opt.id);
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              ref={(el) => {
                refs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={!enabled}
              aria-label={enabled ? `Size ${opt.value}` : `Size ${opt.value}, out of stock`}
              tabIndex={isSelected || (!selected && idx === firstEnabledIdx) ? 0 : -1}
              onClick={() => enabled && onSelect(opt.id)}
              onKeyDown={(e) => enabled && onKeyDown(e, idx)}
              className={
                "inline-flex h-11 min-w-[44px] items-center justify-center rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 " +
                (isSelected
                  ? "border-brand-600 bg-brand-600 text-white"
                  : enabled
                    ? "border-gray-300 text-gray-800 hover:border-gray-500"
                    : "cursor-not-allowed border-gray-200 text-gray-300 line-through")
              }
            >
              {opt.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
