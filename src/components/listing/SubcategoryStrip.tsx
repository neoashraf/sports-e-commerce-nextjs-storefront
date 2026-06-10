"use client";

import Link from "next/link";
import { useCategoryTree } from "@/lib/api/hooks/categories";
import type { CategoryNode } from "@/lib/api/schemas/categories";

/**
 * Subcategory tab strip (product-listing §5, AC2). A horizontally-scrollable rail
 * of the current category's children — NAVIGATION, not a facet. The active tile
 * carries a volt underline + `aria-current`; each links to `/c/<child-slug>`.
 *
 * DATA GAP (flagged): the listing route passes only the category slug and the
 * listing response carries no children, so the strip reads the children from the
 * already-wired `useCategoryTree` hook (presentation-only consumption). Leaf
 * category (no children) → strip omitted; search scope → not rendered (the host
 * shows the search-scope header instead).
 *
 * Design source: docs/design/design-files/ui_kits/plp-srch/SrchChrome.jsx (SubcategoryStrip)
 */

function findNodeBySlug(nodes: CategoryNode[], slug: string): CategoryNode | null {
  for (const n of nodes) {
    if (n.slug === slug) return n;
    const hit = findNodeBySlug(n.children, slug);
    if (hit) return hit;
  }
  return null;
}

export function SubcategoryStrip({ activeSlug }: { activeSlug: string }) {
  const { data, isLoading } = useCategoryTree();

  if (isLoading) {
    return (
      <ul className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-surface-100" />
        ))}
      </ul>
    );
  }

  const node = data ? findNodeBySlug(data, activeSlug) : null;
  const children = node?.children ?? [];
  // Leaf category (no children) → omit the strip.
  if (children.length === 0) return null;

  return (
    <nav aria-label="Subcategories" className="mb-4">
      <ul className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* "All" returns to the parent category itself. */}
        <li className="shrink-0">
          <Link
            href={`/c/${node!.slug}`}
            aria-current="page"
            className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-ink bg-ink px-4 text-body-sm font-semibold text-white"
          >
            All {node!.name}
          </Link>
        </li>
        {children.map((child) => (
          <li key={child.id} className="shrink-0">
            <Link
              href={`/c/${child.slug}`}
              className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-border-strong px-4 text-body-sm font-medium text-ink transition-colors duration-micro ease-out hover:border-volt-600 hover:text-volt-600"
            >
              {child.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
