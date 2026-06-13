import { z } from "zod";

/**
 * Zod schemas for the lead/enquiry payloads (POST /leads, /me/leads* —
 * docs/api-contracts/08-leads-contact.md).
 */

// RW6: full SRS enquiry-type set. NOTE the BE uses `product`, not `product_question`
// — kept as-is per the brief (renaming would break stored data + the form wiring);
// the drift is flagged to LEAD in the contract for a follow-up reconciliation.
export const leadTypeSchema = z.enum([
  "general",
  "product_question",
  "order_issue",
  "claim_return",
  "bulk_order",
  "feedback",
]);
export type LeadType = z.infer<typeof leadTypeSchema>;

export const submitLeadResultSchema = z.object({
  reference: z.string(),
  status: z.string(),
  acknowledgement_sent: z.boolean().default(false),
});

export const attachmentResultSchema = z.object({
  attachment_id: z.string(),
});

export const enquiryListItemSchema = z.object({
  reference: z.string(),
  type: leadTypeSchema.or(z.string()),
  subject: z.string(),
  status: z.string(),
  created_at: z.string(),
});
export type EnquiryListItem = z.infer<typeof enquiryListItemSchema>;

export const enquiryListSchema = z.array(enquiryListItemSchema);

export const enquiryMessageSchema = z.object({
  direction: z.enum(["inbound", "outbound"]),
  body: z.string(),
  created_at: z.string(),
});

export const enquiryThreadSchema = z.object({
  reference: z.string(),
  type: leadTypeSchema.or(z.string()),
  subject: z.string().optional(),
  status: z.string(),
  order_reference: z.string().nullable().optional(),
  messages: z.array(enquiryMessageSchema).default([]),
});
export type EnquiryThread = z.infer<typeof enquiryThreadSchema>;
