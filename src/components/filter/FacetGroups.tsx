"use client";

import { useState } from "react";
import type { Facet } from "@/lib/api/schemas/search";
import { formatBDT } from "@/lib/format";

/**
 * Renders all facet groups for the filter panel/drawer (filter-panel.md,
 * search-filter-fe AC1–AC3). A facet group is collapsible; term/color/size are
 * value lists (multi-select OR), price is a min/max numeric range, boolean is a
 * toggle. `selected` is the current per-key value set; `onToggle`/`onRange`
 * report changes. The host (sidebar=live, drawer=staged) owns URL/commit.
 */
const SHOW_MORE_THRESHOLD = 8;

export interface FacetSelection {
  /** facet key → selected term values (for term/color/size). */
  terms: Record<string, string[]>;
  /** price min/max as strings (empty = unset). */
  priceMin: string;
  priceMax: string;
  /** boolean facet key → on. */
  booleans: Record<string, boolean>;
}

export function FacetGroups({
  facets,
  selection,
  onToggleTerm,
  onPrice,
  onBoolean,
}: {
  facets: Facet[];
  selection: FacetSelection;
  onToggleTerm: (key: string, value: string) => void;
  onPrice: (min: string, max: string) => void;
  onBoolean: (key: string, on: boolean) => void;
}) {
  return (
    <div className="divide-y divide-gray-100">
      {facets.map((facet) => {
        if (facet.type === "range") {
          return (
            <PriceFacet
              key={facet.key}
              facet={facet}
              min={selection.priceMin}
              max={selection.priceMax}
              onChange={onPrice}
            />
          );
        }
        if (facet.type === "boolean") {
          return (
            <BooleanFacet
              key={facet.key}
              facet={facet}
              on={!!selection.booleans[facet.key]}
              onChange={(on) => onBoolean(facet.key, on)}
            />
          );
        }
        // term (incl. color/size by key)
        return (
          <TermFacet
            key={facet.key}
            facet={facet}
            selected={selection.terms[facet.key] ?? []}
            onToggle={(v) => onToggleTerm(facet.key, v)}
          />
        );
      })}
    </div>
  );
}

function FacetShell({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="py-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-1 text-left text-sm font-semibold text-gray-900"
      >
        {label}
        <span aria-hidden="true" className="text-gray-400">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function TermFacet({
  facet,
  selected,
  onToggle,
}: {
  facet: Facet;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const values = facet.values ?? [];
  if (values.length === 0) return null;
  const isColor = facet.key === "color";
  const shown = expanded ? values : values.slice(0, SHOW_MORE_THRESHOLD);

  return (
    <FacetShell label={facet.label}>
      {isColor ? (
        <div className="flex flex-wrap gap-2">
          {shown.map((v) => {
            const on = selected.includes(v.value);
            return (
              <button
                key={v.value}
                type="button"
                aria-pressed={on}
                aria-label={`${v.label}${v.count != null ? ` (${v.count})` : ""}`}
                onClick={() => onToggle(v.value)}
                className={
                  "grid h-9 w-9 place-items-center rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 " +
                  (on ? "border-brand-600" : "border-gray-200")
                }
              >
                <span className="h-6 w-6 rounded-full ring-1 ring-inset ring-black/10" style={{ backgroundColor: v.color_hex ?? "#e5e7eb" }} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((v) => (
            <li key={v.value}>
              <label className="flex min-h-[36px] cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selected.includes(v.value)}
                  onChange={() => onToggle(v.value)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                />
                <span className="break-words">{v.label}</span>
                {v.count != null && <span className="text-gray-400">({v.count})</span>}
              </label>
            </li>
          ))}
        </ul>
      )}
      {values.length > SHOW_MORE_THRESHOLD && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs font-medium text-brand-600 hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </FacetShell>
  );
}

function PriceFacet({
  facet,
  min,
  max,
  onChange,
}: {
  facet: Facet;
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
}) {
  return (
    <FacetShell label={facet.label}>
      <div className="flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">Minimum price</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={min}
            placeholder={facet.min ? formatBDT(Number(facet.min)) : "Min ৳"}
            onChange={(e) => onChange(e.target.value, max)}
            className="h-10 w-full rounded-md border border-gray-300 px-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </label>
        <span aria-hidden="true" className="text-gray-400">–</span>
        <label className="flex-1">
          <span className="sr-only">Maximum price</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={max}
            placeholder={facet.max ? formatBDT(Number(facet.max)) : "Max ৳"}
            onChange={(e) => onChange(min, e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 px-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </label>
      </div>
    </FacetShell>
  );
}

function BooleanFacet({
  facet,
  on,
  onChange,
}: {
  facet: Facet;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="py-3">
      <label className="flex min-h-[44px] cursor-pointer items-center justify-between text-sm font-medium text-gray-800">
        <span>{facet.key === "in_stock" ? "In stock only" : facet.key === "on_sale" ? "On sale" : facet.label}</span>
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
        />
      </label>
    </div>
  );
}
