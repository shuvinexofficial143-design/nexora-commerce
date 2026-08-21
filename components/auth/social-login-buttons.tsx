"use client";

import { useState } from "react";

const providers = [{ name: "Google", mark: "G" }, { name: "Apple", mark: "●" }];

export function SocialLoginButtons() {
  const [message, setMessage] = useState("");
  return <div><div className="grid grid-cols-2 gap-3">{providers.map((provider) => <button key={provider.name} type="button" onClick={() => setMessage(`${provider.name} OAuth is ready for provider credentials in the backend phase.`)} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-black/15 bg-white text-sm font-black transition hover:bg-black hover:text-white"><span aria-hidden="true">{provider.mark}</span>{provider.name}</button>)}</div>{message ? <p className="mt-3 text-xs leading-5 text-black/45">{message}</p> : null}</div>;
}
