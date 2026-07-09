import { HomeView } from "@/components/home/HomeView";

/**
 * Storefront landing page (cms-home-fe). Public, indexable. Renders inside the
 * storefront shell (root layout). The `<title>` defaults to the store name and
 * is refined to the CMS `seo.title` client-side once the homepage payload loads.
 */
export default function Home() {
  console.log("Storefront landing page rendered");
  return <HomeView />;
}
