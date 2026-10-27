"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

type Suggestion = {
  id: string; slug: string; name: string;
  brand: string | null; category: string | null; priceMinor: number; available: boolean;
};
type LookupState = "idle" | "loading" | "ready" | "unavailable";
const price = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const unique = useId().replaceAll(":", "-");
  const inputId = "site-search-" + unique;
  const listId = "search-suggestions-" + unique;
  const [query, setQuery] = useState(initialQuery);
  const [options, setOptions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [lookupState, setLookupState] = useState<LookupState>("idle");

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/storefront/search/suggestions?q=" + encodeURIComponent(normalized), {
          signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) throw new Error("Suggestions unavailable");
        const payload = await response.json() as { ok: boolean; data?: Suggestion[] };
        if (!payload.ok || !Array.isArray(payload.data)) throw new Error("Invalid suggestions");
        setOptions(payload.data);
        setLookupState("ready");
      } catch {
        if (!controller.signal.aborted) {
          setOptions([]);
          setLookupState("unavailable");
        }
      }
    }, 230);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  const filteredQuery = query.trim();
  const showMenu = open && filteredQuery.length >= 2;
  const visibleOptions = lookupState === "ready" && options.length > 0;

  return (
    <form action="/search" role="search" className="group relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onSubmit={() => setOpen(false)}>
      <label htmlFor={inputId} className="sr-only">Search Nexora</label>
      <input
        id={inputId}
        name="q"
        type="search"
        value={query}
        maxLength={80}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showMenu && visibleOptions}
        role="combobox"
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setActive(-1);
          setOptions([]);
          setLookupState(next.trim().length >= 2 ? "loading" : "idle");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") { setOpen(false); setActive(-1); return; }
          if (!visibleOptions || !showMenu) return;
          if (event.key === "ArrowDown") {
            event.preventDefault(); setActive((index) => Math.min(index + 1, options.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault(); setActive((index) => Math.max(index - 1, -1));
          } else if (event.key === "Enter" && active >= 0) {
            event.preventDefault();
            router.push("/product/" + encodeURIComponent(options[active].slug));
            setOpen(false);
          }
        }}
        placeholder="Search products, brands and categories"
        className="h-11 w-full rounded-full border border-black/10 bg-white pl-5 pr-24 text-sm font-medium outline-none transition placeholder:text-black/35 focus:border-black/30 focus:shadow-[0_0_0_4px_rgba(215,255,71,0.22)]"
      />
      <button type="submit"
        className="absolute right-1.5 top-1.5 h-8 rounded-full bg-[#CDEBFF] px-4 text-xs font-black text-black transition hover:bg-[#B8E1FA]">
        Search
      </button>
      {showMenu ? (
        <div id={listId} role="listbox" aria-label="Product suggestions"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-[70] max-h-[70vh] overflow-y-auto rounded-[22px] border border-black/10 bg-white p-2 shadow-[0_20px_80px_rgba(0,0,0,.16)]">
          {lookupState === "loading" ? (
            <p className="px-4 py-3 text-xs font-bold text-black/50" role="status">Searching products…</p>
          ) : null}
          {lookupState === "unavailable" ? (
            <p className="px-4 py-3 text-xs font-bold text-black/50">Suggestions unavailable. Press Search to see full results.</p>
          ) : null}
          {lookupState === "ready" && options.length === 0 ? (
            <p className="px-4 py-3 text-xs font-bold text-black/50">No products found. Try another keyword.</p>
          ) : null}
          {visibleOptions && options.map((item, index) => (
            <Link key={item.id}
              href={"/product/" + encodeURIComponent(item.slug)}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm transition ${index === active ? "bg-[#eaf7bd]" : "hover:bg-black/5"}`}>
              <span className="min-w-0">
                <span className="block truncate font-black">{item.name}</span>
                <span className="block truncate text-xs text-black/45">{[item.brand, item.category].filter(Boolean).join(" · ")}</span>
                {!item.available ? <span className="block text-xs font-semibold text-amber-700">Currently out of stock</span> : null}
              </span>
              <span className="shrink-0 text-xs font-black">{price.format(item.priceMinor / 100)}</span>
            </Link>
          ))}
          <Link href={"/search?q=" + encodeURIComponent(filteredQuery)}
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl bg-black px-4 py-2.5 text-center text-xs font-black text-white">
            View all results for “{filteredQuery}”
          </Link>
        </div>
      ) : null}
    </form>
  );
}
