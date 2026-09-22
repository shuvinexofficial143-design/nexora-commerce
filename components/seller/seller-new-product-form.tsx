"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createMySellerProduct } from "@/lib/api/seller-products-client";

export function SellerNewProductForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const created = await createMySellerProduct({
        name: String(data.get("name") ?? ""),
        sku: String(data.get("sku") ?? ""),
        price: Number(data.get("price")),
        description: String(data.get("description") ?? ""),
      });

      form.reset();
      setMessage(`${created.sku} created as Draft.`);
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setError("");
          setMessage("");
        }}
        className="rounded-full bg-black px-5 py-3 text-sm font-black text-white"
      >
        {open ? "Close" : "+ New product"}
      </button>

      {message ? (
        <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">
          {message}
        </span>
      ) : null}

      {open ? (
        <form
          onSubmit={submit}
          className="w-full min-w-0 rounded-[26px] border border-black/10 bg-white p-4 shadow-sm sm:w-[460px]"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/45">
                Product name
              </span>
              <input
                name="name"
                required
                minLength={2}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/45">
                SKU
              </span>
              <input
                name="sku"
                required
                minLength={3}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold uppercase outline-none"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/45">
                Price
              </span>
              <input
                name="price"
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                required
                className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/45">
                Description
              </span>
              <textarea
                name="description"
                required
                minLength={10}
                rows={4}
                className="w-full resize-none rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none"
              />
            </label>
          </div>

          <p className="mt-3 text-xs font-bold leading-5 text-black/45">
            New listings are created as Draft so incomplete products never appear in the public store.
          </p>

          {error ? (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
              {error}
            </p>
          ) : null}

          <button
            disabled={busy}
            className="mt-4 w-full rounded-full bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create draft product"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
