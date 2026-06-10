"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCategoryTree } from "@/lib/api/hooks/categories";
import type { CategoryNode } from "@/lib/api/schemas/categories";
import { ChevronDownIcon, CloseIcon } from "./icons";

/**
 * Mobile full-screen category drawer (storefront-shell §4, §10, AC2). Slides in
 * from the left; renders the tree as an accordion (≤3 levels). Focus is trapped
 * while open, Esc closes, and focus is restored to the trigger on close (the
 * trigger lives in the Header and is re-focused by the caller). A leaf navigates
 * and closes the drawer.
 *
 * Mirrors the same §6 states as the desktop Nav: loading skeleton, empty (no
 * categories → just the account/quick links), error + retry.
 */
export function MobileNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, isError, refetch } = useCategoryTree();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('a[href], button')
        ?.focus();
    });

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") trap(e, panelRef.current);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-ink/55" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-pop motion-safe:animate-[slideUp_180ms_ease-out]"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-base font-bold text-ink">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-3">
          {isLoading && (
            <ul className="space-y-2 px-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className="h-10 animate-pulse rounded-sm bg-surface-100" />
              ))}
            </ul>
          )}

          {isError && (
            <div className="flex items-center gap-3 px-2 py-3 text-body-sm text-text-muted">
              <span>Couldn&apos;t load menu</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-sm px-2 py-1 font-semibold text-volt-600 hover:bg-surface-100"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && data && data.length > 0 && (
            <ul className="space-y-0.5">
              {data.map((node) => (
                <DrawerNode key={node.id} node={node} depth={0} onNavigate={onClose} />
              ))}
            </ul>
          )}
        </nav>
      </div>
    </div>
  );
}

/** A single accordion row; expands children up to 3 levels (FR-CAT-040). */
function DrawerNode({
  node,
  depth,
  onNavigate,
}: {
  node: CategoryNode;
  depth: number;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Cap rendering at 3 levels: a node at depth 2 shows as a leaf even if it has children.
  const hasChildren = depth < 2 && node.children.length > 0;

  return (
    <li>
      <div className="flex items-center" style={{ paddingLeft: depth * 12 }}>
        <Link
          href={`/c/${node.slug}`}
          onClick={onNavigate}
          className="flex min-h-[44px] flex-1 items-center break-words rounded-sm px-3 text-body-sm font-medium text-ink transition-colors duration-micro ease-out hover:bg-surface-100 focus-visible:bg-surface-100"
        >
          {node.name}
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
            className="grid h-11 w-11 place-items-center rounded-full text-text-muted transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            <ChevronDownIcon
              className={"h-4 w-4 transition-transform " + (expanded ? "rotate-180" : "")}
            />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <DrawerNode key={child.id} node={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Keep Tab focus within the drawer panel. */
function trap(e: KeyboardEvent, panel: HTMLElement | null) {
  if (!panel) return;
  const focusables = panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
