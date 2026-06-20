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

export function InboxIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return <ShellIcon name="inbox" className={className} />;
}

export function LifeBuoyIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return <ShellIcon name="life-buoy" className={className} />;
}

// Brand/social glyphs — lucide-react dropped its brand icons, so these are
// self-contained inline SVGs (currentColor fill) for the footer social row
// (rw7-shell-polish). Decorative; the surrounding <a> carries the aria-label.
function brandSize(className: string): number {
  return sizeFrom(className);
}

export function FacebookIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  const s = brandSize(className);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.24-1.46 1.49-1.46H17V4.46A20.6 20.6 0 0 0 14.83 4.3c-2.16 0-3.64 1.32-3.64 3.74V10.5H8.6v3h2.59V21h2.31Z" />
    </svg>
  );
}

export function InstagramIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  const s = brandSize(className);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function YoutubeIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  const s = brandSize(className);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  );
}

/** Footer social glyphs keyed by name (rw7-shell-polish). */
export const SOCIAL_ICONS: Record<string, (p: IconProps) => JSX.Element> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
};
