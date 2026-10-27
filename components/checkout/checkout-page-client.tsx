"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import { clearCheckoutAttempt, submitBackendOrder, readPendingOnlineOrder, rememberPendingOnlineOrder, clearPendingOnlineOrder } from "@/lib/api/orders-client";
import { checkoutIntentSignature, checkoutIntentDigest, verifiedCheckoutOrderItems, type PendingOnlineOrder } from "@/lib/commerce/checkout-submission";
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
  const [pendingOnlineOrder, setPendingOnlineOrder] = useState<PendingOnlineOrder | null>(null);
  const placingRef = useRef(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) setPendingOnlineOrder(readPendingOnlineOrder()); });
    return () => { active = false; };
  }, []);
  const [lastPreview, setLastPreview] = useState<{ key: string; quote: CheckoutPreview } | null>(null);
  const [previewError, setPreviewError] = useState<{ key: string; error: string } | null>(null);
  const previewKey = useMemo(() => JSON.stringify({
    items: lines.map(line => [line.slug, line.quantity, line.price, line.lineId, line.choices]),
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
  // Updates after user changes are compared following every async checkout step.
  const intent = useMemo(() => checkoutIntentSignature({
    lines, coupon, deliveryId, paymentId, email: contactEmail, address,
  }), [lines, coupon, deliveryId, paymentId, contactEmail, address]);
  const latestIntent = useRef(intent);
  useEffect(() => { latestIntent.current = intent; }, [intent]);

  async function resumePendingOnlinePayment() {
    if (placingRef.current) return;
    const existing = pendingOnlineOrder ?? readPendingOnlineOrder();
    if (!existing) return;
    placingRef.current = true;
    setPlacing(true);
    setSubmitError("");
    try {
      const paymentSession = await createCashfreeSession(existing.orderNumber, existing.email);
      await openCashfreeCheckout(paymentSession);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Could not resume online payment.");
    } finally {
      placingRef.current = false;
      setPlacing(false);
    }
  }
  function beginSeparateCheckout() {
    if (placingRef.current) return;
    // This does not cancel or release the original order; only clears the
    // browser's recovery shortcut after explicit customer action.
    clearPendingOnlineOrder();
    clearCheckoutAttempt();
    setPendingOnlineOrder(null);
    setSubmitError("Previous online order remains in order tracking. This is a separate checkout.");
  }
  const pendingNotice = pendingOnlineOrder ? (
    <section role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <p className="font-black">An online order already exists: {pendingOnlineOrder.orderNumber}</p>
      <p className="mt-2 text-black/70">Payment may still be pending. Resume payment on this order, or check its status before placing a separate order.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={placing} onClick={() => void resumePendingOnlinePayment()}
          className="rounded-full bg-black px-4 py-2 font-black text-white disabled:opacity-50">Resume existing payment</button>
        <Link href="/track-order" className="font-bold underline underline-offset-2">Track order</Link>
        <button type="button" disabled={placing} onClick={beginSeparateCheckout}
          className="rounded-full border border-black/20 px-3 py-2 font-bold disabled:opacity-50">Start separate checkout</button>
      </div>
    </section>
  ) : null;

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-16 font-bold text-black/50 sm:px-6 lg:px-8">
        Preparing secure checkout…
      </div>
    );
  }

  if (!lines.length) return <div className="mx-auto max-w-7xl space-y-4 px-4 pt-8">
    {pendingNotice}
    <CheckoutEmpty />
    {submitError ? <p role="alert" className="text-sm font-bold text-red-700">{submitError}</p> : null}
  </div>;

  const addAddress = (next: CheckoutAddress) => {
    setAddresses((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    setAddressId(next.id);
    setSubmitError("");
  };

  const placeOrder = async () => {
    // React setState is async; ref blocks two clicks within the same frame.
    if (placingRef.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setSubmitError("Enter a valid email address for order updates.");
      return;
    }
    if (!address) {
      setSubmitError("Add a delivery address before placing the order.");
      return;
    }

    placingRef.current = true;
    setPlacing(true);
    setSubmitError("");
    // Freeze an immutable purchase intent before the first awaited operation.
    const intentAtClick = intent;
    const linesAtClick = lines.map(line => ({ ...line,
      choices: line.choices ? { ...line.choices } : undefined }));
    const addressAtClick = { ...address };
    const couponAtClick = coupon;
    const emailAtClick = contactEmail;
    const paymentAtClick = paymentId;
    const deliveryAtClick = delivery;
    const isUnchanged = () => {
      if (latestIntent.current !== intentAtClick) {
        throw new Error("Your cart or checkout details changed during verification. Review and submit again.");
      }
    };

    try {
      const digest = await checkoutIntentDigest(intentAtClick);
      isUnchanged();
      const pending = pendingOnlineOrder ?? readPendingOnlineOrder();
      if (pending) {
        if (paymentAtClick !== "cashfree" || pending.digest !== digest || pending.email !== emailAtClick) {
          throw new Error("An earlier online order already exists. Resume or track it, or explicitly start a separate checkout.");
        }
        // Crucially: a persisted online order already has reserved stock.
        // Never create a second order during payment-session retries.
        const paymentSession = await createCashfreeSession(pending.orderNumber, pending.email);
        await openCashfreeCheckout(paymentSession);
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

      // Refresh the exact captured cart before submitting, not live mutable
      // component state. The DB order transaction still rechecks all stock.
      const refreshed = await fetchCheckoutPreview(checkoutPreviewRequest(linesAtClick, couponAtClick, "standard"));
      isUnchanged();
      if (!refreshed.valid || refreshed.changedPrice ||
          checkoutPreviewSignature(refreshed) !== checkoutPreviewSignature(preview)) {
        setLastPreview({ key: previewKey, quote: refreshed });
        throw new Error("Cart price or stock changed. Please review the updated checkout before ordering.");
      }
      const items = verifiedCheckoutOrderItems(linesAtClick, refreshed);
      isUnchanged();

      const order = await submitBackendOrder({
        items,
        shippingAddress: {
          fullName: addressAtClick.fullName,
          phone: addressAtClick.phone,
          line1: addressAtClick.line1,
          city: addressAtClick.city,
          state: addressAtClick.state,
          postalCode: addressAtClick.postalCode,
          country: addressAtClick.country,
        },
        paymentMethod: paymentAtClick,
        deliveryMethod: deliveryAtClick.id,
        contactEmail: emailAtClick,
        coupon: couponAtClick || undefined,
        notes: emailAtClick ? `Checkout contact: ${emailAtClick}` : undefined,
      });

      // The DB order now exists. Never mask success because sessionStorage is
      // blocked, nor destroy items that the customer added meanwhile.
      try {
        sessionStorage.setItem("nexora-last-order", JSON.stringify({
          orderId: order.orderNumber, email: emailAtClick,
          deliveryLabel: deliveryAtClick.label, paymentId: paymentAtClick,
          itemCount: linesAtClick.reduce((sum, line) => sum + line.quantity, 0),
        }));
      } catch { /* Confirmation route may still read URL order reference. */ }

      if (paymentAtClick === "cashfree") {
        const recovery = { orderNumber: order.orderNumber, email: emailAtClick, digest };
        rememberPendingOnlineOrder(recovery);
        setPendingOnlineOrder(recovery);
        // Payment-session failure leaves the existing order recoverable.
        const paymentSession = await createCashfreeSession(order.orderNumber, emailAtClick);
        await openCashfreeCheckout(paymentSession);
        return;
      }

      clearCheckoutAttempt();
      if (latestIntent.current === intentAtClick) clearCart();
      router.push(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Could not create your order.");
    } finally {
      placingRef.current = false;
      setPlacing(false);
    }
  };
  return (
      <CheckoutShell>
        <CheckoutSteps step={step} onStep={setStep} />
        {pendingNotice}

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div className="space-y-5">
            <div className={placing ? "pointer-events-none opacity-60" : ""} aria-busy={placing}>
              <ContactPanel email={contactEmail} onEmail={setEmail} />
            <AddressSection
              addresses={addresses}
              selectedId={addressId}
              onSelect={setAddressId}
              onAdd={addAddress}
            />
            <DeliverySection options={deliveryOptions} selectedId={deliveryId} onSelect={setDeliveryId} />
            <PaymentSection methods={paymentMethods} selectedId={paymentId} onSelect={setPaymentId} />
            </div>

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
                    .map((line, i) => <p key={line.slug + String(i)} className="text-xs font-bold text-black/60">
                      {line.name} ({Object.entries(line.options).map(([k,v]) => k + ": " + v).join(", ") || "standard"}): current verified price ₹{(line.unitPriceMinor! / 100).toLocaleString("en-IN")} per item
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
