"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/api/hooks/cart";
import { useAddresses } from "@/lib/api/hooks/useAddresses";
import { useAuthStore } from "@/lib/stores/auth";
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
import { formatBDT } from "@/lib/format";
import { OrderSummary } from "./OrderSummary";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  bkash: "bKash",
  sslcommerz: "Card / Mobile banking (SSLCommerz)",
};

/**
 * Checkout flow (checkout-fe). Address → delivery & payment → review → place.
 * The order summary is always the server `quote` value. Place sends a persisted
 * Idempotency-Key + expected_total and handles CART_CHANGED / COUPON_INVALID /
 * total-mismatch. COD → confirmation; online → gateway redirect.
 *
 * Guest in-flow address entry is supported via the address form; saved-address
 * picker for logged-in customers.
 */
export function CheckoutFlow() {
  const router = useRouter();
  const isAuth = !!useAuthStore((s) => s.tokens);
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: savedAddresses } = useAddresses();

  const quote = useQuote();
  const place = usePlaceOrder();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [guest, setGuest] = useState<GuestForm>(EMPTY_GUEST);
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  // Set the moment a placement succeeds: the place handler empties the cart, so
  // without this the empty-cart guard below would race the confirmation redirect
  // and bounce the user to /cart ("Your cart is empty") instead.
  const [placed, setPlaced] = useState(false);

  // Redirect an empty/invalid cart to /cart with a notice — but NOT after we've
  // just placed an order (that empties the cart on purpose and navigates away).
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
        full_name: guest.full_name,
        phone: guest.phone,
        email: guest.email || undefined,
        division: guest.division,
        district: guest.district,
        upazila: guest.upazila,
        street: guest.street,
        postal_code: guest.postal_code || undefined,
        landmark: guest.landmark || undefined,
      };
    }
    return null;
  }, [isAuth, selectedAddressId, guest]);

  // Re-quote whenever the address or method changes.
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
  }, [JSON.stringify(currentAddress), method]);

  const guestPayload = () =>
    !isAuth ? { full_name: guest.full_name, phone: guest.phone, email: guest.email || undefined } : null;

  function afterPlace(res: Awaited<ReturnType<typeof place.mutateAsync>>) {
    clearIdempotencyKey();
    // Disable the empty-cart guard before navigating — the placement emptied the cart.
    setPlaced(true);
    if (res.payment.action === "redirect" && res.payment.redirect_url) {
      window.location.href = res.payment.redirect_url;
    } else {
      // COD / no-redirect → go straight to the order confirmation page.
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
        // The total drifted (e.g. a qty change after the last quote). Re-quote to get
        // the fresh server total, then retry the placement ONCE automatically with it —
        // otherwise re-clicking just re-sends the same stale total and 422s forever.
        try {
          const fresh = (await quote.mutateAsync({
            address: currentAddress,
            payment_method: method,
          })) as QuoteResponse;
          setQuoteData(fresh);
          if (!fresh.summary.grand_total) throw new Error("no total");
          afterPlace(
            await place.mutateAsync({
              address: currentAddress,
              payment_method: method,
              guest: guestPayload(),
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
    return <div className="h-64 animate-pulse rounded-lg bg-gray-100" />;
  }

  const addresses = savedAddresses ?? [];
  const codAvailable = quoteData?.cod_available ?? true;
  const methods = quoteData?.payment_methods ?? ["cod", "bkash", "sslcommerz"];
  const canPlace = !!currentAddress && !!quoteData && !quote.isPending;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        {/* Step 1 — Address */}
        <section aria-labelledby="step-address">
          <h2 id="step-address" className="mb-3 text-lg font-semibold text-gray-900">1. Delivery address</h2>
          {isAuth ? (
            addresses.length > 0 ? (
              <ul className="space-y-3">
                {addresses.map((a: AddressDto) => (
                  <li key={a.id}>
                    <label className="flex cursor-pointer gap-3 rounded-lg border border-gray-200 p-4 has-[:checked]:border-brand-600 has-[:checked]:ring-1 has-[:checked]:ring-brand-600">
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === a.id}
                        onChange={() => setSelectedAddressId(a.id)}
                        className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium text-gray-900">{a.recipient_name}</span>{" "}
                        <span className="text-gray-500">{a.recipient_phone}</span>
                        <span className="mt-0.5 block text-gray-600">
                          {a.address_line}, {a.area}, {a.district}, {a.division}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No saved addresses.{" "}
                <a href="/account/addresses" className="font-medium text-brand-600 hover:underline">Add one</a>.
              </p>
            )
          ) : (
            <GuestAddressForm value={guest} onChange={setGuest} />
          )}
          {stepError && <p role="alert" className="mt-2 text-sm text-red-600">{stepError}</p>}
        </section>

        {/* Step 2 — Delivery & payment */}
        <section aria-labelledby="step-payment">
          <h2 id="step-payment" className="mb-3 text-lg font-semibold text-gray-900">2. Payment method</h2>
          {quoteData?.delivery_zone && (
            <p className="mb-3 text-sm text-gray-600">
              Delivering to <span className="font-medium">{quoteData.delivery_zone.replace(/_/g, " ")}</span> — delivery {formatBDT(Number(quoteData.summary.delivery_charge ?? 0))}
            </p>
          )}
          <ul className="space-y-3">
            {(["cod", "bkash", "sslcommerz"] as PaymentMethod[]).map((m) => {
              const disabled = (m === "cod" && !codAvailable) || !methods.includes(m);
              return (
                <li key={m}>
                  <label className={"flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 has-[:checked]:border-brand-600 has-[:checked]:ring-1 has-[:checked]:ring-brand-600 " + (disabled ? "opacity-50" : "")}>
                    <input
                      type="radio"
                      name="method"
                      disabled={disabled}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-600"
                    />
                    <span className="text-sm font-medium text-gray-900">{METHOD_LABEL[m]}</span>
                    {m === "cod" && !codAvailable && <span className="text-xs text-gray-500">(not available in this area)</span>}
                    {m === "cod" && codAvailable && Number(quoteData?.summary.cod_surcharge ?? 0) > 0 && (
                      <span className="text-xs text-gray-500">+{formatBDT(Number(quoteData?.summary.cod_surcharge))} fee</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Step 3 — Review + place */}
        <section aria-labelledby="step-review">
          <h2 id="step-review" className="mb-3 text-lg font-semibold text-gray-900">3. Review &amp; place</h2>
          <ul className="space-y-2 rounded-lg border border-gray-200 p-4">
            {cart?.items.map((it) => (
              <li key={it.item_id} className="flex justify-between text-sm">
                <span className="min-w-0 truncate text-gray-700">{it.quantity} × {it.title}</span>
                <span className="shrink-0 font-medium text-gray-900">{formatBDT(Number(it.line_total))}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={!canPlace || place.isPending}
            onClick={onPlace}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {place.isPending ? "Placing order…" : "Place order"}
          </button>
          {!currentAddress && (
            <p className="mt-2 text-xs text-gray-500">Add a delivery address to place your order.</p>
          )}
        </section>
      </div>

      {/* Sticky summary */}
      <div className="lg:sticky lg:top-6 lg:h-max">
        <OrderSummary
          summary={quoteData?.summary ?? cart?.summary}
          appliedCode={cart?.applied_coupon?.code ?? null}
          appliedDiscount={cart?.applied_coupon?.discount ?? null}
          quoting={quote.isPending}
        />
      </div>
    </div>
  );
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
  return !!(g.full_name && g.phone && g.division && g.district && g.upazila && g.street);
}

function GuestAddressForm({ value, onChange }: { value: GuestForm; onChange: (g: GuestForm) => void }) {
  function set<K extends keyof GuestForm>(k: K, v: string) {
    onChange({ ...value, [k]: v });
  }
  const field = "h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">We&apos;ll create a quick account for you to track this order.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={field} placeholder="Full name" value={value.full_name} onChange={(e) => set("full_name", e.target.value)} />
        <input className={field} placeholder="Phone (+8801…)" value={value.phone} onChange={(e) => set("phone", e.target.value)} />
        <input className={field} placeholder="Email (optional)" value={value.email} onChange={(e) => set("email", e.target.value)} />
        <input className={field} placeholder="Division" value={value.division} onChange={(e) => set("division", e.target.value)} />
        <input className={field} placeholder="District" value={value.district} onChange={(e) => set("district", e.target.value)} />
        <input className={field} placeholder="Upazila / Thana" value={value.upazila} onChange={(e) => set("upazila", e.target.value)} />
      </div>
      <input className={field} placeholder="Street address" value={value.street} onChange={(e) => set("street", e.target.value)} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={field} placeholder="Postal code (optional)" value={value.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
        <input className={field} placeholder="Landmark (optional)" value={value.landmark} onChange={(e) => set("landmark", e.target.value)} />
      </div>
    </div>
  );
}
