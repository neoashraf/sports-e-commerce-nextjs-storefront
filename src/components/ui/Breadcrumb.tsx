"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCategoryTree } from "@/lib/api/hooks/categories";
import type { CategoryNode } from "@/lib/api/schemas/categories";

/**
 * Shared, clickable breadcrumb for the storefront (PLP + PDP).
 *
 * The listing/product-detail payloads carry crumbs as NAMES only (no per-crumb
 * slug — docs/api-contracts/02-catalog.md & 03-search-browse.md). To make crumbs
 * navigable without a backend change, this component resolves each crumb's slug
 * from the already-loaded category tree (`useCategoryTree`):
 *
 *   - When a `currentSlug` is given (PLP, which knows the active category), we
 *     find that node and walk its ancestor path — the most reliable source of
 *     slugs, since it follows real parent links rather than matching by name.
 *   - Otherwise (PDP, which has no category slug) each crumb name is matched to
 *     a tree node by name to recover its slug.
 *
 * A crumb whose slug can't be resolved (hidden/unpublished category, name
 * collision, or tree still loading) renders as plain text — it never produces a
 * broken link. The last crumb is the current page: always plain text +
 * `aria-current="page"`. A clickable "Home" crumb is always prepended.
 */

interface CrumbLink {
  label: string;
  href: string | null;
}

/** Walk a node's ancestor path (root → … → node) using parent links in the tree. */
function ancestorPath(nodes: CategoryNode[], slug: string): CategoryNode[] | null {
  for (const node of nodes) {
    if (node.slug === slug) return [node];
    const childPath = ancestorPath(node.children, slug);
    if (childPath) return [node, ...childPath];
  }
  return null;
}

/** First node anywhere in the tree whose name matches (case-insensitive). */
function findByName(nodes: CategoryNode[], name: string): CategoryNode | null {
  const target = name.trim().toLowerCase();
  for (const node of nodes) {
    if (node.name.trim().toLowerCase() === target) return node;
    const hit = findByName(node.children, name);
    if (hit) return hit;
  }
  return null;
}

export function Breadcrumb({
  crumbs,
  currentSlug,
  className,
}: {
  /** Crumb names from the payload, ordered root → leaf (leaf = current page). */
  crumbs: string[];
  /** The active category slug (PLP only) — enables exact ancestor-path resolution. */
  currentSlug?: string;
  className?: string;
}) {
  const { data: tree } = useCategoryTree();

  const items = useMemo<CrumbLink[]>(() => {
    if (crumbs.length === 0) return [];
    const t = tree ?? [];

    // Prefer the ancestor path of the current category — slugs come straight
    // from the tree's parent links, so no name-matching is needed.
    const path = currentSlug ? ancestorPath(t, currentSlug) : null;

    return crumbs.map((label, i) => {
      const isLast = i === crumbs.length - 1;
      // The last crumb is the current page — never a link.
      if (isLast) return { label, href: null };

      const node = path?.[i] ?? findByName(t, label);
      return { label, href: node ? `/c/${node.slug}` : null };
    });
  }, [crumbs, currentSlug, tree]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-body-sm text-text-muted">
        {/* Always-clickable Home crumb. */}
        <li className="flex items-center gap-1">
          <Link
            href="/"
            className="break-words rounded-sm text-text-muted transition-colors duration-micro ease-out hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt-600"
          >
            Home
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              <span aria-hidden="true">›</span>
              {item.href ? (
                <Link
                  href={item.href}
                  className="break-words rounded-sm text-text-muted transition-colors duration-micro ease-out hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt-600"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="break-words" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
