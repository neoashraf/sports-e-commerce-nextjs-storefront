import Link from "next/link";
import type { SliderSlide } from "@/lib/api/schemas/content";
import { resolveLink, isExternalLink } from "@/lib/cms/links";

/**
 * Editorial hero (home §5, §13.7, AC2). MVP renders a single static hero: the
 * live `slider[0]` if present, else a hard-coded placeholder (lifestyle image-
 * slot). No auto-advance, no dots. An ink scrim keeps the display headline + volt
 * CTA AA-contrast over the image. The region is named by its headline.
 *
 * Design source: docs/design/design-files/ui_kits/landing/LpHero.jsx
 */
export function Hero({ slide }: { slide?: SliderSlide }) {
  const headline = slide?.headline ?? "Gear up for the game";
  const ctaLabel = slide?.cta_label ?? "Shop now";
  const href = slide ? resolveLink(slide.link_type, slide.link_ref) : "/search";
  const external = slide ? isExternalLink(slide.link_type, slide.link_ref) : false;

  const ctaClass =
    "inline-flex h-[52px] items-center rounded-md bg-volt px-7 text-[15px] font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600";

  return (
    <header
      aria-label={headline}
      className="relative overflow-hidden rounded-lg bg-ink"
    >
      {slide?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image}
          alt={slide.alt_text}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // Lifestyle image-slot placeholder (real photography swaps in later).
        <div
          className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink"
          aria-hidden="true"
        />
      )}
      {/* Ink scrim for AA contrast over imagery. */}
      <div className="absolute inset-0 bg-scrim" aria-hidden="true" />
      <div className="relative flex min-h-[280px] flex-col items-start justify-center gap-5 px-6 py-14 sm:min-h-[420px] sm:px-12">
        <p className="text-label font-semibold uppercase tracking-wide text-volt">
          SportsVault
        </p>
        <h1 className="max-w-2xl break-words text-display-xl font-extrabold tracking-tight text-white">
          {headline}
        </h1>
        {external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={ctaClass}>
            {ctaLabel}
          </a>
        ) : (
          <Link href={href} className={ctaClass}>
            {ctaLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
