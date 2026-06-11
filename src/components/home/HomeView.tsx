"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useHomepage } from "@/lib/api/hooks/content";
import { useNewArrivals } from "@/lib/api/hooks/listings";
import { useCategoryTree } from "@/lib/api/hooks/categories";
import type { HomeSection, SectionItem } from "@/lib/api/schemas/content";
import type { ListingProduct } from "@/lib/api/schemas/search";
import { TrustBar } from "@/components/ui/TrustBar";
import { Hero } from "./Hero";
import { EditorialBand } from "./PromoStrip";
import { HomeCarousel } from "./HomeCarousel";
import { CategoryTiles } from "./CategoryTiles";
import { SportTiles } from "./SportTiles";

/**
 * Home page body (cms-home-fe), reskinned to the final 7-band editorial layout:
 * hero → trust bar → Shop by Sport → Featured → editorial band → New Arrivals →
 * Best Sellers → Shop by Category. Each band fetches independently from its
 * EXISTING hook (no full-page blocker, no new fetch). The whole-payload error
 * degrades to a placeholder hero + "Couldn't load the homepage." band; the
 * carousels/tiles carry their own section error/empty states.
 *
 * Design source: docs/design/screens/13-content/home.md §4 + landing kit.
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
  const editorialBanner = home.data?.banners?.home_mid?.[0] ?? banner;
  const sections = home.data?.sections ?? [];
  const productSections = sections.filter((s) => s.type === "featured_products");
  // Featured = the section titled "Best Sellers" excluded; the first remaining one.
  const bestSellerSection = productSections.find((s) => /best\s*sell/i.test(s.title ?? ""));
  const featuredSection = productSections.find((s) => s !== bestSellerSection);
  const featured = sectionToProducts(featuredSection);
  // Best Sellers: the curated "Best Sellers" section if present, else a 2nd
  // featured_products section — omitted otherwise (same rule as Featured; the
  // section schema has no dedicated best_sellers type, so we key off the title).
  const fallbackBestSeller = productSections.find((s) => s !== featuredSection);
  const bestSellers = sectionToProducts(bestSellerSection ?? fallbackBestSeller);

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
      {/* Band 1 — Hero (full-bleed, edge-to-edge under the header) */}
      {home.isError ? (
        <>
          <Hero />
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mt-2 flex flex-col items-center gap-3 rounded-lg bg-surface-50 px-6 py-8 text-center">
              <p className="text-body font-medium text-ink">Couldn&apos;t load the homepage.</p>
              <button
                type="button"
                onClick={() => home.refetch()}
                className="inline-flex h-11 items-center rounded-md bg-volt px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
              >
                Try again
              </button>
            </div>
          </div>
        </>
      ) : (
        <Hero slide={slide} />
      )}

      {/* Band 2 — Trust bar (full-bleed, flush under the hero, hard-coded USPs) */}
      <TrustBar tone="light" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Band 3 — Shop by Sport */}
        <SportTiles />

        {/* Band 4 — Featured (omitted if no payload section). Hero "Shop now"
            smooth-scrolls here via #featured. */}
        <HomeCarousel
          id="featured"
          eyebrow="Handpicked"
          title={featuredSection?.title ?? "Featured"}
          items={featured}
        />
      </div>

      {/* Band 5 — Editorial lifestyle band (full-bleed) */}
      {!home.isError && (
        <div className="mx-auto max-w-7xl px-4 py-section-y sm:px-6 sm:py-10">
          <EditorialBand banner={editorialBanner} />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Band 6 — New Arrivals */}
        <HomeCarousel
          eyebrow="Just dropped"
          title="New Arrivals"
          items={newArrivals.data?.products ?? []}
          isLoading={newArrivals.isLoading}
          isError={newArrivals.isError}
          onRetry={() => newArrivals.refetch()}
        />

        {/* Band 7 — Best Sellers (omitted if no payload section) */}
        <HomeCarousel
          eyebrow="Fan favourites"
          title={bestSellerSection?.title ?? fallbackBestSeller?.title ?? "Best Sellers"}
          items={bestSellers}
        />

        {/* Band 8 — Shop by Category */}
        <CategoryTiles />
      </div>
    </>
  );
}
