"use client";
import { useMemo, useState } from "react";
import type { ProductOption } from "@/types/product-detail";
type Props = { colors: ProductOption[]; sizes: ProductOption[] };
export function ProductVariantPicker({ colors, sizes }: Props) {
  const [color, setColor] = useState(colors[0]?.value ?? "");
  const [size, setSize] = useState(sizes.find((item) => item.available !== false)?.value ?? "");
  const chosenColor = useMemo(() => colors.find((item) => item.value === color)?.label, [color, colors]);
  return <div className="space-y-5">{colors.length ? <fieldset><div className="flex items-center justify-between"><legend className="text-sm font-black">Colour</legend><span className="text-xs font-bold text-black/45">{chosenColor}</span></div><div className="mt-2 flex flex-wrap gap-2">{colors.map((item) => <button type="button" key={item.value} onClick={() => setColor(item.value)} className={`rounded-full border px-4 py-2 text-xs font-black transition ${color === item.value ? "border-black bg-black text-white" : "border-black/10 bg-white hover:border-black/30"}`}>{item.label}</button>)}</div></fieldset> : null}{sizes.length ? <fieldset><div className="flex items-center justify-between"><legend className="text-sm font-black">Size</legend><button type="button" className="text-xs font-black underline underline-offset-4">Size guide</button></div><div className="mt-2 grid grid-cols-5 gap-2">{sizes.map((item) => <button type="button" key={item.value} disabled={item.available === false} onClick={() => setSize(item.value)} className={`rounded-2xl border px-2 py-3 text-xs font-black transition ${size === item.value ? "border-black bg-black text-white" : "border-black/10 bg-white hover:border-black/30"} disabled:cursor-not-allowed disabled:opacity-25`}>{item.label}</button>)}</div></fieldset> : null}</div>;
}
