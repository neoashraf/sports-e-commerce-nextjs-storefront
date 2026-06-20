"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductImage, ProductDetail } from "@/lib/api/schemas/catalog";
import { resolveMediaUrl } from "@/lib/media";
import { Lightbox, type LightboxShot } from "./Lightbox";

type Media =
  | { kind: "image"; key: string; src: string; alt: string; colorOptionId: string | null }
  | { kind: "video"; key: string; src: string; alt: string };

/**
 * Image/video gallery (product-detail §5, §13.4, AC1/AC2). Reskinned to a desktop
 * image grid / mosaic (2 cols, hero tile first) collapsing to ~2 rows + "Show more
 * (+N)", and a mobile horizontal swipe strip with position dots. Tapping any tile
 * opens the full-screen Lightbox at that index.
 *
 * The image-set + `selectedColorId`→`color_option_id` mapping (FR-CAT-032) is
 * UNCHANGED — only the markup is new. Selecting a colour jumps to the first shot
 * of that colour's set (and the mobile strip scrolls to it).
 *
 * Design source: docs/design/design-files/ui_kits/pdp-grid/PgGallery.jsx
 */
const COLLAPSED_COUNT = 4;

export function ProductGallery({
  product,
  selectedColorId,
}: {
  product: ProductDetail;
  selectedColorId: string | null;
}) {
  const media: Media[] = useMemo(() => {
    const imgs = [...product.images].sort(
      (a, b) => Number(b.is_primary ?? false) - Number(a.is_primary ?? false),
    );
    const imageMedia: Media[] = imgs.map((img: ProductImage) => ({
      kind: "image",
      key: img.id,
      src: resolveMediaUrl(img.renditions.detail || img.url || img.renditions.thumb || ""),
      alt: img.alt_text ?? product.name,
      colorOptionId: img.color_option_id ?? null,
    }));
    const videoMedia: Media[] = product.videos.map((v) => ({
      kind: "video",
      key: v.id,
      src: v.url,
      alt: `${product.name} video`,
    }));
    return [...imageMedia, ...videoMedia];
  }, [product]);

  const [active, setActive] = useState(0); // mobile strip position
  const [expanded, setExpanded] = useState(false);
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);
  const swipeRef = useRef<HTMLDivElement>(null);

  // Scroll the mobile strip to a given tile (used by dots + colour switch).
  function scrollToTile(i: number, behavior: ScrollBehavior = "smooth") {
    const el = swipeRef.current;
    const tile = el?.children[i] as HTMLElement | undefined;
    if (el && tile) el.scrollTo({ left: tile.offsetLeft, behavior });
  }

  // Derive the active dot from the strip's scroll position as the user swipes.
  function onSwipeScroll() {
    const el = swipeRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.getBoundingClientRect().width : el.clientWidth;
    const i = Math.round(el.scrollLeft / step);
    setActive(Math.max(0, Math.min(media.length - 1, i)));
  }

  // On colour change, jump to the first image tagged with that colour (FR-CAT-032).
  useEffect(() => {
    if (!selectedColorId) return;
    const idx = media.findIndex(
      (m) => m.kind === "image" && m.colorOptionId === selectedColorId,
    );
    if (idx >= 0) {
      setActive(idx);
      scrollToTile(idx, "auto");
    }
  }, [selectedColorId, media]);

  if (media.length === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg bg-surface-100 p-6 text-center">
        <span className="text-body-sm font-medium text-text-faint">{product.name}</span>
      </div>
    );
  }

  const lightboxShots: LightboxShot[] = media
    .filter((m): m is Extract<Media, { kind: "image" }> => m.kind === "image")
    .map((m) => ({ key: m.key, src: m.src, alt: m.alt }));

  const hiddenCount = media.length - COLLAPSED_COUNT;
  const desktopVisible = expanded ? media : media.slice(0, COLLAPSED_COUNT);

  function openLightbox(mediaIdx: number) {
    // Map the media index to the lightbox (images-only) index.
    const imageIdx = media.slice(0, mediaIdx + 1).filter((m) => m.kind === "image").length - 1;
    if (imageIdx >= 0) setLightboxAt(imageIdx);
  }

  return (
    <>
      {/* Mobile: horizontal swipe strip (scroll-snap) + position dots */}
      <div className="lg:hidden">
        <div
          ref={swipeRef}
          onScroll={onSwipeScroll}
          aria-label="Product images"
          className="grid snap-x snap-mandatory auto-cols-[100%] grid-flow-col overflow-x-auto rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {media.map((m, i) => (
            <button
              key={m.key}
              type="button"
              onClick={() => openLightbox(i)}
              aria-label={`View ${m.alt} full screen`}
              className="group relative block aspect-square w-full snap-center overflow-hidden rounded-lg bg-surface-50 outline-none focus-visible:ring focus-visible:ring-offset-2"
            >
              <MediaTile m={m} priority={i < 2} />
              <span className="pointer-events-none absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-ink" aria-hidden="true">
                ⤢
              </span>
            </button>
          ))}
        </div>
        {media.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {media.map((m, i) => (
              <button
                key={m.key}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => scrollToTile(i)}
                className={"h-2 rounded-full transition-all duration-micro ease-out " + (i === active ? "w-5 bg-ink" : "w-2 bg-border-strong")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: mosaic grid — landscape hero tile, small square thumbs below.
          Capped width so the gallery column doesn't dominate the page. */}
      <div className="hidden max-w-[460px] lg:block">
        <ul className="grid grid-cols-3 gap-2.5">
          {desktopVisible.map((m, i) => (
            <li
              key={m.key}
              className={i === 0 ? "col-span-3" : ""}
            >
              <button
                type="button"
                onClick={() => openLightbox(media.indexOf(m))}
                aria-label={`View ${m.alt} full screen`}
                className={
                  "group relative block w-full overflow-hidden rounded-lg bg-surface-50 outline-none focus-visible:ring focus-visible:ring-offset-2 " +
                  (i === 0 && m.kind === "image" ? "" : "aspect-square")
                }
              >
                {i === 0 && m.kind === "image" ? (
                  // Hero: size to the image (no fixed box) so there are no grey
                  // letterbox bands, and no crop. Height capped so it stays compact.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.src}
                    alt={m.alt}
                    loading="eager"
                    className="block max-h-[560px] w-full object-contain transition-transform duration-slow ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <MediaTile m={m} priority={i < 3} />
                )}
                <span className="pointer-events-none absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/85 text-ink opacity-0 transition-opacity duration-micro ease-out group-hover:opacity-100" aria-hidden="true">
                  ⤢
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!expanded && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 inline-flex h-11 items-center rounded-md border border-border-strong px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
          >
            Show more (+{hiddenCount})
          </button>
        )}
      </div>

      {lightboxAt !== null && (
        <Lightbox
          shots={lightboxShots}
          startIndex={Math.min(lightboxAt, lightboxShots.length - 1)}
          onClose={() => setLightboxAt(null)}
        />
      )}
    </>
  );
}

// Fills its tile (cover). Used for the square thumbnails + mobile swipe tiles;
// the desktop hero renders its own object-contain <img> so it never crops.
function MediaTile({ m, priority }: { m: Media; priority?: boolean }) {
  if (m.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={m.src}
        alt={m.alt}
        loading={priority ? "eager" : "lazy"}
        className="h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    );
  }
  return <video src={m.src} controls className="h-full w-full object-contain" aria-label={m.alt} />;
}
