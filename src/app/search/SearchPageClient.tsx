"use client";

import { useSearchParams } from "next/navigation";
import { ProductListing } from "@/components/listing/ProductListing";

/**
 * Reads the `q` query param and renders the shared listing in search scope
 * (search-listing-fe). Split out so the page can wrap it in <Suspense>
 * (useSearchParams requirement).
 */
export function SearchPageClient() {
  const sp = useSearchParams();
  const query = sp.get("q") ?? "";
  return <ProductListing scope={{ kind: "search", query }} />;
}
