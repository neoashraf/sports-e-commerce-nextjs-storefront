"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { homepagePayloadSchema } from "@/lib/api/schemas/content";

/**
 * GET /content/homepage — the homepage content payload. The shell consumes only
 * its `menus.footer` for the footer columns (cms-storefront-shell-fe AC6); the
 * home page body is owned by cms-home-fe.
 *
 * Non-blocking + tolerant: if the CMS isn't serving a payload yet the footer
 * falls back to hard-coded BD policy links, so a failure here is swallowed (the
 * footer just renders its fallback).
 */
export const contentKeys = {
  homepage: ["content", "homepage"] as const,
};

export function useFooterMenus() {
  return useQuery({
    queryKey: contentKeys.homepage,
    queryFn: ({ signal }) =>
      api.get("/content/homepage", {
        schema: homepagePayloadSchema,
        public: true,
        signal,
      }),
    staleTime: 5 * 60_000,
    // Footer has a hard-coded fallback — don't hammer a CMS that may not exist.
    retry: false,
  });
}
