import { redirect } from "next/navigation";

export default function FlashSalePage() {
  // Do not advertise client-side demo prices as real promotions.
  redirect("/shop?sort=discount");
}
