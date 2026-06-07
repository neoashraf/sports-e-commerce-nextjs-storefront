"use client";

import { useEffect, useRef } from "react";

/**
 * 6-digit segmented OTP input (phone-otp-login §5/§10). Reused by phone-login,
 * account-claim, and phone-change. Features: numeric inputmode,
 * autocomplete="one-time-code" (OS SMS autofill), auto-advance, backspace to
 * previous, paste-fills-all, auto-submit on the 6th digit. Exposed to AT as a
 * single labelled group ("One-time code, 6 digits").
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  length = 6,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
  length?: number;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // Focus the first empty cell when value resets (e.g. after a wrong code).
  useEffect(() => {
    if (value === "") refs.current[0]?.focus();
  }, [value]);

  const setDigit = (index: number, digit: string) => {
    const chars = value.split("");
    chars[index] = digit;
    const next = chars.join("").slice(0, length);
    onChange(next);
    return next;
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const next = setDigit(index, digit);
    if (index < length - 1) refs.current[index + 1]?.focus();
    if (next.length === length && !next.includes("")) onComplete(next);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setDigit(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const target = Math.min(pasted.length, length - 1);
    refs.current[target]?.focus();
    if (pasted.length === length) onComplete(pasted);
  };

  return (
    <div
      role="group"
      aria-label="One-time code, 6 digits"
      className="flex justify-between gap-2"
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={value[i] ?? ""}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={error}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={[
            "h-12 w-12 min-w-0 flex-1 rounded-lg border text-center text-lg font-semibold",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/30",
            error
              ? "border-red-500 text-red-700"
              : "border-gray-300 text-gray-900 focus:border-brand-500",
            disabled ? "bg-gray-50" : "",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
