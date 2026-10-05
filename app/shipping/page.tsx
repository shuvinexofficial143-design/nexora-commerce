import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Shipping Policy" };

export default function ShippingPage() {
  return <LegalPage eyebrow="Orders" title="Shipping Policy" intro="Delivery timing and charges are shown during checkout before an order is placed." sections={[
    { title: "Delivery options", body: <><p>Nexora may offer standard, express or priority delivery depending on the order and destination. The selected option and charge are recorded with the order.</p></> },
    { title: "Delivery estimates", body: <><p>Estimated delivery times are targets rather than guarantees and can be affected by inventory, courier availability, weather, holidays or address issues.</p></> },
    { title: "Address accuracy", body: <><p>Please provide a complete name, phone number, street address, city, state and PIN code. Delays caused by incomplete or incorrect details may require re-delivery.</p></> },
  ]} />;
}
