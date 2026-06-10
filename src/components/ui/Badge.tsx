/**
 * SportsVault Badge — pill label for New / Sale / discount / stock / authentic.
 * Meaning is carried by TEXT, not colour alone (a11y guardrail): every badge
 * renders its text child. One primary badge per card is preferred.
 *
 * Design source: docs/design/design-files/components/display/Badge.{jsx,prompt.md}
 */

type BadgeVariant =
  | "new"
  | "sale"
  | "discount"
  | "authentic"
  | "bestSeller"
  | "inStock"
  | "lowStock"
  | "outStock"
  | "neutral";

type BadgeSize = "sm" | "md";

// Variant fills/text use token classes; the two tints (low-stock amber-700 text,
// out-of-stock ink scrim) use the exact kit values where no token class exists.
const variants: Record<BadgeVariant, string> = {
  new: "bg-volt text-ink",
  sale: "bg-sale text-white",
  discount: "bg-sale text-white",
  authentic: "bg-transparent text-ink border border-ink",
  bestSeller: "bg-ink text-white",
  inStock: "bg-success/10 text-success",
  lowStock: "bg-warning/15 text-[#B45309]",
  outStock: "bg-ink/70 text-white",
  neutral: "bg-surface-100 text-text",
};

const sizes: Record<BadgeSize, string> = {
  sm: "px-[7px] py-[2px] text-[11px]",
  md: "px-[9px] py-[3px] text-[12px]",
};

export function Badge({
  children,
  variant = "new",
  size = "md",
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm font-semibold leading-tight tracking-[0.01em] whitespace-nowrap ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
