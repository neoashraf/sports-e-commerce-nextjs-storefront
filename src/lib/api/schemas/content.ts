import { z } from "zod";
import { cardFieldsShape } from "./search";

/**
 * Zod schemas for the storefront content payload
 * (GET /api/v1/content/homepage — docs/api-contracts/13-content.md).
 *
 * Consumed by the shell footer (menus.footer) and the home page (slider /
 * banners / sections / seo). Per cms-storefront-shell-fe + cms-home-fe
 * Ambiguities, the slider/banners are placeholder-backed for the MVP and every
 * branch is optional so a missing CMS still yields a usable shell + home.
 */

/** A CMS link target: an internal category/product/page ref or an external URL. */
export const linkRefSchema = z.object({
  link_type: z.enum(["category", "product", "page", "url"]).optional(),
  link_ref: z.string().optional(),
});

export interface MenuNode {
  label: string;
  link_type?: "category" | "product" | "page" | "url";
  link_ref?: string;
  children?: MenuNode[];
}

export const menuNodeSchema: z.ZodType<MenuNode> = z.lazy(() =>
  z.object({
    label: z.string(),
    link_type: z.enum(["category", "product", "page", "url"]).optional(),
    link_ref: z.string().optional(),
    children: z.array(menuNodeSchema).optional(),
  }),
);

export const sliderSlideSchema = z.object({
  id: z.string(),
  image: z.string(),
  alt_text: z.string(),
  headline: z.string().optional(),
  cta_label: z.string().optional(),
  link_type: z.enum(["category", "product", "page", "url"]).optional(),
  link_ref: z.string().optional(),
});
export type SliderSlide = z.infer<typeof sliderSlideSchema>;

export const bannerSchema = z.object({
  id: z.string(),
  image: z.string(),
  alt_text: z.string(),
  link_type: z.enum(["category", "product", "page", "url"]).optional(),
  link_ref: z.string().optional(),
});
export type Banner = z.infer<typeof bannerSchema>;

export const sectionItemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  image: z.string().nullable().optional(),
  effective_price: z.string().optional(),
  base_price: z.string().optional(),
  on_sale: z.boolean().optional(),
  is_new: z.boolean().optional(),
  // RW6 card fields — the featured_products items render the v2 ProductCard.
  ...cardFieldsShape,
});
export type SectionItem = z.infer<typeof sectionItemSchema>;

export const homeSectionSchema = z.object({
  id: z.string(),
  type: z.enum(["featured_products", "featured_categories"]),
  title: z.string(),
  items: z.array(sectionItemSchema).default([]),
});
export type HomeSection = z.infer<typeof homeSectionSchema>;

export const homepagePayloadSchema = z.object({
  slider: z.array(sliderSlideSchema).default([]),
  banners: z
    .object({
      home_top: z.array(bannerSchema).default([]),
      home_mid: z.array(bannerSchema).default([]),
    })
    .partial()
    .optional(),
  sections: z.array(homeSectionSchema).default([]),
  menus: z
    .object({
      header: z.array(menuNodeSchema).optional(),
      footer: z.array(menuNodeSchema).optional(),
    })
    .optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});
export type HomepagePayload = z.infer<typeof homepagePayloadSchema>;

/** A static CMS page (GET /content/pages/{slug} — FR-CMS-061). */
export const staticPageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  /** Stored HTML/markdown body — sanitized before render (XSS-safe). */
  body: z.string().default(""),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  updated_at: z.string().optional(),
});
export type StaticPage = z.infer<typeof staticPageSchema>;
