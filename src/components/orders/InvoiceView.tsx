"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrderDetail, isNotFound } from "@/lib/api/hooks/orders";
import type { OrderDetail } from "@/lib/api/schemas/orders";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/format";
import {
  downloadInvoicePdf,
  informationalVat,
  isPaidState,
  paymentMethodLabel,
  paymentStateLabel,
  tk,
} from "@/lib/orders/invoice";

/**
 * Invoice (ORD) — A4 print document for a customer's own order (FR-ORD-073,
 * docs/design/design-files/ui_kits/invoice). Renders the immutable order snapshot
 * as a Mushak-6.3-compatible sheet: seller + VAT BIN, buyer/delivery, itemized
 * lines, the amount breakdown with an informational inclusive-15% VAT line, and a
 * payment chip that reflects the order's real state (a paid receipt, or an
 * unpaid/COD-pending notice — never a paid receipt for an unpaid order, §12.17).
 * The payment/delivery method is shown dynamically (bKash · Card · Cash on Delivery).
 * "Download PDF" fetches the server-rendered PDF from the backend invoice route and
 * saves it directly as a file — there is no print option.
 */
export function InvoiceView({ orderNo }: { orderNo: string }) {
  const { data, isLoading, isError, error } = useOrderDetail(orderNo);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-[60vh] animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (isError) {
    const notFound = isNotFound(error);
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm font-medium text-gray-700">
          {notFound ? "We couldn't find that order." : "Couldn't load this invoice."}
        </p>
        <Link
          href={`/account/orders/${encodeURIComponent(orderNo)}`}
          className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
        >
          Back to order
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="inv-app">
      <Toolbar orderNo={orderNo} />
      <div className="inv-stage">
        <InvoiceSheet order={data} />
      </div>
    </div>
  );
}

