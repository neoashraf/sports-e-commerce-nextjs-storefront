import { z } from "zod";
import { passwordSchema } from "@/lib/auth/password";

/** Email login/register schemas (fe-form-builder single source of truth). */

export const emailLoginSchema = z.object({
  email: z.string().min(1, "Enter a valid email address.").email("Enter a valid email address."),
  password: z.string().min(1, "Email or password is incorrect."),
});
export type EmailLoginValues = z.infer<typeof emailLoginSchema>;

export const emailRegisterSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().min(1, "Enter a valid email address.").email("Enter a valid email address."),
  password: passwordSchema,
  promo_email_opt_in: z.boolean(),
});
export type EmailRegisterValues = z.infer<typeof emailRegisterSchema>;
