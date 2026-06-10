"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCategoryTree } from "@/lib/api/hooks/categories";
import { MegaMenu } from "./MegaMenu";

/**
 * Desktop primary category nav (storefront-shell §5, AC2). A horizontal bar of
 * top-level categories; hover/focus opens a mega-menu flyout (≤3 levels). All
 * §6 states are handled: loading (skeleton rows), empty (region omitted), error
 * (quiet "Couldn't load menu" + retry — NON-BLOCKING to the page below).
 *
 * Hidden under lg; mobile uses the hamburger drawer instead.
 */
export function Nav() {
  const { data, isLoading, isError, refetch } = useCategoryTree();
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  function open(id: string) {
    clearTimeout(closeTimer.current);
    setOpenId(id);
  }
  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  }

  if (isLoading) {
    return (
      <nav aria-label="Primary" className="hidden border-b border-border bg-white lg:block">
        <ul className="mx-auto flex max-w-7xl gap-6 px-6 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-4 w-20 animate-pulse rounded-sm bg-surface-100" />
          ))}
        </ul>
      </nav>
    );
  }

  if (isError) {
    return (
      <nav aria-label="Primary" className="hidden border-b border-border bg-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3 text-body-sm text-text-muted">
          <span>Couldn&apos;t load menu</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-sm px-2 py-1 font-semibold text-volt-600 hover:bg-surface-100"
          >
            Retry
          </button>
        </div>
      </nav>
    );
  }

  // Empty tree → omit the nav region entirely (no empty bar).
  if (!data || data.length === 0) return null;

  return (
    <nav aria-label="Primary" className="hidden border-b border-border bg-white lg:block">
      <ul className="mx-auto flex max-w-7xl gap-1 px-6">
        {data.map((node) => {
          const hasChildren = node.children.length > 0;
          const isOpen = openId === node.id;
          return (
            <li
              key={node.id}
              className="relative"
              onMouseEnter={() => hasChildren && open(node.id)}
              onMouseLeave={scheduleClose}
            >
              <Link
                href={`/c/${node.slug}`}
                aria-haspopup={hasChildren || undefined}
                aria-expanded={hasChildren ? isOpen : undefined}
                onFocus={() => hasChildren && open(node.id)}
                onClick={() => setOpenId(null)}
                className={
                  "inline-flex max-w-[12rem] items-center truncate rounded-sm text-body-sm font-medium transition-colors duration-micro ease-out " +
                  (isOpen ? "text-volt-600" : "text-ink hover:text-volt-600")
                }
              >
                <span className="px-2 py-3">{node.name}</span>
              </Link>
              {hasChildren && isOpen && (
                <div onMouseEnter={() => open(node.id)} onMouseLeave={scheduleClose}>
                  <MegaMenu node={node} onNavigate={() => setOpenId(null)} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
