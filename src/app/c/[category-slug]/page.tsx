import { Suspense } from "react";
import { ProductListing } from "@/components/listing/ProductListing";
import { ListingSkeleton } from "@/components/listing/ListingSkeleton";

/**
 * Category browse PLP — `/c/<category-slug>` (search-listing-fe). Public, inside
 * the shell. Renders the shared listing with a category scope; the URL
 * querystring carries filter/sort/page state.
 */
export default function CategoryListingPage({
  params,
}: {
  params: { "category-slug": string };
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><ListingSkeleton /></div>}>
      <ProductListing scope={{ kind: "category", slug: params["category-slug"] }} />
    </Suspense>
  );
}
