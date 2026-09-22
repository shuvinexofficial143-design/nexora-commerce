"use client";

import { useState } from "react";
import { updateSellerProfile } from "@/lib/api/seller-client";
import type { SellerAccountProfile } from "@/types/seller";

type EditableProfile = Pick<
  SellerAccountProfile,
  "storeName" | "ownerName" | "phone" | "gstNumber"
>;

export function SellerProfileForm({
  profile,
}: {
  profile: SellerAccountProfile;
}) {
  const [form, setForm] = useState<EditableProfile>({
    storeName: profile.storeName,
    ownerName: profile.ownerName,
    phone: profile.phone,
    gstNumber: profile.gstNumber,
  });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof EditableProfile, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError("");
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const updated = await updateSellerProfile(form);
      setForm({
        storeName: updated.storeName,
        ownerName: updated.ownerName,
        phone: updated.phone,
        gstNumber: updated.gstNumber,
      });
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save seller profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[28px] border border-black/10 bg-white p-5"
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Business profile</h2>
          <p className="text-sm text-black/50">
            Store identity, owner details and GST information.
          </p>
        </div>
        {saved ? (
          <span className="rounded-full bg-[#e9ffe9] px-3 py-1 text-xs font-black text-green-800">
            Saved ✓
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Store name"
          value={form.storeName}
          onChange={(value) => set("storeName", value)}
        />
        <Field
          label="Owner name"
          value={form.ownerName}
          onChange={(value) => set("ownerName", value)}
        />
        <Field label="Account email" value={profile.email} readOnly />
        <Field
          label="Phone"
          value={form.phone}
          onChange={(value) => set("phone", value)}
        />
        <Field
          label="GSTIN"
          value={form.gstNumber}
          onChange={(value) => set("gstNumber", value.toUpperCase())}
        />
        <Field
          label="Commission"
          value={`${(profile.commissionBps / 100).toFixed(2)}%`}
          readOnly
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          disabled={busy}
          className="rounded-full bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
        <span className="rounded-full border border-black/10 px-5 py-3 text-sm font-black text-black/45">
          {profile.verificationStatus} verification
        </span>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/45">
        {label}
      </span>
      <input
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none focus:border-black/30 read-only:text-black/45"
      />
    </label>
  );
}
