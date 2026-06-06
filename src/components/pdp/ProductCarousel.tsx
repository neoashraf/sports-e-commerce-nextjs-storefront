import Link from "next/link";
import type { ProductCardLink } from "@/lib/api/schemas/catalog";
import { formatBDT } from "@/lib/format";

/**
 * Horizontal product carousel (product-detail §5, AC1). Renders link cards
 * (related/up-sell → "You may also like"; cross-sell → "Complete the look").
 * Each card → that product's PDP. The section is OMITTED when `items` is empty.
 */
export function ProductCarousel({
  title,
  items,
}: {
  title: string;
  items: ProductCardLink[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-gray-200 py-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      <ul className="flex gap-4 overflow-x-auto pb-2">
        {items.map((p) => (
          <li key={p.id} className="w-40 shrink-0 sm:w-48">
            <Link
              href={`/p/${p.slug}`}
              className="group block focus-visible:outline-none"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                {p.primary_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.primary_image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full" aria-hidden="true" />
                )}
              </div>
              <p className="mt-2 line-clamp-2 break-words text-sm text-gray-800 group-hover:text-brand-600">
                {p.name}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {formatBDT(Number(p.effective_price) || 0)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
