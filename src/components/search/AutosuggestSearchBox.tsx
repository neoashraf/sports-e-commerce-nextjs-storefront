"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSuggest } from "@/lib/api/hooks/search";
import { useRecentSearches } from "@/lib/stores/recent-searches";
import { formatBDT } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { SearchIcon } from "@/components/shell/icons";
import { Icon } from "@/components/ui/Icon";

/** Bold the matched substring of `text` against `query` — by weight only, case-insensitive. */
function Emphasise({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-bold text-ink">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * Search box + autosuggest overlay (search-autosuggest.md, search-filter-fe
 * AC5/AC6/AC8). Debounced (~150ms, min 2 chars) suggest; overlay shows recent
 * searches (empty/below-min), query/category/product suggestions; submit routes
 * to /search?q= (trimmed, min2) and records the recent search. Suggest fails
 * silently (degrades to recent). Combobox semantics + ≥44px rows.
 */
export function AutosuggestSearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const recent = useRecentSearches((s) => s.recent);
  const addRecent = useRecentSearches((s) => s.add);
  const clearRecent = useRecentSearches((s) => s.clear);

  // Debounce the query feeding the suggest hook.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 150);
    return () => clearTimeout(t);
  }, [value]);

  const { data, isFetching } = useSuggest(debounced);
  const showSuggestions = debounced.trim().length >= 2;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 2) return; // short submit is a silent no-op
    addRecent(trimmed);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed.slice(0, 120))}`);
  }

  return (
    <div ref={rootRef} className={"relative w-full " + className}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); submit(value); }} className="relative">
        <label htmlFor="storefront-search" className="sr-only">
          Search for products, brands…
        </label>
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <SearchIcon className="h-5 w-5" />
        </span>
        <input
          id="storefront-search"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions"
          autoComplete="off"
          inputMode="search"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setValue(e.target.value); setOpen(true); }}
          placeholder="Search for products, brands…"
          className="h-11 w-full rounded-sm border border-border-strong bg-white pl-10 pr-11 text-body text-ink placeholder:text-text-faint transition-[border-color,box-shadow] duration-micro ease-out focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)] [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { setValue(""); setDebounced(""); }}
            className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            <span aria-hidden="true" className="text-lg leading-none">✕</span>
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        )}
      </form>

      {open && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-hidden rounded-md border border-border bg-white shadow-pop"
        >
          {/* Slim indeterminate loading bar under the input (replaces the "Searching…" line). */}
          {showSuggestions && isFetching && (
            <div className="h-0.5 w-full overflow-hidden bg-surface-100" aria-hidden="true">
              <div className="h-full w-1/3 animate-[searchbar_1.1s_ease-in-out_infinite] bg-volt-600 motion-reduce:w-full motion-reduce:animate-none" />
            </div>
          )}
          <div className="max-h-[calc(70vh-2px)] overflow-y-auto py-2">
            {!showSuggestions ? (
              recent.length > 0 ? (
                <Section title="Recent searches" icon="clock" action={<button type="button" onClick={clearRecent} className="text-body-sm font-semibold text-volt-600 hover:underline">Clear</button>}>
                  {recent.map((r) => (
                    <Row key={r} icon="clock" onClick={() => submit(r)}>{r}</Row>
                  ))}
                </Section>
              ) : (
                <p className="px-4 py-3 text-body-sm text-text-faint">Keep typing…</p>
              )
            ) : isFetching && !data ? (
              // Loading: the slim bar above is the visual cue; keep an SR-only live status.
              <p className="sr-only" aria-live="polite">Searching…</p>
            ) : data &&
              (data.query_suggestions.length || data.category_suggestions.length || data.product_suggestions.length) ? (
              // Desktop ≥1024px → two columns (text suggestions left, product rows right);
              // single stacked column below the breakpoint.
              <div className="lg:grid lg:grid-cols-[1fr_minmax(0,18rem)] lg:divide-x lg:divide-border">
                <div className="min-w-0">
                  {data.query_suggestions.length > 0 && (
                    <Section title="Suggestions" icon="search">
                      {data.query_suggestions.map((q) => (
                        <Row key={q} icon="search" onClick={() => submit(q)}>
                          <Emphasise text={q} query={debounced} />
                        </Row>
                      ))}
                    </Section>
                  )}
                  {data.category_suggestions.length > 0 && (
                    <Section title="Categories" icon="layout-grid">
                      {data.category_suggestions.map((c) => (
                        <Link key={c.slug} href={`/c/${c.slug}`} onClick={() => setOpen(false)} role="option" aria-selected={false} className="flex min-h-[44px] items-center gap-2.5 px-4 py-2 text-body-sm text-ink transition-colors duration-micro ease-out hover:bg-surface-100">
                          <Icon name="layout-grid" size={16} className="shrink-0 text-text-muted" aria-hidden="true" />
                          <span className="break-words">
                            <Emphasise text={c.title} query={debounced} /> <span className="text-text-muted">in Categories</span>
                          </span>
                        </Link>
                      ))}
                    </Section>
                  )}
                </div>
                {data.product_suggestions.length > 0 && (
                  <div className="min-w-0 border-t border-border lg:border-t-0">
                    <Section title="Products">
                      {data.product_suggestions.map((p) => {
                        const eff = Number(p.effective_price);
                        return (
                          <Link key={p.id} href={`/p/${p.slug}`} onClick={() => setOpen(false)} role="option" aria-selected={false} className="flex min-h-[44px] items-center gap-3 px-4 py-2 transition-colors duration-micro ease-out hover:bg-surface-100">
                            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-surface-100">
                              {p.primary_image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={resolveMediaUrl(p.primary_image)} alt="" className="h-full w-full object-cover" loading="lazy" />
                              )}
                            </span>
                            {/* Brand line omitted — the suggest payload carries no `brand` (flagged; an
                                RW6-style data add). Title renders as the single line per the brief. */}
                            <span className="line-clamp-2 min-w-0 flex-1 break-words text-body-sm text-ink">
                              <Emphasise text={p.title} query={debounced} />
                            </span>
                            <span className="shrink-0 text-body-sm font-semibold tabular-nums text-ink">{formatBDT(eff)}</span>
                          </Link>
                        );
                      })}
                    </Section>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => submit(value)} className="block w-full px-4 py-3 text-left text-body-sm text-text-muted transition-colors duration-micro ease-out hover:bg-surface-100">
                No suggestions — press Enter to search ‘{value.trim()}’.
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, action, children }: { title: string; icon?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="flex items-center justify-between px-4 py-1">
        <p className="flex items-center gap-1.5 text-label font-semibold uppercase tracking-wide text-text-muted">
          {icon && <Icon name={icon} size={13} aria-hidden="true" />}
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({ onClick, icon, children }: { onClick: () => void; icon?: string; children: React.ReactNode }) {
  return (
    <button type="button" role="option" aria-selected={false} onClick={onClick} className="flex min-h-[44px] w-full items-center gap-2.5 px-4 py-2 text-left text-body-sm text-ink transition-colors duration-micro ease-out hover:bg-surface-100">
      {icon && <Icon name={icon} size={16} className="shrink-0 text-text-muted" aria-hidden="true" />}
      <span className="min-w-0 break-words">{children}</span>
    </button>
  );
}
