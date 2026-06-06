"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSuggest } from "@/lib/api/hooks/search";
import { useRecentSearches } from "@/lib/stores/recent-searches";
import { formatBDT } from "@/lib/format";
import { SearchIcon } from "@/components/shell/icons";

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
          className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        />
        <button type="submit" aria-label="Search" className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
          <SearchIcon className="h-5 w-5" />
        </button>
      </form>

      {open && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
        >
          {!showSuggestions ? (
            recent.length > 0 ? (
              <Section title="Recent searches" action={<button type="button" onClick={clearRecent} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}>
                {recent.map((r) => (
                  <Row key={r} onClick={() => submit(r)}>{r}</Row>
                ))}
              </Section>
            ) : (
              <p className="px-4 py-3 text-sm text-gray-400">Keep typing…</p>
            )
          ) : isFetching && !data ? (
            <p className="px-4 py-3 text-sm text-gray-400">Searching…</p>
          ) : data &&
            (data.query_suggestions.length || data.category_suggestions.length || data.product_suggestions.length) ? (
            <>
              {data.query_suggestions.length > 0 && (
                <Section title="Suggestions">
                  {data.query_suggestions.map((q) => (
                    <Row key={q} onClick={() => submit(q)}>{q}</Row>
                  ))}
                </Section>
              )}
              {data.category_suggestions.length > 0 && (
                <Section title="Categories">
                  {data.category_suggestions.map((c) => (
                    <Link key={c.slug} href={`/c/${c.slug}`} onClick={() => setOpen(false)} className="block min-h-[44px] px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      {c.title} <span className="text-gray-400">in Categories</span>
                    </Link>
                  ))}
                </Section>
              )}
              {data.product_suggestions.length > 0 && (
                <Section title="Products">
                  {data.product_suggestions.map((p) => (
                    <Link key={p.id} href={`/p/${p.slug}`} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center gap-3 px-4 py-2 hover:bg-gray-50">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
                        {p.primary_image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.primary_image} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{p.title}</span>
                      <span className="shrink-0 text-sm font-medium text-gray-900">{formatBDT(Number(p.effective_price))}</span>
                    </Link>
                  ))}
                </Section>
              )}
            </>
          ) : (
            <button type="button" onClick={() => submit(value)} className="block w-full px-4 py-3 text-left text-sm text-gray-600 hover:bg-gray-50">
              No suggestions — press Enter to search ‘{value.trim()}’.
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="flex items-center justify-between px-4 py-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="option" aria-selected={false} onClick={onClick} className="block min-h-[44px] w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
      {children}
    </button>
  );
}
