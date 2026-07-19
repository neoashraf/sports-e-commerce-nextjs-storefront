"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart, useMergeCart } from "@/lib/api/hooks/cart";
import { useAddresses } from "@/lib/api/hooks/useAddresses";
import { useDivisions, useDistricts, useAreas } from "@/lib/api/hooks/geo";
import { useAuthStore } from "@/lib/stores/auth";
import { useAuthUi } from "@/lib/stores/auth-ui";
import {
  useQuote,
  usePlaceOrder,
  getOrCreateIdempotencyKey,
  clearIdempotencyKey,
} from "@/lib/api/hooks/checkout";
import type { CheckoutAddress, PaymentMethod } from "@/lib/api/schemas/checkout";
import type { QuoteResponse } from "@/lib/api/schemas/checkout";
import type { AddressDto } from "@/lib/api/schemas/auth";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/stores/toast";
import { normalizeNationalDigits, isValidBdNational, toE164 } from "@/lib/auth/phone";
import { formatBDT } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
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
  const mergeCart = useMergeCart();
  const openAuth = useAuthUi((s) => s.openAuth);

  const [step, setStep] = useState<1 | 2 | 3>(1);
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
  // Set when a NOT-logged-in shopper presses "Place order": opens the phone-OTP gate, then the
  // post-login effect merges the guest cart + places. Logged-in shoppers never set it.
  const [pendingAuthPlace, setPendingAuthPlace] = useState(false);

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
    // A selected saved address (signed-in shopper) wins; otherwise the typed details. Independent
    // of auth state on purpose — a guest who verifies their phone mid-checkout keeps their typed
    // address (a new account has no saved address yet, so selectedAddressId stays null).
    if (selectedAddressId) return { address_id: selectedAddressId };
    if (guestValid(guest)) {
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
  }, [selectedAddressId, guest]);

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

  // Keep the post-login effect calling the LATEST onPlace (fresh state), not a stale closure.
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;

  // After a checkout-triggered phone verification (login OR new-account registration), associate the
  // guest cart with the now-authenticated customer, then place. The merge is required: the backend
  // resolves an authed cart by customer_id (empty for a new account), so without it placement would
  // fail CART_EMPTY even though the guest cart still exists under the X-Cart-Token.
  useEffect(() => {
    if (!pendingAuthPlace || !isAuth) return;
    setPendingAuthPlace(false);
    void (async () => {
      try {
        await mergeCart.mutateAsync();
      } catch {
        // Best-effort — a genuine cart problem surfaces in the place call below.
      }
      await onPlaceRef.current();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAuthPlace, isAuth]);

  // "Place order" entry point: a signed-in shopper places directly; a guest must first verify their
  // phone (OTP → new account or login), after which the effect above merges the cart + places.
  function handlePlace() {
    if (!currentAddress || !quoteData?.summary.grand_total) return;
    if (!isAuth) {
      setPendingAuthPlace(true);
      // Reuse the name + phone the shopper already entered on this page — don't ask again.
      openAuth({
        view: "phone",
        prefillName: guest.full_name || undefined,
        prefillPhone: guest.phone || undefined,
      });
      return;
    }
    void onPlace();
  }

  if (cartLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-surface-100" />;
  }

  const addresses = savedAddresses ?? [];
  const codAvailable = quoteData?.cod_available ?? true;
  const methods = quoteData?.payment_methods ?? ["cod", "bkash", "sslcommerz"];
  const hasAddress = !!currentAddress;
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;

  return (
    <>
      <CheckoutSteps active={step} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {/* ───── Step 1 — Delivery address ───── */}
          {step === 1 && (
            <Card num={1} title="Delivery address">
              {isAuth ? (
                <>
                  {addresses.length > 0 ? (
                    <ul className="space-y-3">
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
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-50"
                  >
                    <Icon name="plus" size={16} aria-hidden="true" /> Add new address
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-3 flex items-start gap-2 rounded-md bg-surface-100 px-3.5 py-3 text-body-sm text-ink">
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

              {stepError && <p role="alert" className="mt-3 text-body-sm text-error">{stepError}</p>}
              <StepCta disabled={!hasAddress || quote.isPending} onClick={() => setStep(2)}>
                Continue to delivery &amp; payment
              </StepCta>
            </Card>
          )}

          {/* ───── Step 2 — Delivery & payment ───── */}
          {step === 2 && (
            <Card num={2} title="Delivery & payment" onBack={() => setStep(1)}>
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

              <ul className="space-y-3">
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
              {stepError && <p role="alert" className="mt-3 text-body-sm text-error">{stepError}</p>}
              <StepCta disabled={!quoteData || quote.isPending} onClick={() => setStep(3)}>
                Continue to review
              </StepCta>
            </Card>
          )}

          {/* ───── Step 3 — Review your order ───── */}
          {step === 3 && (
            <Card num={3} title="Review your order" onBack={() => setStep(2)}>
              <ul>
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
              <ReviewBlock label="Deliver to" onChange={() => setStep(1)}>
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
              <ReviewBlock label="Payment" onChange={() => setStep(2)}>
                <p className="text-body-sm text-ink">{METHOD[method].label}</p>
              </ReviewBlock>

              <button
                type="button"
                disabled={!hasAddress || !quoteData || place.isPending || mergeCart.isPending}
                onClick={handlePlace}
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md bg-volt text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-text-faint"
              >
                {place.isPending || mergeCart.isPending
                  ? "Placing your order…"
                  : isAuth
                    ? "Place order"
                    : "Verify phone & place order"}
              </button>
            </Card>
          )}
        </div>

        {/* Sticky summary rail */}
        <aside className="lg:sticky lg:top-5 lg:h-max">
          <OrderSummary
            summary={quoteData?.summary ?? cart?.summary}
            appliedCode={cart?.applied_coupon?.code ?? null}
            appliedDiscount={cart?.applied_coupon?.discount ?? null}
            quoting={quote.isPending}
            paymentMethod={method}
          />
        </aside>
      </div>

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
        We&apos;ll verify your phone with a code before placing the order — you can track it anytime
        by signing in with the same number.
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

/** Numbered step card. */
function Card({
  num,
  title,
  onBack,
  children,
}: {
  num: 1 | 2 | 3;
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-ink text-[13px] font-bold text-white">{num}</span>
        <h2 className="text-[18px] font-extrabold tracking-snug text-ink">{title}</h2>
        {onBack && (
          <button type="button" onClick={onBack} className="ml-auto inline-flex items-center gap-1 text-body-sm font-semibold text-text-muted hover:text-ink">
            <Icon name="chevron-left" size={16} aria-hidden="true" /> Back
          </button>
        )}
      </div>
      {children}
    </section>
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

/** Saved-address radio card (design .co-radio). */
function AddressRadio({ address, checked, onSelect }: { address: AddressDto; checked: boolean; onSelect: () => void }) {
  return (
    <label
      className={
        "flex cursor-pointer gap-3 rounded-md border p-3.5 transition-colors duration-micro ease-out " +
        (checked ? "border-ink ring-1 ring-ink" : "border-border-strong hover:border-ink")
      }
    >
      <input type="radio" name="address" checked={checked} onChange={onSelect} className="mt-1 h-4 w-4 accent-volt" />
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
        "flex cursor-pointer gap-3 rounded-md border p-3.5 transition-colors duration-micro ease-out " +
        (disabled
          ? "cursor-not-allowed border-border bg-surface-50 opacity-60"
          : checked
            ? "border-ink ring-1 ring-ink"
            : "border-border-strong hover:border-ink")
      }
    >
      <input type="radio" name="method" checked={checked} disabled={disabled} onChange={onSelect} className="mt-1 h-4 w-4 accent-volt" />
      <span className="min-w-0">
        <span className="block text-body-sm font-bold text-ink">{label}</span>
        <span className="block text-body-sm text-text-muted">{note}</span>
        {sub && <span className="mt-0.5 block text-xs font-semibold text-[#B45309]">{sub}</span>}
      </span>
    </label>
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
