"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Facet } from "@/lib/api/schemas/search";
import { CloseIcon } from "@/components/shell/icons";
import { FacetGroups, type FacetSelection } from "./FacetGroups";

/**
 * Filter panel/drawer (filter-panel.md, search-filter-fe). Desktop: a live left
 * sidebar — each change commits to the URL immediately. Mobile/tablet: a
 * focus-trapped bottom-sheet drawer that STAGES changes and commits on Apply
 * (✕/scrim discards). The host (ProductListing) supplies facets, the parsed
 * selection from the URL, and `onCommit` which writes the new selection to the
 * URL (resetting page).
 *
 * Loading / error / empty facet states are handled here so the grid stays
 * usable even when facets fail.
 */
export function FilterPanel({
  facets,
  selection,
  isLoading,
  isError,
  onRetry,
  onCommit,
  drawerOpen,
  onCloseDrawer,
  activeCount,
}: {
  facets: Facet[];
  selection: FacetSelection;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCommit: (next: FacetSelection) => void;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  activeCount: number;
}) {
  return (
    <>
      {/* Desktop live sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <FilterBody
          facets={facets}
          selection={selection}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
          live
          onChange={onCommit}
        />
      </aside>

      {/* Mobile staged drawer */}
      {drawerOpen && (
        <MobileFilterDrawer
          facets={facets}
          selection={selection}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
          onApply={(next) => {
            onCommit(next);
            onCloseDrawer();
          }}
          onClose={onCloseDrawer}
          activeCount={activeCount}
        />
      )}
    </>
  );
}

/** Shared facet body; `live` commits each change immediately. */
function FilterBody({
  facets,
  selection,
  isLoading,
  isError,
  onRetry,
  live,
  onChange,
}: {
  facets: Facet[];
  selection: FacetSelection;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  live: boolean;
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
          <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="text-sm text-gray-500">
        <p>Couldn&apos;t load filters.</p>
        <button type="button" onClick={onRetry} className="mt-1 font-medium text-brand-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }
  if (facets.length === 0) {
    return <p className="text-sm text-gray-500">No filters available for these products.</p>;
  }

  void live;
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

/** Mobile bottom-sheet drawer that stages a local selection until Apply. */
function MobileFilterDrawer({
  facets,
  selection,
  isLoading,
  isError,
  onRetry,
  onApply,
  onClose,
  activeCount,
}: {
  facets: Facet[];
  selection: FacetSelection;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onApply: (next: FacetSelection) => void;
  onClose: () => void;
  activeCount: number;
}) {
  const [staged, setStaged] = useState<FacetSelection>(selection);
  const panelRef = useRef<HTMLDivElement>(null);
  // Re-sync when the underlying URL selection changes (e.g. chip removed elsewhere).
  useEffect(() => setStaged(selection), [selection]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const stagedCount = useMemo(() => countSelection(staged), [staged]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-xl motion-safe:animate-[slideUp_180ms_ease-out]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Filters{activeCount > 0 ? ` · ${activeCount}` : ""}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full text-gray-500 hover:bg-gray-100">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          <FilterBody
            facets={facets}
            selection={staged}
            isLoading={isLoading}
            isError={isError}
            onRetry={onRetry}
            live={false}
            onChange={setStaged}
          />
        </div>
        <div className="border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => onApply(staged)}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Apply{stagedCount > 0 ? ` (${stagedCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function countSelection(sel: FacetSelection): number {
  const terms = Object.values(sel.terms).reduce((n, v) => n + v.length, 0);
  const price = sel.priceMin || sel.priceMax ? 1 : 0;
  const bools = Object.values(sel.booleans).filter(Boolean).length;
  return terms + price + bools;
}
