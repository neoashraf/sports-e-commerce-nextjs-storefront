"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/shell/icons";

/**
 * Description accordion section (product-detail §5, §8, AC5). Default OPEN. Shows
 * `short_description` always; the long rich `description` is behind "Read more" ↔
 * "Read less". Rich text is rendered as plain wrapped text (no HTML injection —
 * the BE serves sanitized markup, but the storefront avoids dangerouslySetInnerHTML
 * until a vetted sanitizer is wired; flagged).
 */
export function ProductDescription({
  short,
  long,
}: {
  short?: string | null;
  long?: string | null;
}) {
  const [open, setOpen] = useState(true);
  const [more, setMore] = useState(false);
  if (!short && !long) return null;

  return (
    <section className="border-t border-border py-4">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between py-1 text-left text-h3 font-bold text-ink"
        >
          Description
          <ChevronDownIcon className={"h-5 w-5 text-text-muted transition-transform " + (open ? "rotate-180" : "")} />
        </button>
      </h2>
      {open && (
        <div className="mt-2">
          {short && <p className="whitespace-pre-line break-words text-body text-ink">{short}</p>}
          {long && (
            <>
              {more && (
                <p className="mt-2 whitespace-pre-line break-words text-body text-ink">{long}</p>
              )}
              <button
                type="button"
                aria-expanded={more}
                onClick={() => setMore((o) => !o)}
                className="mt-2 text-body-sm font-semibold text-volt-600 hover:underline"
              >
                {more ? "Read less" : "Read more"}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Static "Delivery & returns" accordion section (product-detail §5, AC5). Design
 * policy copy — no backing API field.
 */
export function DeliveryReturns() {
  const [open, setOpen] = useState(false);
  return (
    <section className="border-t border-border py-4">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between py-1 text-left text-h3 font-bold text-ink"
        >
          Delivery &amp; returns
          <ChevronDownIcon className={"h-5 w-5 text-text-muted transition-transform " + (open ? "rotate-180" : "")} />
        </button>
      </h2>
      {open && (
        <div className="mt-2 space-y-2 text-body text-ink">
          <p>Delivery across Bangladesh. Cash on Delivery, bKash and Nagad accepted.</p>
          <p>Free delivery on orders over ৳ 3,000.</p>
          <p>Returns are exchange-only within 30 days of delivery.</p>
        </div>
      )}
    </section>
  );
}

/**
 * Static "Size & fit" accordion section (product-detail §5, AC5). A fit note + an
 * "Open size guide" trigger — rendered only when a size-guide chart is supplied.
 */
export function SizeFit({ onOpenSizeGuide }: { onOpenSizeGuide?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="border-t border-border py-4">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between py-1 text-left text-h3 font-bold text-ink"
        >
          Size &amp; fit
          <ChevronDownIcon className={"h-5 w-5 text-text-muted transition-transform " + (open ? "rotate-180" : "")} />
        </button>
      </h2>
      {open && (
        <div className="mt-2 space-y-2 text-body text-ink">
          <p>True to size. If you&apos;re between sizes, we recommend sizing up.</p>
          {onOpenSizeGuide && (
            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="text-body-sm font-semibold text-volt-600 hover:underline"
            >
              Open size guide
            </button>
          )}
        </div>
      )}
    </section>
  );
}
