import { z } from "zod";

/**
 * Zod schemas for the AUTH endpoints, derived from
 * docs/api-contracts/01-auth-accounts.md. safeParse at the API boundary — the
 * backend's shape is external input (fe-api-integration).
 *
 * Fields the contract doesn't pin down on every response (`is_new_account`,
 * `has_password`, `email_verified`) are modelled optional so a leaner
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
  /** Whether a password is set — drives the "finish your account" card (FR-AUTH-036/074). */
  has_password: z.boolean().optional(),
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
  /** DEV-ONLY: the OTP code, present only when the backend's OTP_DEV_RETURN is on (never in prod). */
  dev_otp: z.string().optional(),
});
export type OtpRequestDto = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = sessionSchema;

/* ---- email + password ---- */

export const registerSchema = z.object({
  customer: customerSchema,
  tokens: tokensSchema,
});

/* ---- MFA (17-mfa) ---- */

export const mfaChannelSchema = z.enum(["sms", "email"]);
export type MfaChannel = z.infer<typeof mfaChannelSchema>;

export const mfaChallengeSchema = z.object({
  id: z.string(),
  channel: mfaChannelSchema,
  sent_to: z.string(),
  expires_in: z.number(),
  resend_after: z.number().optional(),
});
export type MfaChallengeDto = z.infer<typeof mfaChallengeSchema>;

/** POST /auth/login variant when a second factor is required (FR-MFA-010). */
export const mfaLoginRequiredSchema = z.object({
  mfa_required: z.literal(true),
  pre_auth_token: z.string(),
  challenge: mfaChallengeSchema,
  available_channels: z.array(mfaChannelSchema),
});
export type MfaLoginRequiredDto = z.infer<typeof mfaLoginRequiredSchema>;

/** Login returns either a session (tokens) OR a 2FA challenge. */
export const loginSchema = z.union([mfaLoginRequiredSchema, sessionSchema]);
export type LoginResultDto = z.infer<typeof loginSchema>;

/** Resend / channel-switch return a fresh challenge. */
export const mfaChallengeResponseSchema = z.object({ challenge: mfaChallengeSchema });

/** GET /me/mfa — status + effective policy + eligible channels (FR-MFA-035). */
export const myMfaSchema = z.object({
  enabled: z.boolean(),
  preferred_channel: mfaChannelSchema.nullable(),
  policy: z.object({
    enforcement_mode: z.enum(["optional", "mandatory"]),
    available_channels: z.array(mfaChannelSchema),
    /** First-attempt channel for both-eligible, no-preference customers (FR-MFA-036). */
    default_channel: mfaChannelSchema.optional(),
  }),
  eligible_channels: z.array(mfaChannelSchema),
});
export type MyMfaDto = z.infer<typeof myMfaSchema>;

export const mfaEnableSchema = z.object({
  verification: z.object({
    challenge_id: z.string(),
    channel: mfaChannelSchema,
    sent_to: z.string(),
    expires_in: z.number(),
  }),
});
export const mfaConfirmEnableSchema = z.object({
  enabled: z.boolean(),
  preferred_channel: mfaChannelSchema,
  enabled_at: z.string(),
});
export const mfaDisableSchema = z.object({ enabled: z.boolean() });
export const mfaPreferredSchema = z.object({ preferred_channel: mfaChannelSchema });

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

/* ---- email change: verify-before-attach (FR-AUTH-041/044) ---- */

/** POST /me/email/change/request — pending only; nothing on the account changes yet. */
export const emailChangeRequestSchema = z.object({
  request_id: z.string(),
  /** Masked pending address, e.g. `n**@example.com`. */
  sent_to: z.string(),
  expires_in: z.number(),
});
export type EmailChangeRequestDto = z.infer<typeof emailChangeRequestSchema>;

/** POST /me/email/change/confirm — attached already verified. */
export const emailChangeConfirmSchema = z.object({
  email: z.string(),
  email_verified: z.boolean(),
});

/* ---- first-password set (FR-AUTH-036/037) ---- */

/** POST /me/password/set/request — OTP variant or freshness `set_token` variant. */
export const passwordSetRequestSchema = z.object({
  otp_required: z.boolean(),
  /** Present when otp_required = true. */
  challenge_id: z.string().optional(),
  resend_after: z.number().optional(),
  /** Present when otp_required = false (session OTP-verified < 10 min ago). */
  set_token: z.string().optional(),
  expires_in: z.number(),
  /** DEV-ONLY echo when the backend's OTP_DEV_RETURN is on (never in prod). */
  dev_otp: z.string().optional(),
});
export type PasswordSetRequestDto = z.infer<typeof passwordSetRequestSchema>;
