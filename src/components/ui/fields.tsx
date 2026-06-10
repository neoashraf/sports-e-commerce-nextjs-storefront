"use client";

import { forwardRef, useId, useState } from "react";

/**
 * Accessible field primitives shared across the auth forms (fe-form-builder):
 * label + input + aria-invalid/aria-describedby + role="alert" error. Inputs
 * keep ≥44px touch height.
 *
 * Reskinned to the final design system (RW0): 44px field, radius-sm, strong border,
 * volt focus ring, optional leading icon, inline error (semantic red) / muted helper.
 * Design source: docs/design/design-files/components/forms/Input.{jsx,prompt.md}
 */

// Shared input class. Border rests at border-strong; focus → volt-600 border + a
// 2px volt focus shadow (rgba(166,212,0,.35), matches the kit). Error → semantic red.
const inputClass =
  "h-11 w-full rounded-sm border border-border-strong bg-white px-3 text-body text-ink " +
  "placeholder:text-text-faint transition-[border-color,box-shadow] duration-micro ease-out " +
  "focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)] " +
  "disabled:bg-surface-100 disabled:text-text-faint " +
  "aria-[invalid=true]:border-error aria-[invalid=true]:focus:shadow-none";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helper?: string;
  /** Visual prefix inside the field (e.g. +880). */
  prefix?: string;
  /** Optional leading icon (rendered muted, inside the field). */
  icon?: React.ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, helper, prefix, icon, id, ...props }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const errId = `${fieldId}-error`;
    const helpId = `${fieldId}-help`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-label font-medium text-ink">
          {label}
        </label>
        <div className={prefix ? "flex items-stretch" : icon ? "relative" : undefined}>
          {prefix && (
            <span className="inline-flex select-none items-center rounded-l-sm border border-r-0 border-border-strong bg-surface-50 px-3 text-body-sm text-text-muted">
              {prefix}
            </span>
          )}
          {icon && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={!!error}
            aria-describedby={error ? errId : helper ? helpId : undefined}
            className={`${inputClass} ${prefix ? "rounded-l-none" : ""} ${icon ? "pl-9" : ""}`}
            {...props}
          />
        </div>
        {error ? (
          <p id={errId} role="alert" className="flex items-center gap-1 text-body-sm text-error">
            <ErrorIcon /> {error}
          </p>
        ) : helper ? (
          <p id={helpId} className="text-body-sm text-text-muted">
            {helper}
          </p>
        ) : null}
      </div>
    );
  },
);

type PasswordFieldProps = Omit<TextFieldProps, "type" | "prefix" | "icon"> & {
  /** Optional describedby for an external checklist region. */
  describedBy?: string;
};

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, error, helper, id, describedBy, ...props }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const errId = `${fieldId}-error`;
    const helpId = `${fieldId}-help`;
    const [show, setShow] = useState(false);
    const describedByIds =
      [error ? errId : helper ? helpId : null, describedBy]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-label font-medium text-ink">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={show ? "text" : "password"}
            aria-invalid={!!error}
            aria-describedby={describedByIds}
            className={`${inputClass} pr-12`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-text-muted hover:text-ink"
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {error ? (
          <p id={errId} role="alert" className="flex items-center gap-1 text-body-sm text-error">
            <ErrorIcon /> {error}
          </p>
        ) : helper ? (
          <p id={helpId} className="text-body-sm text-text-muted">
            {helper}
          </p>
        ) : null}
      </div>
    );
  },
);

function ErrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a17.16 17.16 0 0 1-2.16 3.19M6.61 6.61A17.4 17.4 0 0 0 2 12s3.5 7 10 7a9.12 9.12 0 0 0 4.39-1.11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88M2 2l20 20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
