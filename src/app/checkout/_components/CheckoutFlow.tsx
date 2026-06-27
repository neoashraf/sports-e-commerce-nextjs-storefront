"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/api/hooks/cart";
import { useAddresses } from "@/lib/api/hooks/useAddresses";
import { useDivisions, useDistricts, useAreas } from "@/lib/api/hooks/geo";
import { useAuthStore } from "@/lib/stores/auth";
import {
  useQuote,
  usePlaceOrder,
  getOrCreateIdempotencyKey,
  clearIdempotencyKey,
} from "@/lib/api/hooks/checkout";
import type { CheckoutAddress, PaymentMethod } from "@/lib/api/schemas/checkout";
import type { QuoteResponse } from "@/lib/api/schemas/checkout";
import type { CartSummary } from "@/lib/api/schemas/cart";
import type { AddressDto } from "@/lib/api/schemas/auth";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/stores/toast";
import { normalizeNationalDigits, isValidBdNational, toE164 } from "@/lib/auth/phone";
import { formatBDT } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { useHeaderHeight } from "@/lib/hooks/useHeaderHeight";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { AddressForm } from "@/components/account/addresses/AddressForm";
import { CheckoutSteps } from "./CheckoutSteps";
import { OrderSummary } from "./OrderSummary";

const METHOD: Record<PaymentMethod, { label: string; note: string }> = {
  cod: { label: "Cash on Delivery", note: "Pay cash when your order arrives." },
  bkash: { label: "bKash", note: "Pay safely with bKash." },
  sslcommerz: { label: "SSLCommerz", note: "You'll be redirected to SSLCommerz to pay securely." },
};

/**
 * Checkout flow — faithful port of the design kit (ui_kits/checkout, checkout.md).
 * Three steps (Delivery address → Delivery & payment → Review your order) shown by
 * a step indicator, each in a numbered card, with a sticky order-summary rail on
 * desktop / sticky bar on mobile. Data logic is unchanged: the summary is always
 * the server `quote`, Place sends a persisted Idempotency-Key + expected_total and
 * handles CART_CHANGED / COUPON_INVALID / total-mismatch; COD → confirmation,
 * online → gateway redirect.
 */
