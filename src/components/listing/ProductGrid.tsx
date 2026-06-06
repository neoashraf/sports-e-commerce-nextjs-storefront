import type { ListingProduct } from "@/lib/api/schemas/search";
import { ProductCard } from "@/components/catalog/ProductCard";

/**
 * Responsive product-card grid (product-listing §4, §10, AC2). 2-up mobile /
 * 3-up tablet / 4-up desktop, as a list/listitem structure. Cards carry the
 * wishlist heart + availability label on the PLP.
 */
export function ProductGrid({ products }: { products: ListingProduct[] }) {
  return (
    <ul
      role="list"
      className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4"
    >
      {products.map((p) => (
        <li key={p.id} role="listitem">
          <ProductCard product={p} withWishlist />
        </li>
      ))}
    </ul>
  );
}
