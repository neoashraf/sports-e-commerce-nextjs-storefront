"use client";

import { useId } from "react";

/**
 * A single labelled <select> for the cascading geo pickers (address-book §5).
 * Disabled child selects announce why via the error/helper line.
 */
export function GeoSelect({
  label,
  value,
  options,
  onChange,
  disabled,
  error,
  placeholder,
  disabledHint,
  required,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder: string;
  disabledHint?: string;
  required?: boolean;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-body-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-error" aria-hidden="true">*</span>}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        required={required}
        aria-required={required || undefined}
        aria-invalid={!!error}
        aria-describedby={error || (disabled && disabledHint) ? msgId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] w-full rounded-sm border border-border-strong bg-white px-3 text-body text-ink transition-colors duration-micro ease-out focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)] disabled:bg-surface-50 disabled:text-text-faint aria-[invalid=true]:border-error"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error ? (
        <p id={msgId} role="alert" className="text-body-sm text-error">{error}</p>
      ) : disabled && disabledHint ? (
        <p id={msgId} className="text-label text-text-faint">{disabledHint}</p>
      ) : null}
    </div>
  );
}
