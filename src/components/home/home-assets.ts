/**
 * RW8 (rw2-home-assets) — curated static home imagery, wired as **fallbacks** beneath
 * the existing colour-tint placeholders. The API/CMS image (hero `slide.image`, editorial
 * `banner.image`, future category `image_url`) always wins; these statics show only on the
 * else branch, layered ON TOP of the tint so a missing file degrades to the tint (never a
 * broken image).
 *
 * ⚠️ ASSET DROP REQUIRED (flagged): the binary photos are not committed in this change — I
 * can't source licence-clean photography from here. A designer drops curated, royalty-free
 * (or licence-clean generated) football/cricket lifestyle stills at the paths below and flips
 * the matching entry from `null` to its path. **No other code change** is needed — every slot
 * already reads through `homeAsset()` and renders the tint until a path is present.
 *
 * Suggested files (optimized WebP/JPEG): hero ~1600×900, sport tiles ~900×760,
 * editorial ~1600×900, category tiles ~600×760.
 */
const ASSET_BASE = "/images/home";

/**
 * Slot → committed asset path, or `null` until the file is dropped in. To enable a slot once
 * its file exists under `public/images/home/`, set its value to `` `${ASSET_BASE}/<file>` ``.
 */
const HOME_ASSETS: Record<string, string | null> = {
  hero: null, // `${ASSET_BASE}/hero.jpg`
  "sport-football": null, // `${ASSET_BASE}/sport-football.jpg`
  "sport-cricket": null, // `${ASSET_BASE}/sport-cricket.jpg`
  editorial: null, // `${ASSET_BASE}/editorial.jpg`
};

/** Per-category tile fallback by slug (e.g. "cat-jerseys.jpg"), else the neutral default. */
const CATEGORY_ASSETS: Record<string, string | null> = {
  // jerseys: `${ASSET_BASE}/cat-jerseys.jpg`,
  // boots:   `${ASSET_BASE}/cat-boots.jpg`,
  // shoes:   `${ASSET_BASE}/cat-shoes.jpg`,
  // shorts:  `${ASSET_BASE}/cat-shorts.jpg`,
  // accessories: `${ASSET_BASE}/cat-accessories.jpg`,
};
const CATEGORY_DEFAULT: string | null = null; // `${ASSET_BASE}/cat-default.jpg`

/** A fixed-slot home asset path, or null when no file is committed yet (renders the tint). */
export function homeAsset(slot: keyof typeof HOME_ASSETS | string): string | null {
  return HOME_ASSETS[slot] ?? null;
}

/** A category tile's static fallback photo by slug → curated file → neutral default → null. */
export function categoryAsset(slug: string): string | null {
  return CATEGORY_ASSETS[slug] ?? CATEGORY_DEFAULT;
}
