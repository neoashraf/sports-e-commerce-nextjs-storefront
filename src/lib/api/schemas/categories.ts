import { z } from "zod";

/**
 * Zod schemas for the published category tree consumed by the storefront shell
 * nav (GET /api/v1/categories/tree — docs/api-contracts/02-catalog.md).
 *
 * The backend returns only `is_published && show_in_menu` nodes, nested to at
 * most 3 levels (FR-CAT-040). Any unexpected 4th level is tolerated by the type
 * but ignored by the renderer.
 */

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  /** Tile/thumbnail image for storefront category tiles (RW6); null/absent → colour-tint placeholder. */
  image_url?: string | null;
  children: CategoryNode[];
}

// Recursive schema — `children` references the node schema itself. The contract
// always sends `children` (empty array for leaves), so it's a required array.
// `image_url` is optional/nullable so a pre-RW6 tree still parses (backward-compatible).
export const categoryNodeSchema: z.ZodType<CategoryNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    image_url: z.string().nullable().optional(),
    children: z.array(categoryNodeSchema),
  }),
);

export const categoryTreeSchema = z.array(categoryNodeSchema);

export type CategoryTree = z.infer<typeof categoryTreeSchema>;
