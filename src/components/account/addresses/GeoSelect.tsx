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
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder: string;
  disabledHint?: string;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error || (disabled && disabledHint) ? msgId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-gray-50 disabled:text-gray-400 aria-[invalid=true]:border-red-500"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error ? (
        <p id={msgId} role="alert" className="text-sm text-red-600">{error}</p>
      ) : disabled && disabledHint ? (
        <p id={msgId} className="text-xs text-gray-400">{disabledHint}</p>
      ) : null}
    </div>
  );
}
