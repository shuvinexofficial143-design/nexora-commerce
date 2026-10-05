import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <LegalPage eyebrow="Legal" title="Privacy Policy" intro="This page explains the basic information Nexora collects when an order is placed and how that information is used." sections={[
    { title: "Information we collect", body: <><p>We may collect your name, email address, phone number, delivery address, order details and basic technical information required to operate the storefront.</p></> },
    { title: "How we use it", body: <><p>Information is used to process orders, provide delivery or refund updates, prevent misuse, maintain records and improve the shopping experience.</p></> },
    { title: "Payments", body: <><p>When online payments are enabled, sensitive payment credentials are handled by the payment provider. Nexora should not store raw card or UPI credentials.</p></> },
    { title: "Data retention", body: <><p>Order and transaction records may be retained as required for operations, accounting, dispute handling and applicable legal obligations.</p></> },
  ]} />;
}
