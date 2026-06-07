import { OrderDetailView } from "@/components/orders/OrderDetailView";

/** Order detail — `/account/orders/<orderNo>` (ord-storefront-fe). */
export default function OrderDetailPage({ params }: { params: { orderNo: string } }) {
  return <OrderDetailView orderNo={params.orderNo} />;
}
