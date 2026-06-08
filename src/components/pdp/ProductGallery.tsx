"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductImage, ProductDetail } from "@/lib/api/schemas/catalog";

type Media =
  | { kind: "image"; key: string; src: string; alt: string; colorOptionId: string | null }
  | { kind: "video"; key: string; src: string; alt: string };

/**
 * Image/video gallery (product-detail §5, §13.4, AC2). Images first (primary
 * first), videos appended. Each image uses `renditions.detail`, falling back to
 * the original `url` when the rendition isn't ready (blur-up). Selecting a
 * colour scrolls the gallery to the image whose `color_option_id` matches
 * (FR-CAT-032); stays put if none. Thumbnail rail + hover-zoom on desktop.
 */
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
      src: img.renditions.detail || img.url || img.renditions.thumb || "",
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

  const [active, setActive] = useState(0);

  // On colour change, jump to the first image tagged with that colour (§FR-CAT-032).
  useEffect(() => {
    if (!selectedColorId) return;
    const idx = media.findIndex(
      (m) => m.kind === "image" && m.colorOptionId === selectedColorId,
    );
    if (idx >= 0) setActive(idx);
  }, [selectedColorId, media]);

  if (media.length === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 p-6 text-center">
        <svg
          className="h-16 w-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 4.5h15a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18V6a1.5 1.5 0 011.5-1.5z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-400">{product.name}</span>
      </div>
    );
  }

  const current = media[active];

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
      <div className="flex-1">
        <div className="group relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
          {current.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.src}
              alt={current.alt}
              className="h-full w-full object-cover transition-transform duration-200 motion-safe:group-hover:scale-110"
            />
          ) : (
            <video src={current.src} controls className="h-full w-full object-cover" aria-label={current.alt} />
          )}
        </div>
      </div>

      {media.length > 1 && (
        <ul
          className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-y-auto"
          aria-label="Product media thumbnails"
        >
          {media.map((m, idx) => (
            <li key={m.key} className="shrink-0">
              <button
                type="button"
                aria-label={`View media ${idx + 1}`}
                aria-current={idx === active}
                onClick={() => setActive(idx)}
                className={
                  "h-16 w-16 overflow-hidden rounded-md border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 " +
                  (idx === active ? "border-brand-600" : "border-transparent hover:border-gray-300")
                }
              >
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.src} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-gray-200 text-xs text-gray-600">
                    ▶
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
