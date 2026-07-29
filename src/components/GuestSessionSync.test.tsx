import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

/**
 * Guest → account handover (FR-CART-007, FR-WISH-031): the backend resolves an authenticated
 * cart by customer_id only, so the guest cart must be merged on login from EVERY entry point —
 * not just checkout's place-order path, which is where the merge used to live.
 */

const post = vi.fn().mockResolvedValue({});
vi.mock("@/lib/api/client", () => ({ api: { post: (...args: unknown[]) => post(...args) } }));

import { useAuthStore } from "@/lib/stores/auth";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { GuestSessionSync } from "./GuestSessionSync";

const tokens = { accessToken: "a", refreshToken: "r" };
const customer = { id: "c1", full_name: "Sabbir", phone: "+8801712345678", email: null };

function renderSync() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <GuestSessionSync />
    </QueryClientProvider>,
  );
}

describe("CART/WISH — guest → account sync on login", () => {
  beforeEach(() => {
    post.mockClear();
    useAuthStore.getState().clear();
    useCartStore.getState().setCartToken(null);
    useWishlistStore.getState().clearGuest();
  });

  it("should merge the guest cart and drop the token when a signed-in shopper has one", async () => {
    useAuthStore.getState().setSession(customer, tokens);
    useCartStore.getState().setCartToken("guesttok_abc");

    renderSync();

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/cart/merge",
        { cart_token: "guesttok_abc" },
        expect.anything(),
      ),
    );
    await waitFor(() => expect(useCartStore.getState().cartToken).toBeNull());
  });

  it("should not merge anything for a guest (no session)", async () => {
    useCartStore.getState().setCartToken("guesttok_abc");
    renderSync();
    await waitFor(() => expect(post).not.toHaveBeenCalled());
    expect(useCartStore.getState().cartToken).toBe("guesttok_abc");
  });

  it("should merge the guest wishlist without the local-only snapshot field", async () => {
    useAuthStore.getState().setSession(customer, tokens);
    useWishlistStore.getState().addGuest({
      product_id: "p1",
      preferred_variant_id: "v1",
      snapshot: { slug: "boot", title: "Boot" },
    });

    renderSync();

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/me/wishlist/merge",
        { items: [{ product_id: "p1", preferred_variant_id: "v1" }] },
        expect.anything(),
      ),
    );
    await waitFor(() => expect(useWishlistStore.getState().guestItems).toHaveLength(0));
  });

  it("should keep the guest token when the merge fails so a later attempt can retry", async () => {
    post.mockRejectedValueOnce(new Error("network"));
    useAuthStore.getState().setSession(customer, tokens);
    useCartStore.getState().setCartToken("guesttok_abc");

    renderSync();

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(useCartStore.getState().cartToken).toBe("guesttok_abc");
  });
});
