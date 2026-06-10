import Link from "next/link";
import type { Banner } from "@/lib/api/schemas/content";
import { resolveLink, isExternalLink } from "@/lib/cms/links";

/**
 * Editorial lifestyle band (home §5, AC6) — supersedes the old promo strip.
 * Full-bleed image-slot + ink scrim + display-lg statement + one CTA. Renders
 * the live `home_mid` banner (passed as `banner`) if present, else a hard-coded
 * placeholder statement. Reuses the banner/link wiring (resolveLink +
 * external-link noopener/https). prefers-reduced-motion: no motion is added.
 *
 * Design source: docs/design/design-files/ui_kits/landing/LpEditorialBand.jsx
 * NOTE: keeps the `PromoStrip` export name as a back-compat alias for any caller.
 */
export function EditorialBand({
  banner,
  placeholder = true,
}: {
  banner?: Banner;
  placeholder?: boolean;
}) {
  if (!banner && !placeholder) return null;

  // Live banner: render its image full-bleed (the banner asset carries its own copy).
  if (banner) {
    const href = resolveLink(banner.link_type, banner.link_ref);
    const external = isExternalLink(banner.link_type, banner.link_ref);
    const inner = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={banner.image}
        alt={banner.alt_text}
        loading="lazy"
        className="h-auto w-full rounded-lg object-cover"
      />
    );
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    ) : (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  // Placeholder editorial statement (real photography + CMS banner swap in later).
  return (
    <section
      aria-label="Built for the Bangladesh game"
      className="relative overflow-hidden rounded-lg bg-ink"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-ink to-ink-700" aria-hidden="true" />
      <div className="relative flex flex-col items-start gap-5 px-6 py-14 sm:px-12 sm:py-20">
        <h2 className="max-w-2xl break-words text-display-lg font-extrabold tracking-tight text-white">
          Built for the Bangladesh game.
        </h2>
        <Link
          href="/search"
          className="inline-flex h-11 items-center rounded-md border border-white/40 px-6 text-body-sm font-semibold text-white transition-colors duration-micro ease-out hover:bg-white/10"
        >
          Explore
        </Link>
      </div>
    </section>
  );
}

/** Back-compat alias (the band was formerly named PromoStrip). */
export const PromoStrip = EditorialBand;
