"use client";

import { PASSWORD_RULES } from "@/lib/auth/password";

/**
 * Live password-policy checklist (FR-AUTH-030). Pass/fail uses icon + text (not
 * color alone) per a11y. Lives in an aria-live region tied to the password
 * field via `id` + aria-describedby (email-register §10).
 */
export function PasswordChecklist({ value, id }: { value: string; id?: string }) {
  return (
    <ul id={id} aria-live="polite" className="space-y-1 text-body-sm">
      {PASSWORD_RULES.map((rule) => {
        const pass = rule.test(value);
        return (
          <li
            key={rule.key}
            className={`flex items-center gap-1.5 ${pass ? "text-success" : "text-text-muted"}`}
          >
            <span aria-hidden>{pass ? "✓" : "○"}</span>
            <span>{rule.label}</span>
            <span className="sr-only">{pass ? "(met)" : "(not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
