import { z } from "zod";

/**
 * Password policy (FR-AUTH-030): ≥8 chars, ≥1 letter, ≥1 number. Drives both
 * the live checklist (email-register / reset / claim) and the Zod schema.
 */

export interface PasswordRule {
  key: "length" | "letter" | "number";
  label: string;
  test: (v: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "letter", label: "A letter", test: (v) => /[a-zA-Z]/.test(v) },
  { key: "number", label: "A number", test: (v) => /\d/.test(v) },
];

export function isPasswordValid(v: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(v));
}

/** Reusable Zod password schema with the policy message from the design specs. */
export const passwordSchema = z
  .string()
  .refine(isPasswordValid, {
    message: "Use at least 8 characters, with a letter and a number.",
  });
