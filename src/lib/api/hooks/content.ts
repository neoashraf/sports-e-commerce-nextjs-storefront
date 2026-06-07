"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  homepagePayloadSchema,
  type HomepagePayload,
} from "@/lib/api/schemas/content";

/**
 * GET /content/homepage — the homepage content payload (slider, banners,
 * sections, menus, seo). One query shared by the shell footer
 * (cms-storefront-shell-fe — menus.footer) and the home page (cms-home-fe —
 * hero/promo/featured/seo). Public + tolerant: callers fall back gracefully
 * (footer → hard-coded links; home → placeholder hero + page-error band).
 */
export const contentKeys = {
  homepage: ["content", "homepage"] as const,
};

export function useHomepage() {
  return useQuery({
    queryKey: contentKeys.homepage,
    queryFn: ({ signal }): Promise<HomepagePayload> =>
      api.get("/content/homepage", {
        schema: homepagePayloadSchema,
        public: true,
        signal,
      }) as Promise<HomepagePayload>,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/** Footer-only view of the homepage payload (menus.footer). */
export function useFooterMenus() {
  return useHomepage();
}
