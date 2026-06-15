"use client";

import Link from "next/link";
import { useId } from "react";
import { useCategoryTree } from "@/lib/api/hooks/categories";
import type { CategoryNode } from "@/lib/api/schemas/categories";
import { resolveMediaUrl } from "@/lib/media";
import { Icon } from "@/components/ui/Icon";
import { homeAsset } from "./home-assets";

/**
 * Shop by Sport (home §5, §13.6, AC4) — reskinned to the landing kit
 * (LpSportTiles): a visible "Pick your game" header and two large editorial
 * tiles (Football / Cricket) selected from the live category tree by slug. Each
 * tile is a portrait card with a sport-tinted placeholder, diagonal fabric
 * texture, bottom scrim, a volt Bangla eyebrow, the sport name, a blurb, and a
 * ghost CTA that fills volt on hover. Single published sport → full-width;
 * neither → band omitted.
 *
 * RW6: the tree node now carries an optional `image_url` (category tile photo).
 * When present it renders as the tile background (behind the fabric texture +
 * scrim); when null the sport-tinted colour placeholder remains (no broken image).
 * The Bangla label + blurb are localized copy for the two KNOWN detected sports
 * (same hard-coded football/cricket match the band already keys on) — not
 * invented per-row data.
 *
 * Design source: docs/design/design-files/ui_kits/landing/LpSportTiles.jsx
 */

type SportConfig = { match: RegExp; label: string; bn: string; blurb: string; tint: string; asset: string };

// Tints + copy for the two sports this band recognises. Full literal class
// strings so Tailwind's JIT emits the arbitrary background colours. `asset` is the
// RW8 static-fallback slot key (home-assets) used only when the category has no image_url.
const SPORTS: SportConfig[] = [
  {
    match: /football|soccer|ফুটবল/i,
    label: "Football",
    bn: "ফুটবল",
    blurb: "Boots, match balls, club jerseys and training kit for every position.",
    tint: "bg-[#1E3A8A]",
    asset: "sport-football",
  },
  {
    match: /cricket|ক্রিকেট/i,
    label: "Cricket",
    bn: "ক্রিকেট",
    blurb: "Bats, gloves, pads, balls and team jerseys — grade-graded, match-ready.",
    tint: "bg-[#0E7C4F]",
    asset: "sport-cricket",
  },
];

const FABRIC =
  "bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.05)_0_2px,rgba(255,255,255,0)_2px_8px)]";
const TILE_SCRIM =
  "bg-[linear-gradient(to_top,rgba(15,17,21,0.84)_0%,rgba(15,17,21,0.25)_50%,rgba(15,17,21,0)_78%)]";

type Tile = { node: CategoryNode; cfg: SportConfig };

export function SportTiles() {
  const headingId = useId();
  const { data, isLoading } = useCategoryTree();

  const sports: Tile[] = (data ?? [])
    .map((node) => {
      const cfg = SPORTS.find((s) => s.match.test(node.slug) || s.match.test(node.name));
      return cfg ? { node, cfg } : null;
    })
    .filter((x): x is Tile => x !== null)
    .slice(0, 2);

  if (isLoading) {
    return (
      <section aria-labelledby={headingId} className="py-section-y sm:py-10">
        <h2 id={headingId} className="sr-only">
          Shop by Sport
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="min-h-[300px] animate-pulse rounded-lg bg-surface-100 lg:min-h-[380px]" />
          ))}
        </div>
      </section>
    );
  }

  // Empty / no recognisable sport → omit the band.
  if (sports.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="py-section-y sm:py-10">
      <div className="mb-6 flex flex-col gap-1.5">
        <span className="text-label font-semibold uppercase tracking-[0.1em] text-volt-600">
          Shop by sport
        </span>
        <h2 id={headingId} className="text-h2 font-bold tracking-snug text-ink">
          Pick your game
        </h2>
      </div>

      <div className={"grid gap-4 " + (sports.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        {sports.map(({ node, cfg }) => {
          const label = node.name || cfg.label;
          // RW6 category image_url wins; RW8 static sport photo is the fallback; else the tint.
          const media = node.image_url ? resolveMediaUrl(node.image_url) : homeAsset(cfg.asset);
          return (
            <Link
              key={node.id}
              href={`/c/${node.slug}`}
              className="group relative flex min-h-[300px] items-end overflow-hidden rounded-lg bg-ink-700 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 lg:min-h-[380px]"
            >
              {/* Tile media: category photo (RW6) → static sport photo (RW8) → sport tint. */}
              <span
                aria-hidden="true"
                className={
                  "absolute inset-0 transition-transform duration-slow ease-out group-hover:scale-[1.03] motion-reduce:transform-none " +
                  cfg.tint
                }
              />
              {media && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                />
              )}
              <span aria-hidden="true" className={"pointer-events-none absolute inset-0 opacity-50 " + FABRIC} />
              <span aria-hidden="true" className={"pointer-events-none absolute inset-0 " + TILE_SCRIM} />

              <div className="relative flex w-full flex-col items-start gap-2 p-6 sm:p-7">
                <span className="font-bangla text-body-sm font-semibold text-volt" lang="bn">
                  {cfg.bn}
                </span>
                <span className="break-words text-display-lg font-extrabold tracking-tight text-white">
                  {label}
                </span>
                <p className="max-w-[320px] text-body-sm text-white/80">{cfg.blurb}</p>
                <span className="mt-2 inline-flex h-11 items-center gap-2 rounded-md border border-white/50 px-5 text-body-sm font-semibold text-white transition-colors duration-micro ease-out group-hover:border-volt group-hover:bg-volt group-hover:text-ink">
                  Shop {label}
                  <Icon name="arrow-right" size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
