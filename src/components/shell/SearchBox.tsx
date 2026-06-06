"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchIcon } from "./icons";

/**
 * Search box — the INPUT SHELL + ENTRY POINT only (storefront-shell §5).
 *
 * The autosuggest experience (suggestions/results) is owned by `SRCH`
 * (search-autosuggest) and is OUT OF SCOPE here. Until SRCH ships, submitting
 * routes to the search results page (`/search?q=`). When offline, the shell
 * shows the §8 offline copy instead of navigating.
 */
export function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [offline, setOffline] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setOffline(true);
      return;
    }
    setOffline(false);
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={"relative w-full " + className}
    >
      <label htmlFor="storefront-search" className="sr-only">
        Search for products, brands…
      </label>
      <input
        id="storefront-search"
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (offline) setOffline(false);
        }}
        placeholder="Search for products, brands…"
        autoComplete="off"
        className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
      {offline && (
        <p role="alert" className="absolute left-0 top-full mt-1 text-xs text-amber-700">
          You&apos;re offline. Check your connection.
        </p>
      )}
    </form>
  );
}
