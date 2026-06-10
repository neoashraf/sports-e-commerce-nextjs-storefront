"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Facet } from "@/lib/api/schemas/search";
import type { SortValue } from "@/lib/listing/url-state";
import { CloseIcon } from "@/components/shell/icons";
import { SortRadioGroup } from "@/components/listing/SortDropdown";
import { FacetGroups, type FacetSelection } from "./FacetGroups";

/**
 * Filter & Sort drawer (filter-panel.md, product-listing.md — reskinned RW2).
 * The final design replaces the desktop live sidebar + above-grid sort with ONE
 * right-anchored drawer (≥768px, ~420px) / bottom sheet (≤639px) that holds the
 * Sort radios + facet accordions + a sticky Apply footer. It STAGES a draft on
 * all breakpoints and commits on Apply; ✕ / scrim / Esc discard. Focus is trapped
 * and returned to the trigger on close (the host re-focuses it).
 *
 * The host (ProductListing) still owns all URL/commit logic; this only stages and
 * reports the chosen facets + sort.
 */
export function FilterPanel({
  facets,
  selection,
  sort,
  isSearch,
  isLoading,
  isError,
  onRetry,
  onCommit,
  onSortChange,
  drawerOpen,
  onCloseDrawer,
  activeCount,
}: {
  facets: Facet[];
  selection: FacetSelection;
  sort: SortValue;
  isSearch: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCommit: (next: FacetSelection) => void;
  onSortChange: (sort: SortValue) => void;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  activeCount: number;
}) {
  if (!drawerOpen) return null;
  return (
    <FilterDrawer
      facets={facets}
      selection={selection}
      sort={sort}
      isSearch={isSearch}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      onApply={(nextFacets, nextSort) => {
        if (nextSort !== sort) onSortChange(nextSort);
        onCommit(nextFacets);
        onCloseDrawer();
      }}
      onClose={onCloseDrawer}
      activeCount={activeCount}
    />
  );
}

/** Shared facet body. */
function FilterBody({
  facets,
  selection,
  isLoading,
  isError,
  onRetry,
  onChange,
}: {
  facets: Facet[];
  selection: FacetSelection;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onChange: (next: FacetSelection) => void;
}) {
  function toggleTerm(key: string, value: string) {
    const cur = selection.terms[key] ?? [];
    const nextVals = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    onChange({ ...selection, terms: { ...selection.terms, [key]: nextVals } });
  }
  function setPrice(min: string, max: string) {
    onChange({ ...selection, priceMin: min, priceMax: max });
  }
  function setBoolean(key: string, on: boolean) {
    onChange({ ...selection, booleans: { ...selection.booleans, [key]: on } });
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-sm bg-surface-100" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="text-body-sm text-text-muted">
        <p>Couldn&apos;t load filters.</p>
        <button type="button" onClick={onRetry} className="mt-1 font-semibold text-volt-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }
  if (facets.length === 0) {
    return <p className="text-body-sm text-text-muted">No filters available for these products.</p>;
  }

  return (
    <FacetGroups
      facets={facets}
      selection={selection}
      onToggleTerm={toggleTerm}
      onPrice={setPrice}
      onBoolean={setBoolean}
    />
  );
}

/**
 * The Filter & Sort drawer — right-anchored on ≥sm, bottom sheet on mobile.
 * Stages a local facet selection + sort until Apply.
 */
function FilterDrawer({
  facets,
  selection,
  sort,
  isSearch,
  isLoading,
  isError,
  onRetry,
  onApply,
  onClose,
  activeCount,
}: {
  facets: Facet[];
  selection: FacetSelection;
  sort: SortValue;
  isSearch: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onApply: (next: FacetSelection, sort: SortValue) => void;
  onClose: () => void;
  activeCount: number;
}) {
  const [staged, setStaged] = useState<FacetSelection>(selection);
  const [stagedSort, setStagedSort] = useState<SortValue>(sort);
  const panelRef = useRef<HTMLDivElement>(null);
  // Re-sync when the underlying URL selection changes (e.g. chip removed elsewhere).
  useEffect(() => setStaged(selection), [selection]);
  useEffect(() => setStagedSort(sort), [sort]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>("button, input, a[href]")?.focus(),
    );
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") trap(e, panelRef.current);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function clearAll() {
    setStaged({ terms: {}, priceMin: "", priceMax: "", booleans: {} });
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/55" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter and sort"
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-lg bg-white shadow-pop sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none motion-safe:animate-[slideUp_180ms_ease-out]"
      >
        {/* Drag handle (mobile) */}
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong sm:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-h3 font-bold text-ink">
            Filter &amp; Sort{activeCount > 0 ? ` · ${activeCount}` : ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 divide-y divide-border overflow-y-auto px-5">
          <SortRadioGroup value={stagedSort} isSearch={isSearch} onChange={setStagedSort} />
          <FilterBody
            facets={facets}
            selection={staged}
            isLoading={isLoading}
            isError={isError}
            onRetry={onRetry}
            onChange={setStaged}
          />
        </div>

        <div className="flex items-center gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex h-12 items-center rounded-md border border-border-strong px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onApply(staged, stagedSort)}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-volt text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}

/** Keep Tab focus within the drawer panel. */
function trap(e: KeyboardEvent, panel: HTMLElement | null) {
  if (!panel) return;
  const focusables = panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
