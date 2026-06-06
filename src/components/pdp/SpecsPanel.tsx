"use client";

import { useState } from "react";
import type { Spec } from "@/lib/api/schemas/catalog";
import { ChevronDownIcon } from "@/components/shell/icons";

/**
 * Specs panel (product-detail §5, §8, AC7). Renders `specs[]` as label/value
 * rows (multiselect values joined with " · "). Collapsible — expanded on
 * desktop, collapsed on mobile (controlled by `defaultOpen`). Hidden entirely
 * when there are no specs (caller omits, but guarded here too).
 */
function renderValue(value: Spec["value"]): string {
  return Array.isArray(value) ? value.join(" · ") : value;
}

export function SpecsPanel({
  specs,
  defaultOpen = false,
}: {
  specs: Spec[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (specs.length === 0) return null;

  return (
    <section className="border-t border-gray-200 py-4">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between py-1 text-left text-base font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          Product details
          <ChevronDownIcon className={"h-5 w-5 transition-transform " + (open ? "rotate-180" : "")} />
        </button>
      </h2>
      {open && (
        <dl className="mt-3 grid grid-cols-1 gap-y-2 sm:grid-cols-[max-content_1fr] sm:gap-x-6">
          {specs.map((spec) => (
            <div key={spec.code} className="contents">
              <dt className="text-sm font-medium text-gray-500">{spec.label}</dt>
              <dd className="break-words text-sm text-gray-900">{renderValue(spec.value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
