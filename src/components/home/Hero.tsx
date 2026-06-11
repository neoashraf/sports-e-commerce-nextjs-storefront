"use client";

import Link from "next/link";
import type { SliderSlide } from "@/lib/api/schemas/content";
import { resolveLink, isExternalLink } from "@/lib/cms/links";
import { resolveMediaUrl } from "@/lib/media";

/**
 * Editorial hero (home §5, §13.7, AC2) — reskinned to the final landing kit
 * (LpHero): a full-bleed lifestyle image + volt radial glow + ink scrim, an
 * eyebrow, a two-tone display headline, a supporting line, and one volt CTA.
 *
 * Two content modes:
 *  - LIVE SLIDE (`slider[0]` present): renders the CMS image + headline + CTA —
 *    the slide owns the copy and link. No fabricated eyebrow/body: the slide
 *    schema carries neither, so we don't stamp a season/subhead over CMS content.
 *  - PLACEHOLDER (no slide — the MVP default): the kit's editorial statement —
 *    "Season 2026" eyebrow, "Gear up. Play bold." (bold. in volt), the
 *    Bangladesh-game line, and a "Shop now" CTA that smooth-scrolls to the
 *    Featured band (falling back to /search when that band is empty/omitted).
 *    Respects prefers-reduced-motion.
 *
 * Full-bleed: rendered OUTSIDE the page gutter (see HomeView); the image spans
 * edge-to-edge while the copy stays inside the max-w-7xl container.
 *
 * Design source: docs/design/design-files/ui_kits/landing/LpHero.jsx
 */

// Gradients live as Tailwind arbitrary values (no inline styles): a faint volt
// glow top-right for brand depth, then an ink scrim bottom→top for AA text.
const VOLT_GLOW =
  "bg-[radial-gradient(120%_90%_at_85%_15%,rgba(200,255,0,0.16)_0%,rgba(200,255,0,0)_45%)]";
const SCRIM =
  "bg-[linear-gradient(to_top,rgba(15,17,21,0.86)_0%,rgba(15,17,21,0.5)_45%,rgba(15,17,21,0.25)_100%)]";

const CTA_CLASS =
  "inline-flex h-control-lg items-center rounded-md bg-volt px-7 text-[15px] font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2";

const HEADLINE_CLASS =
  "max-w-[720px] text-balance text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white";

export function Hero({ slide }: { slide?: SliderSlide }) {
  const headline = slide?.headline ?? "Gear up. Play bold.";
  const slideHref = slide ? resolveLink(slide.link_type, slide.link_ref) : "/search";
  const slideExternal = slide ? isExternalLink(slide.link_type, slide.link_ref) : false;
  const slideCta = slide?.cta_label ?? "Shop now";

  // Placeholder CTA: smooth-scroll to the Featured band, else route to /search.
  function shopNow() {
    const el = document.getElementById("featured");
    if (el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    } else {
      window.location.assign("/search");
    }
  }

  return (
    <section aria-label={headline} className="relative overflow-hidden bg-ink">
      {slide?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveMediaUrl(slide.image)}
          alt={slide.alt_text}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // Lifestyle image-slot placeholder (real photography swaps in later).
        <div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink" aria-hidden="true" />
      )}
      <div className={"absolute inset-0 " + VOLT_GLOW} aria-hidden="true" />
      <div className={"absolute inset-0 " + SCRIM} aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[460px] max-w-7xl flex-col items-start justify-end px-4 pb-10 pt-16 sm:min-h-[520px] sm:px-6 lg:min-h-[600px] lg:justify-center lg:pb-16">
        {!slide && (
          <p className="mb-4 text-label font-bold uppercase tracking-[0.1em] text-volt">
            Season 2026 · Football &amp; Cricket
          </p>
        )}

        {slide ? (
          <h1 className={HEADLINE_CLASS}>{headline}</h1>
        ) : (
          <h1 className={HEADLINE_CLASS}>
            Gear up. Play <span className="text-volt">bold.</span>
          </h1>
        )}

        {!slide && (
          <p className="mt-4 max-w-[460px] text-[clamp(0.9375rem,2.4vw,1.125rem)] leading-normal text-white/80">
            Authentic jerseys, boots and kit built for the Bangladesh game —
            delivered nationwide, cash on delivery.
          </p>
        )}

        <div className="mt-7">
          {slide ? (
            slideExternal ? (
              <a href={slideHref} target="_blank" rel="noopener noreferrer" className={CTA_CLASS}>
                {slideCta}
              </a>
            ) : (
              <Link href={slideHref} className={CTA_CLASS}>
                {slideCta}
              </Link>
            )
          ) : (
            <button type="button" onClick={shopNow} className={CTA_CLASS}>
              Shop now
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
