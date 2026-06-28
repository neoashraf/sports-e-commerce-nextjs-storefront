/**
 * Central API surface for the storefront (the `lib/api.ts` the briefs reference).
 *
 * Wraps the typed fetch client in `lib/api/client.ts` with domain namespaces
 * (`auth`, `me`, `addresses`) typed to docs/api-contracts/01-auth-accounts.md.
 * Components MUST call these methods — never raw `fetch`. Response bodies are
 * Zod-validated at the boundary (schemas in `lib/api/schemas/auth.ts`).
 */

import { api as http } from "@/lib/api/client";
import { useDevOtp } from "@/lib/stores/dev-otp";
import {
  addressCreatedSchema,
  addressListSchema,
  addressSchema,
  claimResultSchema,
  emailVerifyResultSchema,
  loginSchema,
  meSchema,
  messageSchema,
  otpRequestSchema,
  otpVerifySchema,
  phoneChangeConfirmSchema,
  phoneChangeRequestSchema,
  refreshSchema,
  registerSchema,
  type AddressDto,
  type CustomerDto,
} from "@/lib/api/schemas/auth";

export type OtpPurpose = "login" | "register" | "password_reset";

export const auth = {
  /** POST /auth/otp/request — issue an OTP challenge for a phone. */
  requestOtp: async (phone: string, purpose: OtpPurpose = "login") => {
    const data = await http.post("/auth/otp/request", { phone, purpose }, {
      public: true,
      schema: otpRequestSchema,
    });
    // DEV-ONLY: surface the echoed code in the top-of-page banner (no SMS gateway in dev).
    if (data.dev_otp) useDevOtp.getState().show(data.dev_otp, phone);
    return data;
  },

  /** POST /auth/otp/verify — verify the code; `full_name` only for new numbers. */
  verifyOtp: (body: { challenge_id: string; code: string; full_name?: string }) =>
    http.post("/auth/otp/verify", body, { public: true, schema: otpVerifySchema }),

  /** POST /auth/google — log in / sign up with a Google ID token (GIS credential); email-keyed. */
  google: (idToken: string) =>
    http.post("/auth/google", { id_token: idToken }, { public: true, schema: otpVerifySchema }),

  /** POST /auth/register — email + password registration. */
  register: (body: {
    full_name: string;
    email: string;
    password: string;
    promo_email_opt_in: boolean;
  }) => http.post("/auth/register", body, { public: true, schema: registerSchema }),

  /** POST /auth/login — email + password login. */
  login: (body: { email: string; password: string }) =>
    http.post("/auth/login", body, { public: true, schema: loginSchema }),

  /** POST /auth/token/refresh — rotate tokens. */
  refresh: (refresh_token: string) =>
    http.post("/auth/token/refresh", { refresh_token }, {
      public: true,
      schema: refreshSchema,
    }),

  /** POST /auth/logout — revoke a refresh token. */
  logout: (refresh_token: string) =>
    http.post<void>("/auth/logout", { refresh_token }, { public: true }),

  /** POST /auth/password/forgot — always generic success (anti-enumeration). */
  forgotPassword: (email: string) =>
    http.post("/auth/password/forgot", { email }, {
      public: true,
      schema: messageSchema,
    }),

  /** POST /auth/password/reset — set a new password from the email token. */
  resetPassword: (token: string, new_password: string) =>
    http.post("/auth/password/reset", { token, new_password }, {
      public: true,
      schema: messageSchema,
    }),

  /** POST /auth/email/verify — confirm an email-verification token. */
  verifyEmail: (token: string) =>
    http.post("/auth/email/verify", { token }, {
      public: true,
      schema: emailVerifyResultSchema,
    }),

  /**
   * Resend the verification email. The contract documents POST /auth/email/verify
   * for confirming a token; a tokenless resend is assumed here (flag for BE).
   */
  resendVerifyEmail: () =>
    http.post("/auth/email/verify/resend", {}, { schema: messageSchema }),

  /** POST /auth/account/claim — activate a lightweight account via OTP. */
  claimAccount: (body: {
    challenge_id: string;
    code: string;
    password?: string;
  }) => http.post("/auth/account/claim", body, {
    public: true,
    schema: claimResultSchema,
  }),
};

export const me = {
  /** GET /me — current customer profile. */
  get: () => http.get("/me", { schema: meSchema }),

  /** PATCH /me — update profile / email / comms preferences. */
  update: (body: Partial<{
    full_name: string;
    gender: CustomerDto["gender"];
    date_of_birth: string | null;
    email: string;
    promo_sms_opt_in: boolean;
    promo_email_opt_in: boolean;
  }>) => http.patch("/me", body, { schema: messageSchema }),

  /** PATCH /me/password — change password. */
  changePassword: (current_password: string, new_password: string) =>
    http.patch("/me/password", { current_password, new_password }, {
      schema: messageSchema,
    }),

  /** POST /me/phone/change/request — OTP to a new number. */
  requestPhoneChange: (new_phone: string) =>
    http.post("/me/phone/change/request", { new_phone }, {
      schema: phoneChangeRequestSchema,
    }),

  /** POST /me/phone/change/confirm — confirm the new number with the code. */
  confirmPhoneChange: (challenge_id: string, code: string) =>
    http.post("/me/phone/change/confirm", { challenge_id, code }, {
      schema: phoneChangeConfirmSchema,
    }),

  /** POST /me/sessions/logout-all — revoke every refresh token. */
  logoutAll: () => http.post<void>("/me/sessions/logout-all"),

  /** DELETE /me — soft-delete + anonymize the account. */
  deleteAccount: () =>
    http.delete("/me", { confirm: true }, { schema: messageSchema }),
};

export const addresses = {
  /** GET /me/addresses — list saved addresses. */
  list: () => http.get("/me/addresses", { schema: addressListSchema }),

  /** POST /me/addresses — create; server resolves the zone and returns { id, is_default }. */
  create: (body: Omit<AddressDto, "id" | "delivery_zone">) =>
    http.post("/me/addresses", body, { schema: addressCreatedSchema }),

  /** PATCH /me/addresses/{id} — update an address. */
  update: (id: string, body: Partial<Omit<AddressDto, "id">>) =>
    http.patch(`/me/addresses/${id}`, body, { schema: addressSchema }),

  /** DELETE /me/addresses/{id} — remove (default is auto-promoted server-side). */
  remove: (id: string) => http.delete<void>(`/me/addresses/${id}`),
};

export const apiClient = { auth, me, addresses };
