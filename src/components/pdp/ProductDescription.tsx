"use client";

import { useState } from "react";

/**
 * Description block (product-detail §5, §8, AC7). Shows `short_description`
 * always; the long rich `description` is collapsible ("Read more" ↔ "Read
 * less"). Rich text is rendered as plain wrapped text here (no HTML injection)
 * — the BE serves sanitized markup, but the storefront avoids
 * dangerouslySetInnerHTML until a vetted sanitizer is wired (flagged in PR).
 */
export function ProductDescription({
  short,
  long,
}: {
  short?: string | null;
  long?: string | null;
}) {
  const [open, setOpen] = useState(false);
  if (!short && !long) return null;

  return (
    <section className="border-t border-gray-200 py-4">
      <h2 className="text-base font-semibold text-gray-900">Description</h2>
      {short && <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-700">{short}</p>}
      {long && (
        <>
          {open && (
            <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-700">{long}</p>
          )}
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="mt-2 text-sm font-medium text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            {open ? "Read less" : "Read more"}
          </button>
        </>
      )}
    </section>
  );
}
