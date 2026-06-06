"use client";

import { AutosuggestSearchBox } from "@/components/search/AutosuggestSearchBox";

/**
 * Shell search-box slot (storefront-shell §5). The shell owns placement/style;
 * the SEARCH BEHAVIOR (debounced suggest, submit, recent searches, overlay) is
 * owned by search-filter-fe via AutosuggestSearchBox, mounted here.
 */
export function SearchBox({ className = "" }: { className?: string }) {
  return <AutosuggestSearchBox className={className} />;
}
