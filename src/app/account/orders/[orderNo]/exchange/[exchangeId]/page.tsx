import { ReplacementView } from "./ReplacementView";

/** Exchange status + replacement — `/account/orders/<orderNo>/exchange/<exchangeId>`. */
export default function ReplacementPage({ params }: { params: { orderNo: string; exchangeId: string } }) {
  return <ReplacementView orderNo={params.orderNo} exchangeId={params.exchangeId} />;
}
