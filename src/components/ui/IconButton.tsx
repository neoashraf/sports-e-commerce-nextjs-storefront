"use client";

/**
 * SportsVault IconButton — round, 44px-hit icon-only control (search, wishlist, cart).
 * Always pass `ariaLabel` (icon-only → needs an accessible name). The glyph is passed
 * as children (an <svg>) for now; it adopts <Icon name=…> once rw0-badge-icon ships.
 *
 * Design source: docs/design/design-files/components/forms/IconButton.{jsx,prompt.md}
 */

type IconButtonVariant = "ghost" | "solid" | "onDark";
type IconButtonSize = "sm" | "md" | "lg";

export function IconButton({
  children,
  ariaLabel,
  variant = "ghost",
  size = "md",
  active = false,
  badge,
  className = "",
  type = "button",
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  ariaLabel: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  active?: boolean;
  /** Count chip pinned top-right (volt/ink). */
  badge?: React.ReactNode;
}) {
  // 44px hit by default; sm 36 / md 44 / lg 48.
  const sizes: Record<IconButtonSize, string> = {
    sm: "h-[36px] w-[36px]",
    md: "h-[44px] w-[44px]",
    lg: "h-[48px] w-[48px]",
  };

  const variants: Record<IconButtonVariant, string> = {
    ghost: "bg-transparent text-ink hover:bg-surface-100",
    solid: "bg-ink text-white hover:bg-ink-700",
    onDark: "bg-transparent text-white hover:bg-white/10",
  };

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={`relative inline-flex items-center justify-center rounded-full border-none ` +
        `transition-colors duration-micro ease-out ${sizes[size]} ${variants[variant]} ` +
        `${active ? "text-volt-600" : ""} ${className}`}
      {...props}
    >
      {children}
      {badge != null && (
        <span
          className="absolute right-0.5 top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-volt px-[5px] text-[11px] font-bold leading-none text-ink"
        >
          {badge}
        </span>
      )}
    </button>
  );
}
