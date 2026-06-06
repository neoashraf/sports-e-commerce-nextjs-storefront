import { AuthEntryButton } from "@/components/auth/AuthEntryButton";

/**
 * Storefront landing page. Public, indexable entry point. Replaced by the real
 * home (hero, featured categories, product rails) when the catalog/search
 * modules are built — this is the scaffold placeholder, now with the auth entry
 * point wired up (the AUTH module's surface).
 */
export default function Home() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6">
        <span className="text-lg font-bold text-gray-900">Sports E-Commerce</span>
        <AuthEntryButton />
      </header>
      <main className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Sports E-Commerce
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-500 sm:text-base">
            Storefront scaffold is up. Catalog, search, cart, and checkout land as
            their modules are built.
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Auth ready
        </span>
      </main>
    </>
  );
}
