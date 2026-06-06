import { Suspense } from "react";
import { SearchPageClient } from "./SearchPageClient";
import { ListingSkeleton } from "@/components/listing/ListingSkeleton";

/**
 * Keyword search results — `/search?q=…` (search-listing-fe). Public, inside the
 * shell. Renders the shared listing in search scope; filter/sort/page live in
 * the URL alongside `q`.
 */
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><ListingSkeleton /></div>}>
      <SearchPageClient />
    </Suspense>
  );
}
