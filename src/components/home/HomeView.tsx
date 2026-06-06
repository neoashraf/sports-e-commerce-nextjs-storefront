"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useHomepage } from "@/lib/api/hooks/content";
import { useNewArrivals } from "@/lib/api/hooks/listings";
import { useCategoryTree } from "@/lib/api/hooks/categories";
import type { HomeSection, SectionItem } from "@/lib/api/schemas/content";
import type { ListingProduct } from "@/lib/api/schemas/search";
import { Hero } from "./Hero";
import { PromoStrip } from "./PromoStrip";
import { HomeCarousel } from "./HomeCarousel";
import { CategoryTiles } from "./CategoryTiles";

/**
 * Home page body (cms-home-fe). Assembles the MVP regions inside the shell:
 * hero → promo → Featured → category tiles → New Arrivals. Each region fetches
 * independently (no full-page blocker). The whole-payload error degrades to a
 * placeholder hero + a "Couldn't load the homepage." band; the New-Arrivals
 * carousel and tiles carry their own section error/empty states.
 */
function sectionToProducts(section: HomeSection | undefined): ListingProduct[] {
  if (!section) return [];
  return section.items.map((it: SectionItem) => ({
    id: it.slug,
    slug: it.slug,
    title: it.title,
    primary_image: it.image ?? null,
    effective_price: it.effective_price ?? "0",
    base_price: it.base_price,
    on_sale: it.on_sale ?? false,
    is_new: it.is_new,
    currency: "BDT",
    availability: "in_stock" as const,
  }));
}

export function HomeView() {
  const home = useHomepage();
  const newArrivals = useNewArrivals(12);
  const tree = useCategoryTree();

  // SEO title from the payload, falling back to the store name.
  useEffect(() => {
    const t = home.data?.seo?.title;
    if (t) document.title = t;
  }, [home.data?.seo?.title]);

  const slide = home.data?.slider?.[0];
  const banner = home.data?.banners?.home_top?.[0];
  const featuredSection = home.data?.sections?.find((s) => s.type === "featured_products");
  const featured = sectionToProducts(featuredSection);

  // Fresh store: payload settled empty AND no new arrivals AND no categories.
  const freshStore =
    !home.isLoading &&
    !home.isError &&
    featured.length === 0 &&
    !slide &&
    !newArrivals.isLoading &&
    (newArrivals.data?.products.length ?? 0) === 0 &&
    !tree.isLoading &&
    (tree.data?.length ?? 0) === 0;

  if (freshStore) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Welcome to SportShop BD</h1>
        <Link
          href="/search"
          className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Browse our products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-2 px-4 py-6 sm:px-6">
      {home.isError ? (
        <>
          <Hero />
          <div className="flex flex-col items-center gap-3 rounded-lg bg-gray-50 px-6 py-8 text-center">
            <p className="text-sm font-medium text-gray-700">Couldn&apos;t load the homepage.</p>
            <button
              type="button"
              onClick={() => home.refetch()}
              className="inline-flex h-10 items-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Try again
            </button>
          </div>
        </>
      ) : (
        <Hero slide={slide} />
      )}

      {!home.isError && <PromoStrip banner={banner} />}

      {/* Featured — only when a payload section backs it (no fabricated query). */}
      <HomeCarousel title={featuredSection?.title ?? "Featured"} items={featured} />

      <CategoryTiles />

      <HomeCarousel
        title="New Arrivals"
        items={newArrivals.data?.products ?? []}
        isLoading={newArrivals.isLoading}
        isError={newArrivals.isError}
        onRetry={() => newArrivals.refetch()}
      />
    </div>
  );
}
