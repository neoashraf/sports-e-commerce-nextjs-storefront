/**
 * Storefront landing page. Public, indexable entry point. The global chrome
 * (header/nav/footer) is now provided by the storefront shell in the root
 * layout (cms-storefront-shell-fe); this page renders only the body. The real
 * home (hero, featured rails) lands with cms-home-fe.
 */
export default function Home() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Sports E-Commerce
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-gray-500 sm:text-base">
          Storefront shell is up. The home page, catalog, search, cart, and
          checkout land as their modules are built.
        </p>
      </div>
      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        Shell ready
      </span>
    </div>
  );
}
