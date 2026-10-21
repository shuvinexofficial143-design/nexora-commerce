"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { CheckoutShell } from "@/components/checkout/checkout-shell";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { ContactPanel } from "@/components/checkout/contact-panel";
import { AddressSection } from "@/components/checkout/address-section";
import { DeliverySection } from "@/components/checkout/delivery-section";
import { PaymentSection } from "@/components/checkout/payment-section";
import { OrderReview } from "@/components/checkout/order-review";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { CheckoutEmpty } from "@/components/checkout/checkout-empty";
import { deliveryOptions, paymentMethods } from "@/lib/checkout-data";
import { resolveProductSlugs } from "@/lib/api/products-client";
import { clearCheckoutAttempt, submitBackendOrder } from "@/lib/api/orders-client";
import { createCashfreeSession, openCashfreeCheckout } from "@/lib/api/payments-client";
import { checkoutPreviewRequest, checkoutPreviewSignature, fetchCheckoutPreview } from "@/lib/api/checkout-preview-client";
import type { CheckoutPreview } from "@/lib/commerce/checkout-preview";
import type { CheckoutAddress, CheckoutStep, DeliveryOption, PaymentMethodId } from "@/types/checkout";

export function CheckoutPageClient() {
  const router = useRouter();
  const { lines, hydrated, clearCart, coupon, applyVerifiedPrices } = useCart();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [email, setEmail] = useState("");
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [addressId, setAddressId] = useState("");
  const [deliveryId, setDeliveryId] = useState(deliveryOptions[0].id);
  const [paymentId, setPaymentId] = useState<PaymentMethodId>("cod");
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pendingOnlineOrder, setPendingOnlineOrder] = useState<string | null>(null);
  const [lastPreview, setLastPreview] = useState<{ key: string; quote: CheckoutPreview } | null>(null);
  const [previewError, setPreviewError] = useState<{ key: string; error: string } | null>(null);
  const previewKey = useMemo(() => JSON.stringify({
    items: lines.map(line => [line.slug, line.quantity, line.price, line.lineId]),
    coupon, deliveryId,
  }), [lines, coupon, deliveryId]);
  const preview = lastPreview?.key === previewKey ? lastPreview.quote : null;
  const activePreviewError = previewError?.key === previewKey ? previewError.error : "";
  useEffect(() => {
    if (!hydrated || !lines.length) return;
    let active = true;
    void fetchCheckoutPreview(checkoutPreviewRequest(lines, coupon, "standard"))
      .then(quote => { if (active) { setLastPreview({ key: previewKey, quote }); setPreviewError(null); } })
      .catch(error => { if (active) setPreviewError({
        key: previewKey, error: error instanceof Error ? error.message : "Could not verify cart.",
      }); });
    return () => { active = false; };
  }, [hydrated, lines, coupon, previewKey]);


  const delivery = useMemo<DeliveryOption>(
    () => deliveryOptions.find((item) => item.id === deliveryId) ?? deliveryOptions[0],
    [deliveryId],
  );

  const address = addresses.find((item) => item.id === addressId) ?? addresses[0];
  const contactEmail = email.trim().toLowerCase();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-16 font-bold text-black/50 sm:px-6 lg:px-8">
        Preparing secure checkout…
      </div>
    );
  }

  if (!lines.length) return <CheckoutEmpty />;

  const addAddress = (next: CheckoutAddress) => {
    setAddresses((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    setAddressId(next.id);
    setSubmitError("");
  };

  const placeOrder = async () => {
    if (placing) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setSubmitError("Enter a valid email address for order updates.");
      return;
    }

    if (!address) {
      setSubmitError("Add a delivery address before placing the order.");
      return;
    }

    setPlacing(true);
    setSubmitError("");

    try {
      if (paymentId === "cashfree" && pendingOnlineOrder) {
        const paymentSession = await createCashfreeSession(
          pendingOnlineOrder,
          contactEmail,
        );
        await openCashfreeCheckout(paymentSession);
        setPlacing(false);
        return;
      }

      if (!preview) {
        throw new Error(activePreviewError || "Checking live product prices and stock. Please retry.");
      }
      if (!preview.valid) {
        throw new Error(preview.issues[0] || "Some items are unavailable. Please edit your bag.");
      }
      if (preview.changedPrice) {
        throw new Error("An item price has changed. Review and update your bag before placing the order.");
      }
      // Recheck immediately before checkout. Final reservation occurs only
      // inside the existing order transaction.
      const refreshed = await fetchCheckoutPreview(checkoutPreviewRequest(lines, coupon, "standard"));
      if (!refreshed.valid || refreshed.changedPrice ||
          checkoutPreviewSignature(refreshed) !== checkoutPreviewSignature(preview)) {
        setLastPreview({ key: previewKey, quote: refreshed });
        throw new Error("Cart price or stock changed. Please review the updated checkout before ordering.");
      }

      const resolved = await resolveProductSlugs(lines.map((line) => line.slug));
      const bySlug = new Map(resolved.map((product) => [product.slug, product]));

      const unresolved = lines.filter((line) => !bySlug.has(line.slug));
      if (unresolved.length) {
        throw new Error(
          `${unresolved[0].name} is not in the production database yet. Run the NEXORA database seed first.`,
        );
      }

      const order = await submitBackendOrder({
        items: lines.map((line) => ({
          productId: bySlug.get(line.slug)!.id,
          quantity: line.quantity,
          variant: {
            ...(line.color ? { color: line.color } : {}),
            ...(line.size ? { size: line.size } : {}),
            delivery: delivery.id,
          },
        })),
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        },
        paymentMethod: paymentId,
        deliveryMethod: delivery.id,
        contactEmail,
        coupon: coupon || undefined,
        notes: contactEmail ? `Checkout contact: ${contactEmail}` : undefined,
      });

      sessionStorage.setItem(
        "nexora-last-order",
        JSON.stringify({
          orderId: order.orderNumber,
          email: contactEmail,
          deliveryLabel: delivery.label,
          paymentId,
          itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
        }),
      );

      if (paymentId === "cashfree") {
        setPendingOnlineOrder(order.orderNumber);
        const paymentSession = await createCashfreeSession(
          order.orderNumber,
          contactEmail,
        );
        await openCashfreeCheckout(paymentSession);
        setPlacing(false);
        return;
      }

      clearCheckoutAttempt();
      clearCart();
      router.push(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Could not create your order.");
      setPlacing(false);
    }
  };

  return (
      <CheckoutShell>
        <CheckoutSteps step={step} onStep={setStep} />

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div className="space-y-5">
            <ContactPanel email={contactEmail} onEmail={setEmail} />
            <AddressSection
              addresses={addresses}
              selectedId={addressId}
              onSelect={setAddressId}
              onAdd={addAddress}
            />
            <DeliverySection options={deliveryOptions} selectedId={deliveryId} onSelect={setDeliveryId} />
            <PaymentSection methods={paymentMethods} selectedId={paymentId} onSelect={setPaymentId} />

            {submitError ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-800">
                <strong>Order could not be placed.</strong> {submitError}
              </div>
            ) : null}

            <section role="status" className="rounded-[24px] border border-black/10 bg-white p-5">
              <h2 className="text-sm font-black">Live price & stock verification</h2>
              {!preview && !activePreviewError ? <p className="mt-2 text-sm text-black/55">Checking current database prices, availability and delivery charges…</p> : null}
              {activePreviewError ? <p className="mt-2 text-sm font-bold text-red-700">{activePreviewError} Checkout will remain blocked until verification succeeds.</p> : null}
              {preview?.issues.map(issue => <p key={issue} className="mt-2 text-sm font-bold text-red-700">{issue}</p>)}
              {preview?.changedPrice ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm font-black">One or more product prices changed since they were added to your bag.</p>
                  {preview.lines.filter(line => line.changedPrice && line.unitPriceMinor !== null)
                    .map(line => <p key={line.slug} className="text-xs font-bold text-black/60">
                      {line.name}: current verified price ₹{(line.unitPriceMinor! / 100).toLocaleString("en-IN")} per item
                    </p>)}
                  <button type="button" onClick={() => applyVerifiedPrices(preview.lines)}
                    className="rounded-full bg-[#d7ff47] px-5 py-3 text-xs font-black">
                    Accept current prices and update bag
                  </button>
                </div>
              ) : null}
              {preview?.valid && !preview.changedPrice ?
                <p className="mt-2 text-sm font-bold text-emerald-700">Current product prices and available quantities checked. Final stock is reserved only when the order is placed.</p> : null}
              <p className="mt-3 text-xs text-black/50">No payment or stock reservation happens during this check.</p>
            </section>

            <OrderReview lines={lines} address={address} delivery={delivery} paymentId={paymentId} />
          </div>

          <CheckoutSummary
            quote={preview}
            delivery={delivery}
            paymentId={paymentId}
            placing={placing}
            onPlaceOrder={() => void placeOrder()}
            onReview={() => setStep(4)}
          />
        </div>
      </CheckoutShell>
  );
}
