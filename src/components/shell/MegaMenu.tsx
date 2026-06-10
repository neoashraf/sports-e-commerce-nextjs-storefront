"use client";

import Link from "next/link";
import type { CategoryNode } from "@/lib/api/schemas/categories";

/**
 * Desktop mega-menu flyout for a single top-level category (storefront-shell
 * §5). Renders that category's children as columns, each listing its
 * grandchildren — capped at 3 levels total (FR-CAT-040); any 4th level is
 * ignored. A leaf links to its PLP at `/c/<slug>`.
 */
export function MegaMenu({
  node,
  onNavigate,
}: {
  node: CategoryNode;
  onNavigate: () => void;
}) {
  if (node.children.length === 0) return null;

  return (
    <div className="absolute left-0 top-full z-40 w-max min-w-[16rem] max-w-3xl rounded-b-lg border border-t-0 border-border bg-white p-5 shadow-pop">
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-3">
        {node.children.map((child) => (
          <div key={child.id} className="min-w-[10rem]">
            <Link
              href={`/c/${child.slug}`}
              onClick={onNavigate}
              className="block break-words text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:text-volt-600"
            >
              {child.name}
            </Link>
            {child.children.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {/* Level 3 (grandchildren) — deeper levels ignored per FR-CAT-040. */}
                {child.children.map((leaf) => (
                  <li key={leaf.id}>
                    <Link
                      href={`/c/${leaf.slug}`}
                      onClick={onNavigate}
                      className="block break-words text-body-sm text-text-muted transition-colors duration-micro ease-out hover:text-volt-600"
                    >
                      {leaf.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
