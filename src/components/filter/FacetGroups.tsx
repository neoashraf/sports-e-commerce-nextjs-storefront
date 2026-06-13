"use client";

import { useState } from "react";
import type { Facet } from "@/lib/api/schemas/search";
import { formatBDT } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

/**
 * Renders all facet groups for the filter panel/drawer (filter-panel.md,
 * search-filter-fe AC1–AC3). A facet group is collapsible; term/color/size are
 * value lists (multi-select OR), price is a min/max numeric range, boolean is a
 * toggle. `selected` is the current per-key value set; `onToggle`/`onRange`
 * report changes. The host (sidebar=live, drawer=staged) owns URL/commit.
 */
const SHOW_MORE_THRESHOLD = 8;

/**
 * Light-vs-dark swatch check colour: derive from the swatch's own hex luminance so it
 * works for any colour the API returns (no name allow-list). Threshold 0.6 on relative
 * luminance — light swatches (White/Volt/Cyan/Silver…) get an ink check, dark get white.
 */
function isLightHex(hex?: string | null): boolean {
  if (!hex) return true; // neutral fallback swatch (#e5e7eb) is light
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6;
}

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
    <div className="divide-y divide-border">
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
        className="flex w-full items-center justify-between py-1 text-left text-body-sm font-semibold text-ink"
      >
        {label}
        <span aria-hidden="true" className="text-text-muted">{open ? "−" : "+"}</span>
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
  const isSize = facet.key === "size";
  const shown = expanded ? values : values.slice(0, SHOW_MORE_THRESHOLD);

  return (
    <FacetShell label={facet.label}>
      {isColor ? (
        // Swatch grid — dot + label + count; selected shows a luminance-aware check + tile ring.
        <div className="grid grid-cols-2 gap-1.5">
          {shown.map((v) => {
            const on = selected.includes(v.value);
            const checkColor = isLightHex(v.color_hex) ? "var(--ink-900)" : "#ffffff";
            return (
              <button
                key={v.value}
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-label={`${v.label}${v.count != null ? ` (${v.count})` : ""}`}
                onClick={() => onToggle(v.value)}
                className={
                  "flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-body-sm text-ink transition-colors duration-micro ease-out focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1 " +
                  (on ? "border-ink bg-surface-50" : "border-border hover:border-border-strong")
                }
              >
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-ink/15"
                  style={{ backgroundColor: v.color_hex ?? "#e5e7eb" }}
                  aria-hidden="true"
                >
                  {on && <Icon name="check" size={14} strokeWidth={3} color={checkColor} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{v.label}</span>
                {v.count != null && <span className="text-text-faint">{v.count}</span>}
              </button>
            );
          })}
        </div>
      ) : isSize ? (
        // Size pills — selected = volt/ink fill, aria-pressed.
        <div className="flex flex-wrap gap-1.5">
          {shown.map((v) => {
            const on = selected.includes(v.value);
            return (
              <button
                key={v.value}
                type="button"
                aria-pressed={on}
                aria-label={`Size ${v.value}`}
                onClick={() => onToggle(v.value)}
                className={
                  "inline-flex h-9 min-w-[40px] items-center justify-center rounded-md border px-2.5 text-body-sm font-semibold transition-colors duration-micro ease-out focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1 " +
                  (on ? "border-ink bg-ink text-white" : "border-border-strong text-ink hover:border-volt-600 hover:text-volt-600")
                }
              >
                {v.label}
              </button>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((v) => (
            <li key={v.value}>
              <label className="flex min-h-[36px] cursor-pointer items-center gap-2 text-body-sm text-ink">
                <input
                  type="checkbox"
                  checked={selected.includes(v.value)}
                  onChange={() => onToggle(v.value)}
                  className="h-4 w-4 rounded-sm border-border-strong text-ink accent-volt"
                />
                <span className="break-words">{v.label}</span>
                {v.count != null && <span className="text-text-muted">({v.count})</span>}
              </label>
            </li>
          ))}
        </ul>
      )}
      {values.length > SHOW_MORE_THRESHOLD && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-body-sm font-semibold text-volt-600 hover:underline"
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
            className="h-11 w-full rounded-sm border border-border-strong px-2 text-body-sm text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]"
          />
        </label>
        <span aria-hidden="true" className="text-text-muted">–</span>
        <label className="flex-1">
          <span className="sr-only">Maximum price</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={max}
            placeholder={facet.max ? formatBDT(Number(facet.max)) : "Max ৳"}
            onChange={(e) => onChange(min, e.target.value)}
            className="h-11 w-full rounded-sm border border-border-strong px-2 text-body-sm text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]"
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
  const label = facet.key === "in_stock" ? "In stock only" : facet.key === "on_sale" ? "On sale" : facet.label;
  return (
    <div className="py-3">
      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-body-sm font-medium text-ink">
          {label}
          {facet.count != null && <span className="text-text-muted">({facet.count})</span>}
        </span>
        {/* Styled switch — role="switch" aria-checked, volt-on, keyboard-operable. */}
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={label}
          onClick={() => onChange(!on)}
          className={
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-micro ease-out focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 motion-reduce:transition-none " +
            (on ? "bg-volt" : "bg-border-strong")
          }
        >
          <span
            aria-hidden="true"
            className={
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-micro ease-out motion-reduce:transition-none " +
              (on ? "translate-x-[22px]" : "translate-x-0.5")
            }
          />
        </button>
      </div>
    </div>
  );
}
