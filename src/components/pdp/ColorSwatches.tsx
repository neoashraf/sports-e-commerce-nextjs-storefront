"use client";

import { useRef } from "react";
import type { AttributeOption } from "@/lib/api/schemas/catalog";

/**
 * Colour swatch group (product-detail §5, §10, AC2). A `radiogroup` of swatches
 * using `swatch_value` (hex chip or image). Colour is never conveyed by hue
 * alone — the selected swatch carries a checkmark ring and the accessible name
 * is the option value. Arrow keys move selection; visible focus ring.
 */
export function ColorSwatches({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: AttributeOption[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next =
      e.key === "ArrowRight"
        ? (idx + 1) % options.length
        : (idx - 1 + options.length) % options.length;
    refs.current[next]?.focus();
    onSelect(options[next].id);
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-900">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((opt, idx) => {
          const isSelected = selected === opt.id;
          const isImage = opt.swatch_type === "image" && opt.swatch_value;
          return (
            <button
              key={opt.id}
              ref={(el) => {
                refs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={opt.value}
              tabIndex={isSelected || (!selected && idx === 0) ? 0 : -1}
              onClick={() => onSelect(opt.id)}
              onKeyDown={(e) => onKeyDown(e, idx)}
              className={
                "relative grid h-11 w-11 place-items-center rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 " +
                (isSelected ? "border-brand-600" : "border-gray-200 hover:border-gray-400")
              }
            >
              <span
                aria-hidden="true"
                className="h-7 w-7 rounded-full bg-cover bg-center ring-1 ring-inset ring-black/10"
                style={
                  isImage
                    ? { backgroundImage: `url(${opt.swatch_value})` }
                    : { backgroundColor: opt.swatch_value ?? "#e5e7eb" }
                }
              />
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-[10px] text-white"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
