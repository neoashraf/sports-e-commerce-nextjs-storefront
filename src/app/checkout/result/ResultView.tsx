"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { forwardRef, useEffect, useRef, useState } from "react";
import { usePaymentStatus, useRetryPayment } from "@/lib/api/hooks/payments";
import { formatBDT } from "@/lib/format";
import { toast } from "@/lib/stores/toast";
import { Icon } from "@/components/ui/Icon";

const POLL_TIMEOUT_MS = 30_000;

/**
 * Payment result — faithful port of the design kit (ui_kits/payment-result,
 * payment-result.md). A processing interstitial that polls the AUTHORITATIVE
 * payment status (never trusts the URL `status`), then resolves to one of the
 * design states: success / failed / cancelled / still-confirming / poll-error.
 * Each is a centered card with a 72px status badge, headline, optional sub +
 * order box, state-specific CTAs, and a help line. Retry re-initiates payment;
 * "choose another method" returns to checkout.
 */
export function ResultView() {
  const router = useRouter();
  const sp = useSearchParams();
  // The gateway return carries `ref` (the PAY-… capability token); status is polled by ref.
  const ref = sp.get("ref") ?? "";

  const { data, isError } = usePaymentStatus(ref);
  const retry = useRetryPayment();
  const [timedOut, setTimedOut] = useState(false);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  const orderNo = data?.order_no ?? sp.get("order") ?? "";
  const amount = data?.amount ? formatBDT(Number(data.amount)) : null;
  const gateway = data?.method === "sslcommerz" ? "SSLCommerz" : "bKash";

  const status = data?.status;
  const terminal = status === "paid" || status === "failed" || status === "cancelled" || status === "cod_pending";

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  // Move focus to the headline whenever a final state is reached (a11y).
  const resolved = terminal || timedOut || isError;
  useEffect(() => {
    if (resolved) headlineRef.current?.focus();
  }, [resolved]);

  async function onRetry() {
    if (!data?.order_id) {
      router.push("/checkout");
      return;
    }
    try {
      const res = await retry.mutateAsync({ order_id: data.order_id, method: data.method ?? "bkash" });
      if (res.action === "redirect" && res.redirect_url) window.location.href = res.redirect_url;
      else router.refresh();
    } catch {
      toast("Couldn't retry the payment. Try another method.", "error");
    }
  }

  // ───── Processing (still polling within the window) ─────
  if (!terminal && !timedOut && !isError) {
    return (
      <Shell>
        <div aria-live="assertive" className="contents">
          <div
            className="mb-5 h-[72px] w-[72px] rounded-full border-[5px] border-surface-100 border-t-volt-600 motion-safe:animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          <Headline ref={headlineRef}>Confirming your payment…</Headline>
          <Sub>Please wait while we confirm your payment with {gateway}. Don&apos;t close this page.</Sub>
          {orderNo && <OrderBox rows={[["Order", `SO-${orderNo}`]]} />}
        </div>
      </Shell>
    );
  }

  // ───── Poll error (lookup failed) ─────
  if (isError && !terminal) {
    return (
      <Shell>
        <Badge tone="cancel" icon="wifi-off" />
        <Headline ref={headlineRef}>Couldn&apos;t check your payment</Headline>
        <Sub>We lost connection while confirming. Your order is safe.</Sub>
        {orderNo && <OrderBox rows={[["Order", `SO-${orderNo}`]]} />}
        <Actions>
          <PrimaryBtn onClick={() => router.refresh()} icon="refresh-cw">Refresh</PrimaryBtn>
        </Actions>
        <Help tone="err" icon="alert-circle">Couldn&apos;t check your payment. Refresh.</Help>
      </Shell>
    );
  }

  // ───── Success ─────
  if (status === "paid" || status === "cod_pending") {
    return (
      <Shell>
        <Badge tone="ok" icon="check" />
        <Headline ref={headlineRef}>Payment successful</Headline>
        <OrderBox rows={[["Order", `SO-${orderNo}`], ...(amount ? [["Amount paid", amount] as [string, string]] : [])]} />
        <Actions>
          <PrimaryLink href={`/orders/${orderNo}/confirmation`}>View your order</PrimaryLink>
        </Actions>
        <Help icon="mail">A confirmation has been sent to your email &amp; SMS.</Help>
      </Shell>
    );
  }

  // ───── Failed / Cancelled ─────
  if (status === "failed" || status === "cancelled") {
    const cancelled = status === "cancelled";
    return (
      <Shell>
        <Badge tone={cancelled ? "cancel" : "err"} icon={cancelled ? "slash" : "x"} />
        <Headline ref={headlineRef}>{cancelled ? "Payment cancelled" : "Payment failed"}</Headline>
        <Sub>Your order is saved — you can retry payment.</Sub>
        <OrderBox rows={[["Order", `SO-${orderNo}`], ...(amount ? [["Amount due", amount] as [string, string]] : [])]} />
        <Actions>
          <PrimaryBtn onClick={onRetry} disabled={retry.isPending}>{retry.isPending ? "Retrying…" : "Retry payment"}</PrimaryBtn>
          <SecondaryLink href="/checkout">Choose another method</SecondaryLink>
        </Actions>
        <Help icon="help-circle">
          {cancelled ? "Changed your mind? Your cart is intact." : "Need help? Contact support."}
        </Help>
      </Shell>
    );
  }

  // ───── Still confirming (timed out, non-terminal) ─────
  return (
    <Shell>
      <Badge tone="wait" icon="clock" />
      <Headline ref={headlineRef}>Still confirming</Headline>
      <Sub>Still confirming — we&apos;ll email/SMS you once it&apos;s done.</Sub>
      <OrderBox rows={[["Order", `SO-${orderNo}`], ...(amount ? [["Amount due", amount] as [string, string]] : [])]} />
      <Actions>
        <PrimaryLink href={orderNo ? `/account/orders/${orderNo}` : "/account/orders"}>View order status</PrimaryLink>
      </Actions>
      <Help icon="bell">We&apos;ll update your order shortly.</Help>
    </Shell>
  );
}