export function CheckoutFlow() {
  const router = useRouter();
  const isAuth = !!useAuthStore((s) => s.tokens);
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: savedAddresses } = useAddresses();

  const quote = useQuote();
  const place = usePlaceOrder();

  // The storefront header is sticky and tall (announcement bar + search + nav ≈ 140px),
  // and it varies by breakpoint. Measure it so the summary rail pins BELOW it and the
  // step scroll-into-view clears it — a hard-coded 76px offset hid the rail's top and
  // landed scrolled steps under the header.
  const headerH = useHeaderHeight();
  // Fall back to a sane offset until the first measurement (SSR / pre-hydration).
  const stickyTop = (headerH || 140) + 12;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Furthest step the shopper has advanced to — bounds the tappable indicator so they can jump
  // back to a reached step (or forward to one already unlocked) but never skip ahead unvalidated.
  const [maxReached, setMaxReached] = useState<1 | 2 | 3>(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [guest, setGuest] = useState<GuestForm>(EMPTY_GUEST);
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [addrFormOpen, setAddrFormOpen] = useState(false);
  // Set the moment a placement succeeds: the place handler empties the cart, so
  // without this the empty-cart guard below would race the confirmation redirect.
  const [placed, setPlaced] = useState(false);

  // Default the saved-address selection to the customer's default.
  useEffect(() => {
    if (isAuth && !selectedAddressId && savedAddresses && savedAddresses.length > 0) {
      const def = savedAddresses.find((a) => a.is_default) ?? savedAddresses[0];
      setSelectedAddressId(def.id);
    }
  }, [isAuth, savedAddresses, selectedAddressId]);

  // Redirect an empty/invalid cart to /cart — but NOT right after a placement.
  useEffect(() => {
    if (placed) return;
    if (!cartLoading && cart && cart.items.length === 0) {
      toast("Your cart is empty.", "error");
      router.replace("/cart");
    }
  }, [cartLoading, cart, router, placed]);

  const currentAddress: CheckoutAddress | null = useMemo(() => {
    if (isAuth && selectedAddressId) return { address_id: selectedAddressId };
    if (!isAuth && guestValid(guest)) {
      return {
        recipient_name: guest.full_name,
        // Backend stores/matches E.164 (+8801…); the field holds a local BD number.
        recipient_phone: toE164(guest.phone),
        address_line: guest.landmark ? `${guest.street} (${guest.landmark})` : guest.street,
        area: guest.upazila,
        district: guest.district,
        division: guest.division,
        postal_code: guest.postal_code || undefined,
      };
    }
    return null;
  }, [isAuth, selectedAddressId, guest]);

  // Re-quote whenever the address, method, OR the applied coupon changes. The summary total comes from
  // the server quote (which now includes the coupon discount), so applying/removing a coupon — which
  // refetches the cart and flips `applied_coupon` — must re-run the quote or the Total would stay stale.
  const couponCode = cart?.applied_coupon?.code ?? null;
  const couponDiscount = cart?.applied_coupon?.discount ?? null;
  useEffect(() => {
    if (!currentAddress) return;
    setStepError(null);
    quote.mutate(
      { address: currentAddress, payment_method: method },
      {
        onSuccess: (data) => setQuoteData(data as QuoteResponse),
        onError: (err) => {
          setQuoteData(null);
          if (err instanceof ApiError && err.status === 400) {
            setStepError("We don't deliver to this area yet. Try another address.");
          } else if (err instanceof ApiError && err.status === 409) {
            setStepError("Cash on delivery isn't available for this area.");
          } else {
            setStepError("Couldn't calculate your order. Try again.");
          }
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(currentAddress), method, couponCode, couponDiscount]);

  const guestPayload = () =>
    !isAuth ? { full_name: guest.full_name, phone: toE164(guest.phone), email: guest.email || undefined } : null;

  function afterPlace(res: Awaited<ReturnType<typeof place.mutateAsync>>) {
    clearIdempotencyKey();
    setPlaced(true);
    if (res.payment.action === "redirect" && res.payment.redirect_url) {
      window.location.href = res.payment.redirect_url;
    } else {
      router.push(`/orders/${res.order.order_no}/confirmation`);
    }
  }

  async function onPlace() {
    if (!currentAddress || !quoteData?.summary.grand_total) return;
    const idempotencyKey = getOrCreateIdempotencyKey();
    try {
      afterPlace(
        await place.mutateAsync({
          address: currentAddress,
          payment_method: method,
          guest: guestPayload(),
          customer_note: note,
          expected_total: quoteData.summary.grand_total,
          idempotencyKey,
        }),
      );
    } catch (err) {
      if (err instanceof ApiError && err.code === "CART_CHANGED") {
        const ok = window.confirm("Some items in your cart changed. Place the order with the updated prices?");
        if (ok) {
          try {
            afterPlace(
              await place.mutateAsync({
                address: currentAddress,
                payment_method: method,
                guest: guestPayload(),
                customer_note: note,
                expected_total: quoteData.summary.grand_total,
                acknowledge_changes: true,
                idempotencyKey,
              }),
            );
          } catch {
            toast("Couldn't place your order. Please try again.", "error");
          }
        }
      } else if (err instanceof ApiError && err.code === "COUPON_INVALID") {
        toast("Your coupon is no longer valid — remove or replace it.", "error");
      } else if (err instanceof ApiError && (err.status === 422 || err.code === "TOTAL_MISMATCH")) {
        try {
          const fresh = (await quote.mutateAsync({ address: currentAddress, payment_method: method })) as QuoteResponse;
          setQuoteData(fresh);
          if (!fresh.summary.grand_total) throw new Error("no total");
          afterPlace(
            await place.mutateAsync({
              address: currentAddress,
              payment_method: method,
              guest: guestPayload(),
              customer_note: note,
              expected_total: fresh.summary.grand_total,
              idempotencyKey,
            }),
          );
        } catch {
          toast("Your total changed — we've refreshed it. Please review and place again.", "error");
        }
      } else {
        toast("Couldn't place your order. Please try again.", "error");
      }
    }
  }

  if (cartLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-surface-100" />;
  }

  const addresses = savedAddresses ?? [];
  const codAvailable = quoteData?.cod_available ?? true;
  const methods = quoteData?.payment_methods ?? ["cod", "bkash", "sslcommerz"];
  const hasAddress = !!currentAddress;
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;

  // `step` is the active step. Desktop (≥880px) shows all three cards stacked at once (kit
  // behaviour) and `step` just drives the indicator highlight + the scroll target. Mobile is a
  // step-by-step wizard: only the active card renders, so `step` also controls which card shows.
  // `goToStep` moves to step `n` in both directions (Continue forward, Back / "Change" / tapping
  // a reached indicator backward) and brings it into view — scroll to the card on desktop, to the
  // top on mobile (where switching cards means the page should start at the new step).
  function goToStep(n: 1 | 2 | 3) {
    setStep(n);
    setMaxReached((prev) => (n > prev ? n : prev));
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 879px)").matches;
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(`co-step-${n}`);
    if (el) {
      // Offset by the sticky header so the target card lands below it, not under it.
      const top = el.getBoundingClientRect().top + window.scrollY - stickyTop;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  return (
    <>
      <CheckoutSteps active={step} maxReached={maxReached} onStep={goToStep} />

      <div className="grid grid-cols-1 items-start gap-8 pb-12 pt-6 min-[880px]:grid-cols-[1fr_360px]">
        <div className="space-y-[18px]">
          {/* ───── Step 1 — Delivery address ───── */}
          <Card num={1} title="Delivery address" step={step} anchorId="co-step-1">
            {isAuth ? (
              <>
                {addresses.length > 0 ? (
                  <ul className="space-y-2.5">
                    {addresses.map((a) => (
                      <li key={a.id}>
                        <AddressRadio
                          address={a}
                          checked={selectedAddressId === a.id}
                          onSelect={() => setSelectedAddressId(a.id)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-body-sm text-text-muted">No saved addresses yet — add one to continue.</p>
                )}
                <button
                  type="button"
                  onClick={() => setAddrFormOpen(true)}
                  className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-50"
                >
                  <Icon name="plus" size={18} aria-hidden="true" /> Add new address
                </button>
              </>
            ) : (
              <>
                <p className="mb-3 flex items-start gap-2.5 rounded-md bg-surface-100 px-3.5 py-3 text-[13px] leading-relaxed text-ink">
                  <Icon name="info" size={16} aria-hidden="true" className="mt-px shrink-0" />
                  Checking out as a guest — we&apos;ll create a quick account so you can track your order and reorder faster.
                </p>
                <GuestAddressForm value={guest} onChange={setGuest} />
              </>
            )}

            {/* Optional order note — sits below the address; applies to the whole order. */}
            <div className="mt-4 space-y-1.5">
              <label htmlFor="order-note" className="block text-label font-medium text-ink">
                Order note <span className="ml-1 font-normal text-text-faint">(optional)</span>
              </label>
              <textarea
                id="order-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Delivery instructions or anything we should know (optional)"
                className="w-full rounded-sm border border-border-strong px-3 py-2 text-body text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]"
              />
              <p className="text-right text-xs text-text-faint">{note.length}/500</p>
            </div>

            {stepError && step === 1 && <p role="alert" className="mt-3 text-body-sm text-error">{stepError}</p>}
            <div className="mt-4">
              <StepCta disabled={!hasAddress || quote.isPending} onClick={() => goToStep(2)}>
                Continue to delivery &amp; payment
              </StepCta>
            </div>
          </Card>

          {/* ───── Step 2 — Delivery & payment ───── */}
          <Card num={2} title="Delivery & payment" step={step} anchorId="co-step-2">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-md bg-surface-50 px-3.5 py-3">
              <span className="flex items-center gap-2.5">
                <Icon name="truck" size={18} color="var(--volt-600)" aria-hidden="true" />
                <span className="flex flex-col leading-tight">
                  <span className="text-body-sm font-semibold text-ink">
                    Delivery to {(quoteData?.delivery_zone ?? "your area").replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-text-muted">Standard delivery · 2–4 days</span>
                </span>
              </span>
              <span className="text-body-sm font-bold tabular-nums text-ink">
                {Number(quoteData?.summary.delivery_charge ?? 0) === 0
                  ? "Free"
                  : formatBDT(Number(quoteData?.summary.delivery_charge ?? 0))}
              </span>
            </div>

            <ul className="space-y-2.5">
              {(["cod", "bkash", "sslcommerz"] as PaymentMethod[]).map((m) => {
                const disabled = (m === "cod" && !codAvailable) || !methods.includes(m);
                const codFee = m === "cod" && codAvailable && Number(quoteData?.summary.cod_surcharge ?? 0) > 0;
                return (
                  <li key={m}>
                    <PaymentRadio
                      label={METHOD[m].label}
                      note={
                        m === "cod" && !codAvailable
                          ? "Cash on delivery isn't available for your area."
                          : METHOD[m].note
                      }
                      sub={codFee ? `+${formatBDT(Number(quoteData?.summary.cod_surcharge))} COD fee for your area` : undefined}
                      checked={method === m}
                      disabled={disabled}
                      onSelect={() => setMethod(m)}
                    />
                  </li>
                );
              })}
            </ul>
            {stepError && step === 2 && <p role="alert" className="mt-3 text-body-sm text-error">{stepError}</p>}
            <div className="mt-4">
              <StepCta disabled={!quoteData || quote.isPending} onClick={() => goToStep(3)}>
                Continue to review
              </StepCta>
              <MobileBackLink to={1} onBack={goToStep} />
            </div>
          </Card>

          {/* ───── Step 3 — Review your order ───── */}
          <Card num={3} title="Review your order" step={step} anchorId="co-step-3">
            <ul className="mb-2">
              {cart?.items.map((it) => (
                <li key={it.item_id} className="grid grid-cols-[56px_1fr_auto] gap-3 border-b border-border py-3 last:border-b-0">
                  <span className="aspect-[4/5] w-14 overflow-hidden rounded-sm bg-surface-100">
                    {it.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveMediaUrl(it.image)} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 break-words text-body-sm font-semibold leading-snug text-ink">{it.title}</span>
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {[...Object.entries(it.options).map(([k, v]) => `${cap(k)}: ${v}`), `Qty ${it.quantity}`].join(" · ")}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-body-sm font-bold tabular-nums text-ink">
                    {formatBDT(Number(it.line_total))}
                  </span>
                </li>
              ))}
            </ul>

            {/* Deliver to + Payment */}
            <ReviewBlock label="Deliver to" onChange={() => goToStep(1)}>
              {isAuth && selectedAddress ? (
                <>
                  <p className="text-body-sm text-ink">{selectedAddress.recipient_name} · {selectedAddress.recipient_phone}</p>
                  <p className="text-body-sm text-text-muted">
                    {selectedAddress.address_line}, {selectedAddress.area}, {selectedAddress.district}, {selectedAddress.division}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-body-sm text-ink">{guest.full_name} · {guest.phone}</p>
                  <p className="text-body-sm text-text-muted">
                    {guest.street}, {guest.upazila}, {guest.district}, {guest.division}
                  </p>
                </>
              )}
            </ReviewBlock>
            <ReviewBlock label="Payment" onChange={() => goToStep(2)}>
              <p className="text-body-sm text-ink">{METHOD[method].label}</p>
            </ReviewBlock>

            {stepError && step === 3 && <p role="alert" className="mt-3 text-body-sm text-error">{stepError}</p>}
            <button
              type="button"
              disabled={!hasAddress || !quoteData || place.isPending}
              onClick={onPlace}
              className="mt-[18px] inline-flex h-[52px] w-full items-center justify-center rounded-md bg-volt text-[15px] font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-text-faint"
            >
              {place.isPending ? "Placing your order…" : "Place order"}
            </button>
            <MobileBackLink to={2} onBack={goToStep} />
          </Card>
        </div>

        {/* Desktop summary rail — sticky beside the steps from 880px up; hidden on mobile
            where the fixed bottom bar takes over (kit .co-summary-desktop / .co-sticky).
            Pin below the measured sticky storefront header (not a guessed 76px, which hid
            the card's top under the header), and cap the height to the space left below it
            so a tall summary scrolls internally instead of being clipped. */}
        <aside
          className="hidden min-[880px]:block min-[880px]:sticky min-[880px]:self-start min-[880px]:overflow-y-auto"
          style={{ top: stickyTop, maxHeight: `calc(100vh - ${stickyTop + 16}px)` }}
        >
          <OrderSummary
            summary={quoteData?.summary ?? cart?.summary}
            appliedCode={cart?.applied_coupon?.code ?? null}
            appliedDiscount={cart?.applied_coupon?.discount ?? null}
            quoting={quote.isPending}
            paymentMethod={method}
            onPlace={onPlace}
            placeDisabled={!hasAddress || !quoteData || place.isPending}
            placing={place.isPending}
          />
        </aside>

        {/* Mobile summary card — below the steps under 880px so the coupon + totals stay
            reachable on phones. No Place button here; the fixed sticky bar provides it. */}
        <div className="min-[880px]:hidden">
          <OrderSummary
            summary={quoteData?.summary ?? cart?.summary}
            appliedCode={cart?.applied_coupon?.code ?? null}
            appliedDiscount={cart?.applied_coupon?.discount ?? null}
            quoting={quote.isPending}
            paymentMethod={method}
          />
        </div>
      </div>

      {/* Mobile sticky bar — collapsible summary + Place CTA (kit .co-sticky), below 880px only. */}
      <CheckoutStickyBar
        summary={quoteData?.summary ?? cart?.summary}
        paymentMethod={method}
        cta={{
          label: place.isPending ? "Placing your order…" : "Place order",
          disabled: !hasAddress || !quoteData || place.isPending,
          onClick: onPlace,
        }}
      />

      {/* Add-address drawer (right-side on desktop / bottom sheet on mobile) */}
      <Sheet open={addrFormOpen} onClose={() => setAddrFormOpen(false)} title="Add address" side="right">
        <AddressForm
          onDone={() => setAddrFormOpen(false)}
          onCancel={() => setAddrFormOpen(false)}
        />
      </Sheet>
    </>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---- Guest address form ----

interface GuestForm {
  full_name: string;
  phone: string;
  email: string;
  division: string;
  district: string;
  upazila: string;
  street: string;
  postal_code: string;
  landmark: string;
}
const EMPTY_GUEST: GuestForm = {
  full_name: "", phone: "", email: "", division: "", district: "", upazila: "", street: "", postal_code: "", landmark: "",
};
function guestValid(g: GuestForm): boolean {
  return !!(
    g.full_name &&
    isValidBdNational(g.phone) &&
    g.division &&
    g.district &&
    g.upazila &&
    g.street
  );
}

function GuestAddressForm({ value, onChange }: { value: GuestForm; onChange: (g: GuestForm) => void }) {
  const divisions = useDivisions();
  const districts = useDistricts(value.division || null);
  const areas = useAreas(value.district || null);

  function set<K extends keyof GuestForm>(k: K, v: string) {
    onChange({ ...value, [k]: v });
  }
  // Cascading resets: changing a parent clears the now-invalid children so the address always
  // resolves to a real (division → district → area) the backend can serve.
  function setDivision(v: string) {
    onChange({ ...value, division: v, district: "", upazila: "" });
  }
  function setDistrict(v: string) {
    onChange({ ...value, district: v, upazila: "" });
  }

  const field =
    "h-11 w-full rounded-sm border border-border-strong px-3 text-body text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]";
  const select = field + " bg-white disabled:bg-surface-100 disabled:text-text-faint";

  // Validate only once the shopper has typed something, so the field doesn't shout on an empty form.
  const phoneInvalid = value.phone.length > 0 && !isValidBdNational(value.phone);

  return (
    <div className="space-y-3">
      <p className="text-body-sm text-text-muted">
        No account needed — we&apos;ll use your phone to let you track this order, and you can claim
        these orders later by signing in with the same number.
      </p>
      <p className="text-label text-text-muted">
        Fields marked <span className="text-error" aria-hidden="true">*</span> are required.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GuestField id="g-full-name" label="Full name" required>
          <input id="g-full-name" className={field} placeholder="Full name" value={value.full_name} onChange={(e) => set("full_name", e.target.value)} autoComplete="name" aria-required />
        </GuestField>
        <GuestField id="g-phone" label="Phone" required>
          <input
            id="g-phone"
            className={field + (phoneInvalid ? " border-error focus:border-error focus:shadow-none" : "")}
            placeholder="01XXXXXXXXX"
            value={value.phone}
            onChange={(e) => set("phone", normalizeNationalDigits(e.target.value))}
            inputMode="numeric"
            autoComplete="tel-national"
            aria-required
            aria-invalid={phoneInvalid}
          />
          {phoneInvalid && (
            <p role="alert" className="mt-1 text-body-sm text-error">
              Enter a valid Bangladeshi mobile number, e.g. 01712345678.
            </p>
          )}
        </GuestField>
        <GuestField id="g-email" label="Email" optional>
          <input id="g-email" type="email" className={field} placeholder="you@example.com" value={value.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
        </GuestField>

        <GuestField id="g-division" label="Division" required>
          <select id="g-division" className={select} value={value.division} onChange={(e) => setDivision(e.target.value)} aria-required>
            <option value="">{divisions.isLoading ? "Loading divisions…" : "Select division"}</option>
            {divisions.data?.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </GuestField>

        <GuestField id="g-district" label="District" required>
          <select id="g-district" className={select} value={value.district} onChange={(e) => setDistrict(e.target.value)} disabled={!value.division} aria-required>
            <option value="">{districts.isLoading ? "Loading districts…" : "Select district"}</option>
            {districts.data?.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </GuestField>

        <GuestField id="g-area" label="Area / Thana" required>
          <select id="g-area" className={select} value={value.upazila} onChange={(e) => set("upazila", e.target.value)} disabled={!value.district} aria-required>
            <option value="">{areas.isLoading ? "Loading areas…" : "Select area / thana"}</option>
            {areas.data?.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </GuestField>
      </div>
      <GuestField id="g-street" label="Street address" required>
        <input id="g-street" className={field} placeholder="House, road, block" value={value.street} onChange={(e) => set("street", e.target.value)} autoComplete="street-address" aria-required />
      </GuestField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GuestField id="g-postal" label="Postal code" optional>
          <input id="g-postal" className={field} placeholder="Postal code" value={value.postal_code} onChange={(e) => set("postal_code", e.target.value)} inputMode="numeric" />
        </GuestField>
        <GuestField id="g-landmark" label="Landmark" optional>
          <input id="g-landmark" className={field} placeholder="Nearby landmark" value={value.landmark} onChange={(e) => set("landmark", e.target.value)} />
        </GuestField>
      </div>
    </div>
  );
}

/** Labelled wrapper for the guest address inputs — marks each field required (*) or optional. */
function GuestField({
  id,
  label,
  required,
  optional,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-label font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-error" aria-hidden="true">*</span>}
        {optional && <span className="ml-1 font-normal text-text-faint">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * Numbered step card (kit .co-card). Has a scroll anchor so Continue/Change can jump to it.
 * Desktop (≥880px) shows every card stacked at once (kit behaviour). On mobile the checkout
 * is a step-by-step wizard, so a card renders only when it's the active step (`num === step`);
 * `min-[880px]:block` keeps all cards visible on desktop regardless of `step`.
 */
function Card({
  num,
  title,
  step,
  anchorId,
  children,
}: {
  num: 1 | 2 | 3;
  title: string;
  step: 1 | 2 | 3;
  anchorId: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={anchorId}
      className={
        "scroll-mt-20 rounded-lg border border-border bg-white p-5 min-[880px]:block " +
        (num === step ? "block" : "hidden")
      }
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-ink text-[13px] font-bold text-white">{num}</span>
        <h2 className="text-[18px] font-extrabold tracking-snug text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/**
 * Mobile-only "Back" link for the step-by-step wizard (<880px). Returns to the previous step;
 * hidden on desktop where every card is already visible and the indicator handles navigation.
 */
function MobileBackLink({ to, onBack }: { to: 1 | 2 | 3; onBack: (n: 1 | 2 | 3) => void }) {
  return (
    <button
      type="button"
      onClick={() => onBack(to)}
      className="mt-3 inline-flex w-full items-center justify-center gap-1 text-body-sm font-semibold text-text-muted transition-colors duration-micro ease-out hover:text-ink min-[880px]:hidden"
    >
      <Icon name="chevron-left" size={16} aria-hidden="true" /> Back
    </button>
  );
}

function StepCta({ disabled, onClick, children }: { disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-volt text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-text-faint"
    >
      {children}
    </button>
  );
}

/**
 * Kit radio dot (.co-radio-dot): 20px ring; when selected, a 10px volt core
 * with a 1px ink halo. Replaces the native radio so address/payment cards match
 * the design exactly. The real <input> stays for a11y but is visually hidden.
 */
function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] " +
        (checked ? "border-ink" : "border-border-strong")
      }
    >
      {checked && <span className="h-2.5 w-2.5 rounded-full bg-volt shadow-[0_0_0_1px_var(--ink-900)]" />}
    </span>
  );
}

/** Saved-address radio card (design .co-radio). */
function AddressRadio({ address, checked, onSelect }: { address: AddressDto; checked: boolean; onSelect: () => void }) {
  return (
    <label
      className={
        "flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-[border-color,box-shadow] duration-micro ease-out " +
        (checked ? "border-ink shadow-[inset_0_0_0_1px_var(--ink-900)]" : "border-border-strong hover:border-ink")
      }
    >
      <input type="radio" name="address" checked={checked} onChange={onSelect} className="sr-only" />
      <RadioDot checked={checked} />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-body-sm font-bold text-ink">{address.recipient_name}</span>
          <span className="text-body-sm text-text-muted">{address.recipient_phone}</span>
          {address.is_default && (
            <span className="rounded-sm bg-surface-100 px-1.5 py-0.5 text-[11px] font-semibold text-text-muted">Default</span>
          )}
        </span>
        <span className="mt-0.5 block text-body-sm text-text-muted">
          {address.address_line}, {address.area}, {address.district}, {address.division}
        </span>
      </span>
    </label>
  );
}

/** Payment-method radio card (design .co-radio). */
function PaymentRadio({
  label,
  note,
  sub,
  checked,
  disabled,
  onSelect,
}: {
  label: string;
  note: string;
  sub?: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={
        "flex gap-3 rounded-md border p-3.5 transition-[border-color,box-shadow] duration-micro ease-out " +
        (disabled
          ? "cursor-not-allowed border-border bg-surface-50 opacity-60"
          : checked
            ? "cursor-pointer border-ink shadow-[inset_0_0_0_1px_var(--ink-900)]"
            : "cursor-pointer border-border-strong hover:border-ink")
      }
    >
      <input type="radio" name="method" checked={checked} disabled={disabled} onChange={onSelect} className="sr-only" />
      <RadioDot checked={checked} />
      <span className="min-w-0">
        <span className="block text-body-sm font-bold text-ink">{label}</span>
        <span className="block text-body-sm text-text-muted">{note}</span>
        {sub && <span className="mt-0.5 block text-xs font-semibold text-[#B45309]">{sub}</span>}
      </span>
    </label>
  );
}

/**
 * Mobile sticky bottom bar (kit .co-sticky) — fixed, blurred, shown only below
 * 880px. Tapping the row toggles a compact summary; the CTA reflects the current
 * step (Continue… on 1–2, Place order on 3) so the primary action is always reachable
 * without scrolling to the rail.
 */
function CheckoutStickyBar({
  summary,
  paymentMethod,
  cta,
}: {
  summary?: CartSummary | null;
  paymentMethod: PaymentMethod;
  cta: { label: string; disabled?: boolean; onClick: () => void };
}) {
  const [open, setOpen] = useState(false);
  const num = (v?: string | null) => (v ? Number(v) || 0 : 0);
  const total = summary?.grand_total;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md min-[880px]:hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between pb-2.5 pt-1"
      >
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
          Order summary <Icon name={open ? "chevron-down" : "chevron-up"} size={16} aria-hidden="true" />
        </span>
        <span className="text-[18px] font-extrabold tabular-nums text-ink">
          {total == null ? "—" : formatBDT(num(total))}
        </span>
      </button>

      {open && (
        <div className="mb-2.5 border-b border-border pb-2.5">
          <SummaryRows summary={summary} paymentMethod={paymentMethod} />
        </div>
      )}

      <button
        type="button"
        disabled={cta.disabled}
        onClick={cta.onClick}
        className="inline-flex h-[52px] w-full items-center justify-center rounded-md bg-volt text-[15px] font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-text-faint"
      >
        {cta.label}
      </button>
    </div>
  );
}

/** Compact summary rows for the mobile sticky bar (kit SummaryRows). */
function SummaryRows({ summary, paymentMethod }: { summary?: CartSummary | null; paymentMethod: PaymentMethod }) {
  const num = (v?: string | null) => (v ? Number(v) || 0 : 0);
  const codFee = num(summary?.cod_surcharge);
  const showCodFee = paymentMethod === "cod" && codFee > 0;
  const row = (label: string, value: string, cls = "font-semibold text-ink") => (
    <div className="flex items-baseline justify-between gap-3 py-[7px] text-body-sm">
      <span className="text-text-muted">{label}</span>
      <span className={"tabular-nums " + cls}>{value}</span>
    </div>
  );
  return (
    <div>
      {row("Subtotal", formatBDT(num(summary?.subtotal)))}
      {num(summary?.discount) > 0 && row("Discount", `− ${formatBDT(num(summary?.discount))}`, "font-semibold text-success")}
      {row(
        "Delivery",
        summary?.delivery_charge == null ? "—" : num(summary?.delivery_charge) === 0 ? "Free" : formatBDT(num(summary?.delivery_charge)),
      )}
      {showCodFee && row("COD fee", formatBDT(codFee))}
      {num(summary?.vat) > 0 && row("VAT (included)", formatBDT(num(summary?.vat)), "font-medium text-text-muted")}
    </div>
  );
}

/** Review summary block with a "Change" link (design DELIVER TO / PAYMENT). */
function ReviewBlock({ label, onChange, children }: { label: string; onChange: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-border py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">{label}</p>
        <div className="mt-1">{children}</div>
      </div>
      <button type="button" onClick={onChange} className="shrink-0 text-body-sm font-bold text-ink underline underline-offset-2 hover:text-volt-600">
        Change
      </button>
    </div>
  );
}
