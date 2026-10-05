import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return <LegalPage eyebrow="Legal" title="Terms & Conditions" intro="These terms describe the basic rules for using Nexora and placing orders through the storefront." sections={[
    { title: "Orders", body: <><p>An order is accepted subject to product availability, valid contact and delivery information, pricing checks and payment or COD eligibility.</p></> },
    { title: "Pricing and availability", body: <><p>Prices, offers, stock and delivery estimates may change. If a material error is discovered before dispatch, the order may be corrected or cancelled and any eligible payment refunded.</p></> },
    { title: "Acceptable use", body: <><p>Do not misuse the website, attempt unauthorized access, interfere with service operation or place fraudulent orders.</p></> },
    { title: "Changes", body: <><p>Store policies and these terms may be updated as the business, payment methods and fulfilment process evolve.</p></> },
  ]} />;
}
