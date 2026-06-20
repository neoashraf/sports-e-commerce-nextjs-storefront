"use client";

import Link from "next/link";
import { useCategoryTree } from "@/lib/api/hooks/categories";
import type { CategoryNode } from "@/lib/api/schemas/categories";

/**
 * Subcategory tab strip (product-listing §5, AC2). A horizontally-scrollable rail
 * of the current category's children — NAVIGATION, not a facet. Rendered as plain
 * text tabs: the active tab carries a volt underline + bold ink + `aria-current`;
 * inactive tabs are muted with a hover. Each links to `/c/<child-slug>`; the
 * leading "All {name}" tab returns to the parent category.
 *
 * The listing route passes only the category slug and the listing response carries
 * no children, so the strip reads the children from the already-wired
 * `useCategoryTree` hook (presentation-only consumption). Leaf category (no
 * children) → strip omitted; search scope → not rendered (the host shows the
 * search-scope header instead).
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
      <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="h-8 w-24 shrink-0 animate-pulse rounded bg-surface-100" />
        ))}
      </ul>
    );
  }

  const node = data ? findNodeBySlug(data, activeSlug) : null;
  const children = node?.children ?? [];
  // Leaf category (no children) → omit the strip.
  if (children.length === 0) return null;

  // The active tab is either the parent ("All") or one of the children.
  const activeIsParent = node!.slug === activeSlug;

  return (
    <nav aria-label="Subcategories">
      <ul className="flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* "All {name}" returns to the parent category itself. */}
        <SubcatTab href={`/c/${node!.slug}`} name={`All ${node!.name}`} active={activeIsParent} />
        {children.map((child) => (
          <SubcatTab
            key={child.id}
            href={`/c/${child.slug}`}
            name={child.name}
            active={child.slug === activeSlug}
          />
        ))}
      </ul>
    </nav>
  );
}

function SubcatTab({ href, name, active }: { href: string; name: string; active: boolean }) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={
          "inline-flex h-10 items-center whitespace-nowrap border-b-2 text-body-sm outline-none transition-colors duration-micro ease-out focus-visible:ring focus-visible:ring-offset-2 " +
          (active
            ? "border-volt font-bold text-ink"
            : "border-transparent font-medium text-text-muted hover:text-ink")
        }
      >
        {name}
      </Link>
    </li>
  );
}
