"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { CheckoutAuthGate } from "@/components/checkout/checkout-auth-gate";
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
import { createMyAddress, fetchMyAddresses } from "@/lib/api/addresses-client";
import { resolveProductSlugs } from "@/lib/api/products-client";
import { submitBackendOrder } from "@/lib/api/orders-client";
import type { CheckoutAddress, CheckoutStep, DeliveryOption, PaymentMethodId } from "@/types/checkout";

export function CheckoutPageClient() {
  const router = useRouter();
  const { lines, hydrated, clearCart, coupon } = useCart();
  const { session } = useAuth();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [email, setEmail] = useState("");
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [addressId, setAddressId] = useState("");
  const [deliveryId, setDeliveryId] = useState(deliveryOptions[0].id);
  const [paymentId, setPaymentId] = useState<PaymentMethodId>("upi");
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const delivery = useMemo<DeliveryOption>(
    () => deliveryOptions.find((item) => item.id === deliveryId) ?? deliveryOptions[0],
    [deliveryId],
  );

  const address = addresses.find((item) => item.id === addressId) ?? addresses[0];

  useEffect(() => {
    if (session?.user.email) {
      setEmail((current) => current || session.user.email);
    }
  }, [session?.user.email]);

  useEffect(() => {
    let active = true;

    fetchMyAddresses()
      .then((rows) => {
        if (!active) return;
        setAddresses(rows);
        setAddressId((current) => current || rows[0]?.id || "");
      })
      .catch((error) => {
        if (!active) return;
        setSubmitError(error instanceof Error ? error.message : "Could not load saved addresses.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-16 font-bold text-black/50 sm:px-6 lg:px-8">
        Preparing secure checkout…
      </div>
    );
  }

  if (!lines.length) return <CheckoutEmpty />;

  const addAddress = async (next: CheckoutAddress) => {
    try {
      const created = await createMyAddress({
        label: next.label,
        fullName: next.fullName,
        phone: next.phone,
        line1: next.line1,
        city: next.city,
        state: next.state,
        postalCode: next.postalCode,
        country: next.country,
      });
      setAddresses((current) => [created, ...current]);
      setAddressId(created.id);
      setSubmitError("");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not save delivery address.");
    }
  };

  const placeOrder = async () => {
    if (placing) return;

    if (!address) {
      setSubmitError("Choose a delivery address before placing the order.");
      return;
    }

    setPlacing(true);
    setSubmitError("");

    try {
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
        coupon: coupon || undefined,
        notes: email ? `Checkout contact: ${email}` : undefined,
      });

      sessionStorage.setItem(
        "nexora-last-order",
        JSON.stringify({
          orderId: order.orderNumber,
          email,
          deliveryLabel: delivery.label,
          paymentId,
          itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
        }),
      );

      clearCart();
      router.push(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Could not create your order.");
      setPlacing(false);
    }
  };

  return (
    <CheckoutAuthGate>
      <CheckoutShell>
        <CheckoutSteps step={step} onStep={setStep} />

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div className="space-y-5">
            <ContactPanel email={email} onEmail={setEmail} />
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

            <OrderReview lines={lines} address={address} delivery={delivery} paymentId={paymentId} />
          </div>

          <CheckoutSummary
            delivery={delivery}
            placing={placing}
            onPlaceOrder={() => void placeOrder()}
            onReview={() => setStep(4)}
          />
        </div>
      </CheckoutShell>
    </CheckoutAuthGate>
  );
}
