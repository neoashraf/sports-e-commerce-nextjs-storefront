/**
 * URL is the single source of truth for the PLP's filter/sort/page state
 * (search-listing-fe, FR-SRCH-050/051). These helpers turn the
 * `URLSearchParams` into a typed param object for the API and back, ignoring
 * unknown/malformed params silently (no error, no chip).
 */

export const SORT_VALUES = [
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "best_selling",
  "discount",
] as const;
export type SortValue = (typeof SORT_VALUES)[number];

/** Reserved (non-facet) keys that aren't rendered as filter chips. */
const RESERVED = new Set(["q", "sort", "page", "limit"]);

export interface ListingState {
  sort?: SortValue;
  page: number;
  /** All facet params (everything that isn't reserved), multi-value supported. */
  facets: Record<string, string[]>;
}

export function parseListingState(sp: URLSearchParams): ListingState {
  const rawSort = sp.get("sort");
  const sort = SORT_VALUES.includes(rawSort as SortValue)
    ? (rawSort as SortValue)
    : undefined;
  const page = Math.max(1, Number(sp.get("page")) || 1);

  const facets: Record<string, string[]> = {};
  for (const key of new Set(sp.keys())) {
    if (RESERVED.has(key)) continue;
    const values = sp.getAll(key).filter((v) => v.trim() !== "");
    // Dedup conflicting/duplicate values (§13.5).
    const deduped = Array.from(new Set(values));
    if (deduped.length > 0) facets[key] = deduped;
  }
  return { sort, page, facets };
}

/** Flatten the state into the API param object (multi-value facets repeat). */
export function toApiParams(
  state: ListingState,
  limit = 24,
): Record<string, string | number | boolean | undefined> {
  const params: Record<string, string | number | boolean | undefined> = {
    page: state.page,
    limit,
  };
  if (state.sort) params.sort = state.sort;
  // Note: the typed client serializes a single value per key; multi-select
  // facets are joined with a comma here (the BE accepts repeated or CSV).
  for (const [k, vals] of Object.entries(state.facets)) {
    params[k] = vals.join(",");
  }
  return params;
}

/** Build a new querystring with one mutation applied (immutably). */
export function mutateSearch(
  sp: URLSearchParams,
  fn: (next: URLSearchParams) => void,
): string {
  const next = new URLSearchParams(sp.toString());
  fn(next);
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}
