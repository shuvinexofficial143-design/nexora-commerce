import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import {
  getStoreProfile,
  whatsappUrl,
} from "@/lib/config/store-profile";

export const metadata: Metadata = {
  title: "Contact & Support",
  description: "Contact Nexora for order, delivery, return and refund support.",
};

export default function ContactPage() {
  const store = getStoreProfile();
  const whatsapp = whatsappUrl(store.whatsappNumber);

  return (
    <LegalPage
      eyebrow="Support"
      title={`Contact ${store.displayName}`}
      intro="For order, delivery, cancellation, return or refund help, keep your order number ready so we can verify the request quickly."
      sections={[
        {
          title: "Order support",
          body: (
            <>
              <p>
                Use the same email address you entered at checkout and keep your
                order number ready. You can also check the latest order status
                from the Track Order page without creating an account.
              </p>
            </>
          ),
        },
        {
          title: "Contact details",
          body: (
            <div className="space-y-2">
              {store.supportEmail ? (
                <p>
                  Email:{" "}
                  <a
                    className="font-black text-black underline underline-offset-4"
                    href={`mailto:${store.supportEmail}`}
                  >
                    {store.supportEmail}
                  </a>
                </p>
              ) : null}

              {store.supportPhone ? (
                <p>
                  Phone:{" "}
                  <a
                    className="font-black text-black underline underline-offset-4"
                    href={`tel:${store.supportPhone.replace(/\s/g, "")}`}
                  >
                    {store.supportPhone}
                  </a>
                </p>
              ) : null}

              {whatsapp ? (
                <p>
                  WhatsApp:{" "}
                  <a
                    className="font-black text-black underline underline-offset-4"
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Message support
                  </a>
                </p>
              ) : null}

              {store.businessAddress ? (
                <p>
                  Business address:{" "}
                  <span className="font-black text-black">
                    {store.businessAddress}
                  </span>
                </p>
              ) : null}

              {!store.supportEmail &&
              !store.supportPhone &&
              !store.businessAddress ? (
                <p>
                  Support contact details are being configured. Until they are
                  published, use the order-tracking page to check an existing
                  order.
                </p>
              ) : null}
            </div>
          ),
        },
        {
          title: "Business identity",
          body: (
            <>
              <p>
                {store.legalName || store.displayName}
                {store.gstin ? ` · GSTIN ${store.gstin}` : ""}
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
