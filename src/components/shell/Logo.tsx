import Link from "next/link";

/**
 * Brand mark — the constant "home" affordance in the header (storefront-shell
 * §5 Logo). SportsVault wordmark: an ink "S" tile with a volt "V", then
 * "SPORTS" + volt-emphasised "VAULT". Placeholder asset for MVP (README §7);
 * swap for the final logo later with no code change. Keeps href="/" + aria-label.
 */
export function Logo() {
  return (
    <Link
      href="/"
      aria-label="Home"
      className="inline-flex shrink-0 items-center gap-2 rounded-md"
    >
      <span
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-md bg-ink text-[15px] font-black leading-none text-white"
      >
        S<span className="text-volt">V</span>
      </span>
      <span className="text-[18px] font-extrabold uppercase tracking-tight text-ink">
        Sports<span className="text-volt-600">Vault</span>
      </span>
    </Link>
  );
}
