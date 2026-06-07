"use client";

import { forwardRef, useId, useState } from "react";

/**
 * Accessible field primitives shared across the auth forms (fe-form-builder):
 * label + input + aria-invalid/aria-describedby + role="alert" error. Inputs
 * keep ≥44px touch height.
 */

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 " +
  "placeholder:text-gray-400 focus:border-brand-500 focus:outline-none " +
  "focus:ring-2 focus:ring-brand-500/30 disabled:bg-gray-50 disabled:text-gray-500 " +
  "aria-[invalid=true]:border-red-500";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helper?: string;
  /** Visual prefix inside the field (e.g. +880). */
  prefix?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, helper, prefix, id, ...props }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const errId = `${fieldId}-error`;
    const helpId = `${fieldId}-help`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-900">
          {label}
        </label>
        <div className={prefix ? "flex items-stretch" : undefined}>
          {prefix && (
            <span className="inline-flex select-none items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={!!error}
            aria-describedby={error ? errId : helper ? helpId : undefined}
            className={prefix ? `${inputClass} rounded-l-none` : inputClass}
            {...props}
          />
        </div>
        {error ? (
          <p id={errId} role="alert" className="flex items-center gap-1 text-sm text-red-600">
            <ErrorIcon /> {error}
          </p>
        ) : helper ? (
          <p id={helpId} className="text-xs text-gray-500">
            {helper}
          </p>
        ) : null}
      </div>
    );
  },
);

type PasswordFieldProps = Omit<TextFieldProps, "type" | "prefix"> & {
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
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-900">
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
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-gray-500 hover:text-gray-700"
          >
            {show ? "🙈" : "👁"}
          </button>
        </div>
        {error ? (
          <p id={errId} role="alert" className="flex items-center gap-1 text-sm text-red-600">
            <ErrorIcon /> {error}
          </p>
        ) : helper ? (
          <p id={helpId} className="text-xs text-gray-500">
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
