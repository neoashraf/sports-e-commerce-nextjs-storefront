"use client";

import { useEffect, useRef } from "react";
import type { SizeGuide } from "@/lib/api/schemas/catalog";
import { CloseIcon } from "@/components/shell/icons";

/**
 * Size-guide sheet (product-detail §5, AC5) — presentational modal.
 * role="dialog" aria-modal: a measure note + a UK-size ↔ foot-length table.
 * Opens from the buy-box "Size guide" link and the "Size & fit" accordion;
 * ✕ / Esc closes; focus trapped + returned to the opener.
 *
 * RW6: the chart now comes from the product detail's `size_guide` field (a
 * category-level chart resolved server-side). The trigger + this sheet appear
 * only when `size_guide` is present; a product without one keeps them hidden
 * (no fabricated table). The measure note + unit are data-driven.
 *
 * Design source: docs/design/design-files/ui_kits/pdp-grid/PgBuyBox.jsx (size guide)
 */
export type SizeGuideRow = { uk: string; foot: string };

export function SizeGuideSheet({
  guide,
  onClose,
}: {
  guide: SizeGuide;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>("button")?.focus(),
    );
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") trap(e, panelRef.current);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-ink/55" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Size guide"
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-lg bg-white shadow-pop sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none motion-safe:animate-[slideUp_180ms_ease-out]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-h3 font-bold text-ink">Size guide</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-body-sm text-text-muted">{guide.measure_note}</p>
          <table className="mt-4 w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 font-semibold text-ink">UK size</th>
                <th scope="col" className="py-2 font-semibold text-ink">
                  Foot length{guide.unit ? ` (${guide.unit})` : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((r) => (
                <tr key={r.uk} className="border-b border-border">
                  <td className="py-2 text-ink">{r.uk}</td>
                  <td className="break-words py-2 text-text-muted">{r.foot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function trap(e: KeyboardEvent, panel: HTMLElement | null) {
  if (!panel) return;
  const f = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
  if (f.length === 0) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
