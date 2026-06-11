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
    <>
      <nav
        aria-label="Primary"
        // relative z-40 keeps the bar + its triggers ABOVE the z-30 scrim: without
        // it, opening the menu drops the scrim over the hovered trigger, fires
        // mouseleave on <nav>, and the open/close loop flickers the panel.
        className="relative z-40 hidden border-b border-border bg-white lg:block"
        onMouseLeave={scheduleClose}
      >
        <ul className="mx-auto flex max-w-7xl gap-0.5 px-8">
          {data.map((node) => {
            const hasChildren = node.children.length > 0;
            const isOpen = openId === node.id;
            return (
              <li
                key={node.id}
                className="relative"
                onMouseEnter={() => hasChildren && open(node.id)}
              >
                <Link
                  href={`/c/${node.slug}`}
                  aria-haspopup={hasChildren || undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  onFocus={() => hasChildren && open(node.id)}
                  onClick={() => setOpenId(null)}
                  className={
                    "inline-flex h-12 max-w-[12rem] items-center truncate border-b-2 px-3.5 text-body-sm font-bold transition-colors duration-micro ease-out " +
                    (isOpen
                      ? "border-volt text-ink"
                      : "border-transparent text-ink hover:border-volt")
                  }
                >
                  <span className="truncate">{node.name}</span>
                </Link>
                {hasChildren && isOpen && (
                  <div onMouseEnter={() => open(node.id)}>
                    <MegaMenu node={node} onNavigate={() => setOpenId(null)} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Scrim dims the page behind an open mega-menu (kit `.sh-mega-scrim`). */}
      {openId && (
        <div
          aria-hidden="true"
          onClick={() => setOpenId(null)}
          className="fixed inset-0 z-30 hidden bg-ink/25 lg:block"
        />
      )}
    </>
  );
}
