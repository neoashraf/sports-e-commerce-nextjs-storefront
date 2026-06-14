"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Accessible overlay. Two presentations:
 *  - `side="center"` (default): bottom sheet on mobile, centered modal ≥768px.
 *  - `side="right"`: bottom sheet on mobile, right-anchored full-height drawer
 *    ≥640px (design `.ac2-panel` — width min(440px, 96vw)).
 * role="dialog" aria-modal, focus trap, Esc + scrim-tap to dismiss, focus
 * restored on close, prefers-reduced-motion respected.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  dismissable = true,
  maxWidthClass = "sm:max-w-[420px]",
  side = "center",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** When false (e.g. request in flight) Esc/scrim won't close it. */
  dismissable?: boolean;
  maxWidthClass?: string;
  /** "center" = centered modal on desktop; "right" = right-side drawer on desktop. */
  side?: "center" | "right";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    // Focus the first focusable element in the panel.
    const focusFirst = () => {
      const el = panelRef.current?.querySelector<HTMLElement>(
        'input, button, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      el?.focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") trapFocus(e, panelRef.current);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 motion-safe:transition-opacity"
        onClick={dismissable ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          // Mobile (both variants): bottom sheet.
          "absolute inset-x-0 bottom-0 mx-auto flex max-h-[92vh] w-full flex-col",
          "rounded-t-2xl bg-white shadow-xl",
          side === "right"
            ? [
                // Tablet+: right-anchored full-height drawer (design .ac2-panel).
                "motion-safe:animate-[slideUp_180ms_ease-out]",
                "sm:inset-y-0 sm:bottom-auto sm:left-auto sm:right-0 sm:mx-0",
                "sm:h-full sm:max-h-none sm:w-[min(440px,96vw)] sm:max-w-none",
                "sm:rounded-none sm:shadow-pop sm:motion-safe:animate-[slideInRight_220ms_ease-out]",
              ].join(" ")
            : [
                // Tablet+: centered modal card.
                "motion-safe:animate-[slideUp_180ms_ease-out]",
                "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88vh]",
                "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
                maxWidthClass,
              ].join(" "),
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            {title}
          </h2>
          {dismissable && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Keep Tab focus within the panel. */
function trapFocus(e: KeyboardEvent, panel: HTMLElement | null) {
  if (!panel) return;
  const focusables = panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
