import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Contact & Support" };

export default function ContactPage() {
  return <LegalPage eyebrow="Support" title="Contact Nexora" intro="Use the contact information configured for your store when you are ready to publish. Until then, this page serves as the support destination for checkout and policy links." sections={[
    { title: "Order support", body: <><p>Keep your order number ready when asking about delivery, cancellation, return or refund status.</p></> },
    { title: "Business contact", body: <><p>Before public launch, add your final support email, phone/WhatsApp number and business address here.</p></> },
    { title: "Response handling", body: <><p>Order-specific changes should be verified against the admin panel before any fulfilment or refund action is taken.</p></> },
  ]} />;
}