function Toolbar({ orderNo }: { orderNo: string }) {
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setFailed(false);
    try {
      await downloadInvoicePdf(orderNo);
    } catch {
      setFailed(true);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="inv-toolbar">
      <div className="inv-toolbar-in">
        <span className="inv-toolbar-title">
          <FileIcon /> Invoice · {orderNo}
        </span>
        <div className="inv-toolbar-actions">
          {failed && (
            <span role="alert" className="inv-dl-error">
              Couldn&apos;t download. Try again.
            </span>
          )}
          <Link href={`/account/orders/${encodeURIComponent(orderNo)}`} className="inv-back">
            <BackIcon /> Back to order
          </Link>
          <button
            type="button"
            className="inv-print-btn"
            onClick={handleDownload}
            disabled={downloading}
            aria-busy={downloading}
          >
            <DownloadIcon /> {downloading ? "Downloading…" : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceSheet({ order }: { order: OrderDetail }) {
  const seller = env.invoiceSeller;
  const paid = isPaidState(order.payment_state);
  const methodLabel = paymentMethodLabel(order.payment_method);
  const date = order.placed_at ? formatDate(order.placed_at) : "—";

  const m = order.amounts;
  const vatIncluded = m ? informationalVat(m.subtotal, m.discount) : 0;
  const codFee = Number(m?.cod_surcharge ?? 0);

  const paymentLabel = paid
    ? `Paid · ${methodLabel} · ${date}`
    : `${paymentStateLabel(order.payment_state, order.payment_method)} · ${methodLabel}`;

  const addr = order.address;
  const buyerAddress = addr
    ? [addr.address_line, addr.area, addr.district, addr.division, addr.postal_code]
        .filter(Boolean)
        .join(", ")
    : "—";

  return (
    <section className="inv-sheet" aria-label={`Invoice ${order.order_no} — ${paid ? "paid" : "unpaid"}`}>
      {/* 1 — Seller header + 2 — invoice meta */}
      <div className="inv-top">
        <div>
          <div className="inv-rule" style={{ marginBottom: 14 }} />
          <div className="inv-brand-mark">
            <span className="sv">
              S<span>V</span>
            </span>
            <span className="inv-brand-word">
              SPORTS<b>VAULT</b>
            </span>
          </div>
          <div className="inv-seller">
            {seller.address}
            <br />
            {seller.phone} · {seller.email}
            <br />
            <span className="bin">BIN: {seller.bin}</span>
          </div>
        </div>

        <div className="inv-meta">
          <div className="inv-meta-title">Invoice</div>
          <div className="inv-meta-sub">Mushak 6.3</div>
          <div className="inv-meta-table">
            <span className="k">Invoice / Order</span>
            <span className="v">{order.order_no}</span>
            <span className="k">Date</span>
            <span className="v">{date}</span>
            <span className="k">Payment</span>
            <span className="v">{methodLabel}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <PayState paid={paid} method={methodLabel} state={order.payment_state} paymentMethod={order.payment_method} />
          </div>
        </div>
      </div>

      <hr className="inv-divider strong" />

      {/* 3 — Bill To / Deliver To */}
      <div className="inv-parties">
        <div>
          <div className="inv-party-label">Bill To</div>
          <div className="inv-party-name">{addr?.recipient_name ?? "—"}</div>
          <div className="inv-party-body">
            {addr?.recipient_phone ?? "—"}
            <br />
            BIN: —
          </div>
        </div>
        <div>
          <div className="inv-party-label">Deliver To</div>
          <div className="inv-party-name">{addr?.recipient_name ?? "—"}</div>
          <div className="inv-party-body">
            {buyerAddress}
            <br />
            {addr?.recipient_phone ?? "—"}
          </div>
        </div>
      </div>

      <hr className="inv-divider" />

      {/* 4 — Itemized table */}
      <table className="inv-table">
        <thead>
          <tr>
            <th style={{ width: "40%" }}>Title</th>
            <th>SKU</th>
            <th>Options</th>
            <th className="num">Unit price</th>
            <th className="num">Qty</th>
            <th className="num">Line total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={i}>
              <td className="ti">{it.product_title}</td>
              <td className="sku">{it.sku_code ?? "—"}</td>
              <td className="opt">{Object.values(it.variant_options).join(" · ") || "—"}</td>
              <td className="num">{tk(it.unit_price)}</td>
              <td className="num">{it.quantity}</td>
              <td className="num">{tk(it.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5 — Amount breakdown */}
      <div className="inv-totals">
        <div className="inv-totals-box">
          <div className="inv-totals-row">
            <span className="k">Subtotal</span>
            <span className="v">{tk(m?.subtotal)}</span>
          </div>
          {Number(m?.discount ?? 0) > 0 && (
            <div className="inv-totals-row">
              <span className="k">Discount{order.applied_coupon_code ? ` (${order.applied_coupon_code})` : ""}</span>
              <span className="v">− {tk(m?.discount)}</span>
            </div>
          )}
          <div className="inv-totals-row">
            <span className="k">Delivery</span>
            <span className="v">{tk(m?.delivery_charge)}</span>
          </div>
          {codFee > 0 && (
            <div className="inv-totals-row muted">
              <span className="k">COD fee</span>
              <span className="v">{tk(codFee)}</span>
            </div>
          )}
          <div className="inv-totals-row vat">
            <span className="k">VAT (15%, included)</span>
            <span className="v">{tk(vatIncluded)}</span>
          </div>
          <div className="inv-totals-row grand">
            <span className="k">Total</span>
            <span className="v">{tk(m?.grand_total)}</span>
          </div>
        </div>
      </div>

      {/* 6 — Footer */}
      <div className="inv-foot">
        <div className="inv-foot-note">
          <strong>Returns are exchange-only within 30 days.</strong>
          <span>
            Payment: {paymentLabel}. This invoice is generated from the order record at the time of purchase.
          </span>
          <span style={{ color: "var(--text-faint)" }}>
            VAT shown is inclusive (Mushak 6.3). BIN is a placeholder until the seller BIN is configured.
          </span>
        </div>
        <div className="inv-thanks">Thank you for shopping with SportsVault — gear up, play bold.</div>
        <div className="inv-foot-meta">
          <span>
            {seller.name} · {seller.phone} · {seller.email}
          </span>
          <span>
            Invoice {order.order_no} · {date}
          </span>
        </div>
      </div>
    </section>
  );
}

function PayState({
  paid,
  method,
  state,
  paymentMethod,
}: {
  paid: boolean;
  method: string;
  state: string | undefined;
  paymentMethod: string | undefined;
}) {
  return (
    <div className={`inv-pay ${paid ? "paid" : "unpaid"}`}>
      <span className="dot" />
      {paid ? `Paid · ${method}` : paymentStateLabel(state, paymentMethod)}
    </div>
  );
}

/* Inline icons (the storefront has no design-system bundle; these match the kit's
 * lucide `file-text` / `printer` glyphs). Decorative — labelled by adjacent text. */
function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--volt)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
