"use client";
import { useState, type FormEvent } from "react";

export function DeliveryChecker({ defaultDelivery }: { defaultDelivery: string }) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState(
    defaultDelivery === "Currently unavailable"
      ? "This product is currently unavailable for ordering."
      : "Enter your PIN to validate its format. Courier coverage is not verified here.",
  );
  function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setMessage("Enter a valid six-digit Indian PIN code.");
      return;
    }
    // No integrated courier/pincode serviceability API exists. Never infer
    // delivery coverage or a date from a syntactically valid PIN.
    setMessage("PIN format is valid. Delivery serviceability, charges and timing must be confirmed before ordering; this check does not confirm courier coverage.");
  }
  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">⌖</span>
        <div>
          <h3 className="text-sm font-black">Delivery information</h3>
          <p className="text-xs font-bold text-black/40">Indian PIN format check — not a courier availability promise</p>
        </div>
      </div>
      <form onSubmit={check} className="mt-3 flex gap-2">
        <label htmlFor="product-delivery-pin" className="sr-only">Delivery PIN code</label>
        <input id="product-delivery-pin" inputMode="numeric" maxLength={6} pattern="[0-9]{6}"
          value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
          placeholder="6-digit PIN"
          className="min-w-0 flex-1 rounded-full border border-black/10 bg-[#f7f7f4] px-4 py-2.5 text-sm font-bold outline-none focus:border-black/30" />
        <button type="submit" className="rounded-full bg-black px-4 py-2.5 text-xs font-black text-white">Check</button>
      </form>
      <p role="status" aria-live="polite" className="mt-2 text-xs font-bold leading-5 text-black/55">{message}</p>
    </div>
  );
}
