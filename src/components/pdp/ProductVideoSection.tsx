"use client";

import { useState } from "react";
import { resolveMediaUrl } from "@/lib/media";

type ProductVideo = { id: string; source: string; url: string };

/** Turn a YouTube/Vimeo watch URL into an embeddable player URL; null for a direct file. */
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

/**
 * Product video section (product-detail §5) — a dedicated, prominent player below the
 * details, separate from the image gallery. Plays uploaded video files (`<video>`) and
 * YouTube/Vimeo links (iframe). Multiple videos get a thumbnail switcher. Section is
 * OMITTED entirely when the product has no videos, so the page layout never breaks.
 */
export function ProductVideoSection({
  videos,
  productName,
}: {
  videos: ProductVideo[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  if (!videos || videos.length === 0) return null;

  const current = videos[Math.min(active, videos.length - 1)];
  const embed = embedUrl(current.url);
  const fileSrc = resolveMediaUrl(current.url);

  return (
    <section className="border-t border-border py-section-y sm:py-10">
      <h2 className="break-words text-h2 font-bold tracking-snug text-ink">Product video</h2>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-black">
        <div className="relative aspect-video w-full">
          {embed ? (
            <iframe
              key={current.id}
              src={embed}
              title={`${productName} video`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <video
              key={current.id}
              src={fileSrc}
              controls
              playsInline
              preload="metadata"
              aria-label={`${productName} video`}
              className="absolute inset-0 h-full w-full bg-black object-contain"
            />
          )}
        </div>
      </div>

      {videos.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Product videos">
          {videos.map((v, i) => {
            const on = i === Math.min(active, videos.length - 1);
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(i)}
                className={`h-9 rounded-full border px-4 text-body-sm font-medium transition-colors duration-micro ease-out ${
                  on
                    ? "border-volt-600 text-volt-600"
                    : "border-border-strong text-ink hover:border-volt-600 hover:text-volt-600"
                }`}
              >
                Video {i + 1}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
