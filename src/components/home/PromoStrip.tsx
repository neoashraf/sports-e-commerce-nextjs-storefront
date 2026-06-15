import Link from "next/link";
import type { Banner } from "@/lib/api/schemas/content";
import { resolveLink, isExternalLink } from "@/lib/cms/links";
import { resolveMediaUrl } from "@/lib/media";
import { homeAsset } from "./home-assets";

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
        src={resolveMediaUrl(banner.image)}
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
      className="relative flex min-h-[340px] items-center overflow-hidden rounded-lg bg-ink lg:min-h-[420px]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink" aria-hidden="true">
        {/* RW8 static editorial photo layered over the tint (tint shows until the file is dropped in). */}
        {homeAsset("editorial") && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={homeAsset("editorial") as string}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {/* Diagonal fabric texture so the flat fill reads as a lifestyle band. */}
      <span aria-hidden="true" className={"pointer-events-none absolute inset-0 opacity-50 " + FABRIC} />
      {/* Left-weighted scrim keeps the copy AA-contrast. */}
      <span aria-hidden="true" className={"pointer-events-none absolute inset-0 " + EDITORIAL_SCRIM} />
      <div className="relative max-w-[540px] px-7 py-10 sm:px-12">
        <span className="text-label font-bold uppercase tracking-[0.1em] text-volt">The vault</span>
        <h2 className="mt-3 max-w-[460px] break-words text-display-lg font-extrabold tracking-tight text-white">
          Built for the Bangladesh game.
        </h2>
        <p className="mt-3.5 max-w-[420px] text-body leading-normal text-white/80">
          From the gully to the stadium — kit out your whole team with authentic
          gear, delivered nationwide.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex h-control-lg items-center rounded-md bg-volt px-7 text-[15px] font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
        >
          Explore
        </Link>
      </div>
    </section>
  );
}

// Fabric texture + left-weighted ink scrim for the placeholder band (literal
// class strings so Tailwind's JIT emits the arbitrary gradients).
const FABRIC =
  "bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.05)_0_2px,rgba(255,255,255,0)_2px_8px)]";
const EDITORIAL_SCRIM =
  "bg-[linear-gradient(to_right,rgba(15,17,21,0.9)_0%,rgba(15,17,21,0.6)_50%,rgba(15,17,21,0.15)_100%)]";

/** Back-compat alias (the band was formerly named PromoStrip). */
export const PromoStrip = EditorialBand;
