import Link from "next/link";

/**
 * Brand mark — the constant "home" affordance in the header (storefront-shell
 * §5 Logo). SportsVault wordmark: an ink "S" tile with a volt "V", then
 * "SPORTS" + volt-emphasised "VAULT". Placeholder asset for MVP (README §7);
 * swap for the final logo later with no code change. Keeps href="/" + aria-label.
 *
 * The wordmark is hidden below 480px in the header (tight phone row), but callers
 * with room (e.g. the nav drawer) can pass `showWordmark` to force it visible.
 */
export function Logo({ showWordmark = false }: { showWordmark?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Home"
      className="inline-flex shrink-0 items-center gap-2 rounded-md"
    >
      <span
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-md bg-ink text-[15px] font-black leading-none tracking-tight text-white"
      >
        S<span className="text-volt">V</span>
      </span>
      <span
        className={`text-[19px] font-normal leading-none tracking-snug text-ink ${
          showWordmark ? "inline" : "hidden min-[480px]:inline"
        }`}
      >
        SPORTS<b className="font-black">VAULT</b>
      </span>
    </Link>
  );
}
