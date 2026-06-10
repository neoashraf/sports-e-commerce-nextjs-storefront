/**
 * SportsVault Icon — a thin wrapper around lucide-react.
 *
 * Renders a consistent Lucide glyph (1.5 stroke, currentColor) from a kebab- or
 * pascal-case `name`. Decorative by default (aria-hidden); pass `title` to give it
 * an accessible label. Unknown names render nothing (no crash).
 *
 * Design source: docs/design/design-files/components/core/Icon.jsx (API + visual
 * ported; the static kit's window.lucide CDN-injection is replaced by lucide-react).
 */
import { icons, type LucideProps } from "lucide-react";

export type IconProps = {
  /** Lucide icon name, kebab-case ("shopping-bag") or pascal-case ("ShoppingBag"). */
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  className?: string;
  /** When set, the icon is announced with this label; otherwise it is aria-hidden. */
  title?: string;
};

/** "shopping-bag" / "shopping_bag" / "shopping bag" / "ShoppingBag" -> "ShoppingBag" */
function toPascal(name: string): string {
  return String(name)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 1.5,
  fill = "none",
  className,
  title,
}: IconProps) {
  const key = toPascal(name) as keyof typeof icons;
  const LucideIcon = icons[key];
  if (!LucideIcon) return null;

  const a11y: Partial<LucideProps> = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };

  return (
    <LucideIcon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={fill}
      className={className}
      {...a11y}
    />
  );
}
