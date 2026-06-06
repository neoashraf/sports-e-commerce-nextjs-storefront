import { z } from "zod";

/**
 * Zod schemas for the storefront content payload the shell footer consumes
 * (GET /api/v1/content/homepage — docs/api-contracts/13-content.md).
 *
 * Per cms-storefront-shell-fe Ambiguities: `menus.header` is OPTIONAL/absent for
 * the MVP (the header nav is driven by categories/tree until the CMS menu
 * builder ships, FR-CMS-031/060 deferred). `menus.footer`, when present, drives
 * the footer columns; when absent the footer falls back to hard-coded BD policy
 * links. The whole payload is treated as optional so a missing CMS still yields
 * a usable shell.
 */

export const menuItemSchema = z.object({
  label: z.string(),
  /** Internal route or external URL the link points at. */
  url: z.string(),
  /** Optional external flag for `target=_blank` + rel=noopener. */
  external: z.boolean().optional(),
});

export const menuColumnSchema = z.object({
  title: z.string(),
  items: z.array(menuItemSchema),
});

export const menusSchema = z.object({
  /** Header nav is deferred — optional and unused by the shell for the MVP. */
  header: z.array(menuColumnSchema).optional(),
  /** Footer link columns (Shop / Customer Care / About). */
  footer: z.array(menuColumnSchema).optional(),
});

export const homepagePayloadSchema = z.object({
  menus: menusSchema.optional(),
});

export type MenuItem = z.infer<typeof menuItemSchema>;
export type MenuColumn = z.infer<typeof menuColumnSchema>;
export type HomepagePayload = z.infer<typeof homepagePayloadSchema>;
