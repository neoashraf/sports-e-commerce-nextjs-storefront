"use client";

/**
 * SportsVault Button — the brand's primary action control.
 * Volt-filled primary (ink text — never white on volt), bordered secondary,
 * ghost / on-dark, destructive. Built-in pending spinner + aria-busy
 * (fe-form-builder submit state). Full-width by default for the auth sheets.
 *
 * Design source: docs/design/design-files/components/forms/Button.{jsx,prompt.md}
 */

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "onDark"
  | "destructive"
  | "danger"; // legacy alias → destructive (kept so existing callers don't break)

type ButtonSize = "sm" | "md" | "lg";

export function Button({
  children,
  pending = false,
  variant = "primary",
  size = "md",
  fullWidth = true,
  iconLeft,
  iconRight,
  className = "",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold leading-none " +
    "whitespace-nowrap transition-colors duration-micro ease-out select-none " +
    "disabled:cursor-not-allowed";

  // height (control tokens 36/44/52) + horizontal padding + font-size per size
  const sizes: Record<ButtonSize, string> = {
    sm: "h-[36px] px-[14px] text-body-sm",
    md: "h-[44px] px-[20px] text-[14px]",
    lg: "h-[52px] px-[28px] text-[15px]",
  };

  // disabled style is shared (surface-100 fill, faint text, no border)
  const disabledCls =
    "disabled:bg-surface-100 disabled:text-text-faint disabled:border-transparent";

  const variants: Record<ButtonVariant, string> = {
    primary: "border border-transparent bg-volt text-ink hover:bg-volt-600",
    secondary:
      "border border-border-strong bg-white text-ink hover:bg-surface-100",
    ghost:
      "border border-border-strong bg-transparent text-ink hover:bg-surface-100",
    onDark:
      "border border-white/40 bg-transparent text-white hover:bg-white/10",
    destructive: "border border-transparent bg-error text-white hover:bg-[#C81E1E]",
    danger: "border border-transparent bg-error text-white hover:bg-[#C81E1E]",
  };

  return (
    <button
      type={type}
      aria-busy={pending}
      disabled={pending || props.disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabledCls} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {!pending && iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
