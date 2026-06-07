"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { categoryTreeSchema } from "@/lib/api/schemas/categories";

/**
 * GET /categories/tree — the published, in-menu category tree that drives the
 * storefront shell nav (cms-storefront-shell-fe AC2). Public (no token).
 *
 * The query is non-blocking for the shell: the header/footer render
 * immediately and the nav region shows skeleton → data/empty/error off this
 * hook's state.
 */
export const categoryKeys = {
  tree: ["categories", "tree"] as const,
};

export function useCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.tree,
    queryFn: ({ signal }) =>
      api.get("/categories/tree", {
        schema: categoryTreeSchema,
        public: true,
        signal,
      }),
    // The tree changes rarely; keep it warm so nav doesn't reflow on every nav.
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
