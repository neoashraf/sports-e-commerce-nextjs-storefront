import Link from "next/link";
import type { Banner } from "@/lib/api/schemas/content";
import { resolveLink, isExternalLink } from "@/lib/cms/links";

/**
 * Promo strip (home §5, AC1). Renders the live `banners.home_top[0]` if present,
 * else a hard-coded placeholder band. Omitted entirely only when explicitly
 * told there's nothing (caller passes `placeholder={false}` + no banner).
 * External targets open with noopener.
 */
export function PromoStrip({
  banner,
  placeholder = true,
}: {
  banner?: Banner;
  placeholder?: boolean;
}) {
  if (!banner && !placeholder) return null;

  if (!banner) {
    return (
      <Link
        href="/search"
        className="block rounded-lg bg-brand-50 px-6 py-4 text-center text-sm font-medium text-brand-700 hover:bg-brand-100"
      >
        Free delivery on orders over ৳ 5,000 — shop now
      </Link>
    );
  }

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
