import { ExchangeView } from "./ExchangeView";

/** Exchange request — `/account/orders/<orderNo>/exchange` (ord-exchange-fe). */
export default function ExchangePage({ params }: { params: { orderNo: string } }) {
  return <ExchangeView orderNo={params.orderNo} />;
}