/* ───────────────────────── presentational pieces ───────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-[1120px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mx-auto flex max-w-[440px] flex-col items-center rounded-lg border border-border bg-white px-6 py-8 text-center">
          {children}
        </div>
      </div>
    </div>
  );
}

const BADGE_TONE: Record<string, string> = {
  ok: "bg-volt text-ink",
  err: "bg-sale text-white",
  cancel: "bg-surface-100 text-text-muted",
  wait: "bg-cyan-600/[0.14] text-cyan-600",
};

function Badge({ tone, icon }: { tone: keyof typeof BADGE_TONE; icon: string }) {
  const big = icon === "check" || icon === "x";
  return (
    <span className={"mb-5 grid h-[72px] w-[72px] place-items-center rounded-full " + BADGE_TONE[tone]} aria-hidden="true">
      <Icon name={icon} size={big ? 36 : 32} color="currentColor" strokeWidth={big ? 3 : 2.5} />
    </span>
  );
}

const Headline = forwardRef<HTMLHeadingElement, { children: React.ReactNode }>(function Headline({ children }, ref) {
  return (
    <h1 ref={ref} tabIndex={-1} className="mb-2 text-xl font-extrabold tracking-snug text-ink outline-none">
      {children}
    </h1>
  );
});

function Sub({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 max-w-[360px] text-body-sm leading-relaxed text-text-muted">{children}</p>;
}

function OrderBox({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mb-[22px] flex w-full max-w-[360px] flex-col gap-2 rounded-md border border-border bg-surface-50 px-4 py-3.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 text-body-sm">
          <span className="text-text-muted">{k}</span>
          <span className="font-bold tabular-nums text-ink">{v}</span>
        </div>
      ))}
    </div>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full max-w-[360px] flex-col gap-2.5">{children}</div>;
}

const PRIMARY = "inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-volt text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:opacity-50";
const SECONDARY = "inline-flex h-12 w-full items-center justify-center rounded-md border border-border-strong text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100";

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className={PRIMARY}>{children}</Link>;
}
function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className={SECONDARY}>{children}</Link>;
}
function PrimaryBtn({ onClick, disabled, icon, children }: { onClick: () => void; disabled?: boolean; icon?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={PRIMARY}>
      {icon && <Icon name={icon} size={18} aria-hidden="true" />}
      {children}
    </button>
  );
}

function Help({ tone, icon, children }: { tone?: "err"; icon: string; children: React.ReactNode }) {
  return (
    <p className={"mt-4 inline-flex items-center justify-center gap-1.5 text-body-sm " + (tone === "err" ? "text-error" : "text-text-muted")}>
      <Icon name={icon} size={15} aria-hidden="true" /> {children}
    </p>
  );
}
