"use client";

import Link from "next/link";
import { useProductDetail, isNotFound } from "@/lib/api/hooks/catalog";
import { ProductDetailView } from "./ProductDetailView";

/**
 * Client wrapper for the PDP route. Owns the §6 states that depend on the
 * client-side fetch: loading skeleton, load-error (+ "Try again"), and
 * not-found (`404` → "Browse products", no retry). The loaded body is the
 * ProductDetailView.
 */
export function PdpClient({ slug }: { slug: string }) {
  const { data, isLoading, isError, error, refetch } = useProductDetail(slug);

  if (isLoading) return <PdpSkeleton />;

  if (isError) {
    if (isNotFound(error)) {
      return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
          <h1 className="text-xl font-semibold text-gray-900">This product isn&apos;t available.</h1>
          <Link
            href="/search"
            className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Browse products
          </Link>
        </div>
      );
    }
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Couldn&apos;t load this product.</h1>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;
  return <ProductDetailView product={data} />;
}

/** Loading skeleton (product-detail §6 — gallery block, shimmer info, chips). */
function PdpSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="aspect-square w-full animate-pulse rounded-lg bg-gray-100" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-7 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 w-11 animate-pulse rounded-full bg-gray-100" />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 w-12 animate-pulse rounded-md bg-gray-100" />
            ))}
          </div>
          <div className="h-12 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
