import Link from "next/link";
import type { SliderSlide } from "@/lib/api/schemas/content";
import { resolveLink, isExternalLink } from "@/lib/cms/links";

/**
 * Hero banner (home §5, §13.7, AC2). MVP renders a single static hero: the live
 * `slider[0]` if present, else a hard-coded placeholder. No auto-advance, no
 * dots. A scrim keeps headline/CTA AA-contrast over the image. The region is
 * named by its headline.
 */
export function Hero({ slide }: { slide?: SliderSlide }) {
  const headline = slide?.headline ?? "Gear up for the game";
  const ctaLabel = slide?.cta_label ?? "Shop now";
  const href = slide ? resolveLink(slide.link_type, slide.link_ref) : "/search";
  const external = slide ? isExternalLink(slide.link_type, slide.link_ref) : false;

  return (
    <header
      aria-label={headline}
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900"
    >
      {slide?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image}
          alt={slide.alt_text}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Scrim for AA contrast over imagery. */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative flex min-h-[220px] flex-col items-start justify-center gap-4 px-6 py-12 sm:min-h-[320px] sm:px-10">
        <h1 className="max-w-xl break-words text-2xl font-bold text-white sm:text-4xl">
          {headline}
        </h1>
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-lg bg-white px-6 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            {ctaLabel}
          </a>
        ) : (
          <Link
            href={href}
            className="inline-flex h-11 items-center rounded-lg bg-white px-6 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
