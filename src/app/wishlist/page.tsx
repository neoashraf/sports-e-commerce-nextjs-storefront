import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/WishlistView";

/**
 * Wishlist page — `/wishlist` (wishlist-fe). Inside the storefront shell.
 * Customer → server list; guest → local store.
 */
export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return <WishlistView />;
}
