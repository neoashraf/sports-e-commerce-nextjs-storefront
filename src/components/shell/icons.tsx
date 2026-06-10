/**
 * Storefront-shell icon set. These are thin, sized wrappers around the RW0
 * `Icon` primitive (lucide-react) so every shell glyph matches the final design
 * system's 1.5-stroke Lucide look. Decorative only — accessible names live on
 * the surrounding buttons/links (storefront-shell §10).
 *
 * The wrappers keep the original `{ className }` API the shell components were
 * built against (no consumer wiring changes); a `className` of the form
 * `h-N w-N` is mapped to a Lucide pixel `size`, and the colour comes from
 * `currentColor`.
 */
import { Icon } from "@/components/ui/Icon";

type IconProps = { className?: string };

const DEFAULT = "h-6 w-6";

/**
 * Map a Tailwind height class to a Lucide pixel `size`. Supports the arbitrary
 * pixel form (`h-[18px]` → 18) and the scale form (`h-6` → 24, 1 unit = 4px).
 * Falls back to 24 (the header's default glyph size).
 */
function sizeFrom(className: string): number {
  const px = className.match(/h-\[(\d+(?:\.\d+)?)px\]/);
  if (px) return Math.round(parseFloat(px[1]));
  const scale = className.match(/h-(\d+(?:\.\d+)?)(?:\s|$)/);
  if (scale) return Math.round(parseFloat(scale[1]) * 4);
  return 24;
}

function ShellIcon({ name, className = DEFAULT }: IconProps & { name: string }) {
  return <Icon name={name} size={sizeFrom(className)} className={className} />;
}

export function MenuIcon({ className = DEFAULT }: IconProps) {
  return <ShellIcon name="menu" className={className} />;
}

export function CloseIcon({ className = DEFAULT }: IconProps) {
  return <ShellIcon name="x" className={className} />;
}

export function SearchIcon({ className = DEFAULT }: IconProps) {
  return <ShellIcon name="search" className={className} />;
}

export function HeartIcon({ className = DEFAULT }: IconProps) {
  return <ShellIcon name="heart" className={className} />;
}

export function BagIcon({ className = DEFAULT }: IconProps) {
  return <ShellIcon name="shopping-bag" className={className} />;
}

export function UserIcon({ className = DEFAULT }: IconProps) {
  return <ShellIcon name="user" className={className} />;
}

export function ChevronDownIcon({ className = "h-4 w-4" }: IconProps) {
  return <ShellIcon name="chevron-down" className={className} />;
}

export function PackageIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return <ShellIcon name="package" className={className} />;
}

export function LogOutIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return <ShellIcon name="log-out" className={className} />;
}

export function TruckIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return <ShellIcon name="truck" className={className} />;
}
