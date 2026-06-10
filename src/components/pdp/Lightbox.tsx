"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, ChevronDownIcon } from "@/components/shell/icons";

/**
 * Full-screen image lightbox (product-detail §5/§6/§10, AC2) — new presentational.
 * role="dialog" aria-modal: centred image on a near-white backdrop, prev/next side
 * arrows, top-right close ✕, "{i} / N" counter (aria-live), bottom thumbnail strip
 * (active highlighted, click-to-jump), click-to-zoom toggle, ←/→ navigate, Esc
 * close, focus trapped + returned to the opener. prefers-reduced-motion respected
 * (the global reduced-motion guard kills transitions).
 *
 * Design source: docs/design/design-files/ui_kits/pdp-grid/PgLightbox.jsx
 */
export type LightboxShot = { key: string; src: string; alt: string };

export function Lightbox({
  shots,
  startIndex,
  onClose,
}: {
  shots: LightboxShot[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const count = shots.length;
  const go = (dir: 1 | -1) => {
    setZoom(false);
    setIndex((i) => (i + dir + count) % count);
  };

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>("button")?.focus(),
    );
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab") trap(e, panelRef.current);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, count]);

  const current = shots[index];
  const arrow =
    "absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card transition-colors duration-micro ease-out hover:bg-white";

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
      className="fixed inset-0 z-[60] flex flex-col bg-white/98 motion-safe:animate-[slideUp_180ms_ease-out]"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span aria-live="polite" className="text-body-sm font-semibold tabular-nums text-ink">
          {index + 1} / {count}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image viewer"
          className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
        {count > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="Previous image" className={arrow + " left-4"}>
            <ChevronDownIcon className="h-5 w-5 rotate-90" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.alt}
          onClick={() => setZoom((z) => !z)}
          className={
            "max-h-full max-w-full cursor-zoom-in select-none object-contain transition-transform duration-ui ease-out " +
            (zoom ? "scale-150 cursor-zoom-out" : "")
          }
        />
        {count > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="Next image" className={arrow + " right-4"}>
            <ChevronDownIcon className="h-5 w-5 -rotate-90" />
          </button>
        )}
      </div>

      {count > 1 && (
        <ul className="flex justify-center gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shots.map((s, i) => (
            <li key={s.key} className="shrink-0">
              <button
                type="button"
                aria-label={`View image ${i + 1}`}
                aria-current={i === index}
                onClick={() => { setZoom(false); setIndex(i); }}
                className={
                  "h-16 w-16 overflow-hidden rounded-sm border-2 transition-colors duration-micro ease-out " +
                  (i === index ? "border-ink" : "border-transparent hover:border-border-strong")
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
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
