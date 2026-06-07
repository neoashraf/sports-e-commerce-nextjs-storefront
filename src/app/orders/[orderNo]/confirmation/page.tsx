import type { Metadata } from "next";
import { ConfirmationView } from "./ConfirmationView";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false, follow: false } };

/** Order confirmation — `/orders/<orderNo>/confirmation` (ord-storefront-fe). */
export default function ConfirmationPage({ params }: { params: { orderNo: string } }) {
  return <ConfirmationView orderNo={params.orderNo} />;
}
