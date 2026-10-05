import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Return & Refund Policy" };

export default function ReturnsPolicyPage() {
  return <LegalPage eyebrow="After sales" title="Return & Refund Policy" intro="Eligible returns are reviewed using the order status, product condition and reason supplied with the request." sections={[
    { title: "Return eligibility", body: <><p>Eligible unused products may be requested for return within the period shown on the product or order. Hygiene, personalized, damaged-after-delivery or otherwise excluded items may not qualify.</p></> },
    { title: "Inspection and refund", body: <><p>Approved returns may be inspected before a refund is finalized. Refund amount and restocking treatment are recorded by the store owner in the admin panel.</p></> },
    { title: "Cancellations", body: <><p>Orders may be cancelled before fulfilment reaches a stage where dispatch can no longer be stopped. Inventory reservations are reconciled when an order is cancelled.</p></> },
  ]} />;
}
