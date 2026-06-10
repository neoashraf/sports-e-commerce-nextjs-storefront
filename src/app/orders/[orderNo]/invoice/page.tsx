import type { Metadata } from "next";
import { AccountGuard } from "@/components/account/AccountGuard";
import { InvoiceView } from "@/components/orders/InvoiceView";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

/**
 * Invoice document — `/orders/<orderNo>/invoice` (ord-storefront-fe, FR-ORD-073).
 * Full-bleed standalone A4 viewer (escapes the account sidebar layout). Auth-gated
 * to the signed-in customer; the backend `/me/orders/:orderNo/invoice` enforces
 * own-order access on the data itself.
 */
export default function InvoicePage({ params }: { params: { orderNo: string } }) {
  return (
    <AccountGuard>
      <InvoiceView orderNo={params.orderNo} />
    </AccountGuard>
  );
}
