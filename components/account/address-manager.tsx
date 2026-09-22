"use client";

import { FormEvent, useEffect, useState } from "react";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { createMyAddress, deleteMyAddress, fetchMyAddresses } from "@/lib/api/addresses-client";
import type { CheckoutAddress } from "@/types/checkout";

export function AddressManager() {
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    fetchMyAddresses()
      .then((rows) => {
        if (!active) return;
        setAddresses(rows);
        setState("ready");
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Could not load saved addresses.");
        setState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage("");

    try {
      const created = await createMyAddress({
        label: String(data.get("label") || "Home"),
        fullName: String(data.get("name") || ""),
        phone: String(data.get("phone") || ""),
        line1: String(data.get("line1") || ""),
        city: String(data.get("city") || ""),
        state: String(data.get("state") || ""),
        postalCode: String(data.get("pin") || ""),
        country: "India",
      });

      setAddresses((current) => [created, ...current]);
      setOpen(false);
      form.reset();
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save address.");
      setState("error");
    }
  };

  const remove = async (addressId: string) => {
    setMessage("");
    try {
      await deleteMyAddress(addressId);
      setAddresses((current) => current.filter((address) => address.id !== addressId));
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove address.");
      setState("error");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-black/35">Delivery book</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Saved addresses</h1>
          <p className="mt-2 text-sm font-bold text-black/45">Saved securely to your NEXORA account.</p>
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          className="rounded-full bg-black px-5 py-3 text-sm font-black text-white"
        >
          {open ? "Cancel" : "+ Add address"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AccountSidebar />

        <div className="space-y-4">
          {open ? (
            <form onSubmit={add} className="grid gap-3 rounded-[28px] border border-black/10 bg-white p-5 sm:grid-cols-2">
              {[
                ["label", "Label"],
                ["name", "Full name"],
                ["phone", "Phone"],
                ["line1", "Address"],
                ["city", "City"],
                ["state", "State"],
                ["pin", "PIN code"],
              ].map(([name, label]) => (
                <input
                  key={name}
                  name={name}
                  required={name !== "label"}
                  placeholder={label}
                  className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-bold outline-none"
                />
              ))}
              <button className="rounded-2xl bg-black px-4 py-3 text-sm font-black text-white">
                Save address
              </button>
            </form>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
              {message}
            </div>
          ) : null}

          {state === "loading" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((item) => (
                <div key={item} className="h-48 animate-pulse rounded-[28px] bg-black/5" />
              ))}
            </div>
          ) : null}

          {state !== "loading" && addresses.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-8 text-center">
              <h2 className="text-xl font-black">No saved address yet</h2>
              <p className="mt-2 text-sm font-bold text-black/45">Add an address once and reuse it during checkout.</p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-[28px] border border-black/10 bg-white p-5">
                <span className="rounded-full bg-[#d7ff47] px-3 py-1 text-xs font-black">{address.label}</span>
                <h3 className="mt-4 font-black">{address.fullName}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-black/50">
                  {address.line1}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.phone}
                </p>
                <button
                  onClick={() => void remove(address.id)}
                  className="mt-4 text-xs font-black text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
