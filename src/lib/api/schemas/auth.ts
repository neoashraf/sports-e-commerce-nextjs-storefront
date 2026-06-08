import { z } from "zod";

/**
 * Zod schemas for the AUTH endpoints, derived from
 * docs/api-contracts/01-auth-accounts.md. safeParse at the API boundary — the
 * backend's shape is external input (fe-api-integration).
 *
 * Fields the contract doesn't pin down on every response (`is_new_account`,
 * `is_lightweight`, `email_verified`) are modelled optional so a leaner
 * payload still validates; flag for the backend dev where it matters.
 */

/* ---- shared ---- */

export const tokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().optional(),
});
export type TokensDto = z.infer<typeof tokensSchema>;

export const customerSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  phone_verified: z.boolean().optional(),
  email: z.string().nullable().optional(),
  email_verified: z.boolean().optional(),
  gender: z.enum(["male", "female", "other", "undisclosed"]).nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  promo_sms_opt_in: z.boolean().optional(),
  promo_email_opt_in: z.boolean().optional(),
  is_lightweight: z.boolean().optional(),
});
export type CustomerDto = z.infer<typeof customerSchema>;

const sessionSchema = z.object({
  is_new_account: z.boolean().optional(),
  customer: customerSchema,
  tokens: tokensSchema,
});
export type SessionDto = z.infer<typeof sessionSchema>;

/* ---- OTP ---- */

export const otpRequestSchema = z.object({
  challenge_id: z.string(),
  expires_in: z.number(),
  resend_after: z.number().optional(),
});
export type OtpRequestDto = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = sessionSchema;

/* ---- email + password ---- */

export const registerSchema = z.object({
  customer: customerSchema,
  tokens: tokensSchema,
});

export const loginSchema = z.object({
  customer: customerSchema,
  tokens: tokensSchema,
});

/* ---- sessions ---- */

export const refreshSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().optional(),
});

/* ---- profile ---- */

export const meSchema = customerSchema;

export const messageSchema = z.object({
  message: z.string().optional(),
  email_verified: z.boolean().optional(),
});

export const emailVerifyResultSchema = z.object({
  email_verified: z.boolean(),
});

/* ---- phone change ---- */

export const phoneChangeRequestSchema = z.object({
  challenge_id: z.string(),
  expires_in: z.number(),
});

export const phoneChangeConfirmSchema = z.object({
  phone: z.string(),
  phone_verified: z.boolean(),
});

/* ---- addresses ---- */

export const DELIVERY_ZONES = [
  "inside_dhaka",
  "near_dhaka",
  "outside_dhaka",
] as const;

export const addressSchema = z.object({
  id: z.string(),
  recipient_name: z.string(),
  recipient_phone: z.string(),
  address_line: z.string(),
  area: z.string(),
  district: z.string(),
  division: z.string(),
  postal_code: z.string().nullable().optional(),
  delivery_zone: z.enum(DELIVERY_ZONES).optional(),
  is_default: z.boolean(),
});
export type AddressDto = z.infer<typeof addressSchema>;

export const addressListSchema = z.array(addressSchema);

/**
 * POST /me/addresses returns only the new id + resolved default flag, not the
 * full address (contract 01-auth-accounts §Address Book). Validating the create
 * response against the full `addressSchema` would wrongly fail — the server is
 * contract-correct; the form just needs to know the save succeeded.
 */
export const addressCreatedSchema = z.object({
  id: z.string(),
  is_default: z.boolean().optional(),
});

/* ---- claim ---- */

export const claimResultSchema = z.object({
  customer: customerSchema,
  tokens: tokensSchema,
});
