import type { Metadata } from "next";
import { PdpClient } from "@/components/pdp/PdpClient";

/**
 * Product Detail Page route — `/p/<slug>` (catalog-product-detail-fe). Public,
 * no auth gate. The payload is fetched client-side (React Query) by PdpClient so
 * variant resolution and the cart/wishlist client stores share one tree; the
 * §6 loading/error/not-found states live there.
 */
export const metadata: Metadata = {
  title: "Product",
};

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return <PdpClient slug={params.slug} />;
}
