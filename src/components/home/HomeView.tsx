"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useHomepage } from "@/lib/api/hooks/content";
import {
  useFeaturedProducts,
  useNewProducts,
  useBestSellingProducts,
} from "@/lib/api/hooks/showcase";
import { useCategoryTree } from "@/lib/api/hooks/categories";
import { TrustBar } from "@/components/ui/TrustBar";
import { Hero } from "./Hero";
import { EditorialBand } from "./PromoStrip";
import { HomeCarousel } from "./HomeCarousel";
import { CategoryTiles } from "./CategoryTiles";
import { SportTiles } from "./SportTiles";

/**
 * Home page body (cms-home-fe), final 8-band editorial layout:
 * hero → trust bar → Shop by Sport → Featured → editorial band → New Arrivals →
 * Best Sellers → Shop by Category.
 *
 * The three product rails now read the dedicated PUBLIC showcase endpoints
 * (/featured-products, /new-products, /best-selling-products) — each fetches and
 * degrades INDEPENDENTLY (own skeleton + section error/retry; settled-empty →
 * omitted). The CMS homepage payload is used only for the hero slide, the
 * editorial banner, and the SEO title — all with graceful placeholders — so a
 * CMS outage no longer blanks the page.
 *
 * Design source: docs/design/design-files/ui_kits/landing/ (LpLanding + LpCarousel).
 */
export function HomeView() {
  const home = useHomepage();
  const featured = useFeaturedProducts(12);
  const newProducts = useNewProducts();
  const bestSellers = useBestSellingProducts();
  const tree = useCategoryTree();

  // SEO title from the CMS payload, falling back to the store name.
  useEffect(() => {
    const t = home.data?.seo?.title;
    if (t) document.title = t;
  }, [home.data?.seo?.title]);

  const slide = home.data?.slider?.[0];
  const banner = home.data?.banners?.home_top?.[0];
  const editorialBanner = home.data?.banners?.home_mid?.[0] ?? banner;

  // Fresh store: every rail settled empty AND no categories AND no hero slide.
  const freshStore =
    !featured.isLoading &&
    (featured.data?.length ?? 0) === 0 &&
    !newProducts.isLoading &&
    (newProducts.data?.length ?? 0) === 0 &&
    !bestSellers.isLoading &&
    (bestSellers.data?.length ?? 0) === 0 &&
    !slide &&
    !tree.isLoading &&
    (tree.data?.length ?? 0) === 0;

  if (freshStore) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-h1 font-bold text-ink">Welcome to SportsVault</h1>
        <Link
          href="/search"
          className="inline-flex h-11 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
        >
          Browse our products
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Band 1 — Hero (full-bleed; placeholder when no CMS slide) */}
      <Hero slide={slide} />

      {/* Band 2 — Trust bar (full-bleed, flush under the hero) */}
      <TrustBar tone="light" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Band 3 — Shop by Sport */}
        <SportTiles />

        {/* Band 4 — Featured ("Handpicked"). Hero "Shop now" scrolls here. */}
        <HomeCarousel
          id="featured"
          eyebrow="Handpicked"
          title="Featured"
          items={featured.data ?? []}
          isLoading={featured.isLoading}
          isError={featured.isError}
          onRetry={() => featured.refetch()}
        />
      </div>

      {/* Band 5 — Editorial lifestyle band (full-bleed; placeholder if no banner) */}
      <div className="mx-auto max-w-7xl px-4 py-section-y sm:px-6 sm:py-10">
        <EditorialBand banner={editorialBanner} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Band 6 — New Arrivals ("Just dropped") */}
        <HomeCarousel
          eyebrow="Just dropped"
          title="New Arrivals"
          items={newProducts.data ?? []}
          isLoading={newProducts.isLoading}
          isError={newProducts.isError}
          onRetry={() => newProducts.refetch()}
        />

        {/* Band 7 — Best Sellers ("Fan favourites") */}
        <HomeCarousel
          eyebrow="Fan favourites"
          title="Best Sellers"
          items={bestSellers.data ?? []}
          isLoading={bestSellers.isLoading}
          isError={bestSellers.isError}
          onRetry={() => bestSellers.refetch()}
        />

        {/* Band 8 — Shop by Category */}
        <CategoryTiles />
      </div>
    </>
  );
}
