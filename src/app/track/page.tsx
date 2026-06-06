import type { Metadata } from "next";
import { TrackView } from "./TrackView";

export const metadata: Metadata = { title: "Track your order" };

/** Public guest order tracking — `/track` (ord-storefront-fe). */
export default function TrackPage() {
  return <TrackView />;
}
