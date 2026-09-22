import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/types/catalog";
import type { AiComparisonRow } from "@/types/ai";

export function AiComparisonTable({
  products,
  rows,
}: {
  products: CatalogProduct[];
  rows: AiComparisonRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-[30px] border border-black/10 bg-white">
      <table className="w-full min-w-[850px] border-collapse text-left">
        <thead>
          <tr className="border-b border-black/10 bg-[#f6f6f1]">
            <th className="p-5 text-xs font-black uppercase tracking-[.14em] text-black/40">
              Compare
            </th>
            {products.map((product) => (
              <th key={product.id} className="p-5">
                <Link href={`/product/${product.slug}`} className="block">
                  <div className="relative mb-3 h-24 w-full max-w-40 overflow-hidden rounded-2xl">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-black">{product.name}</span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-black/10 last:border-0">
              <th className="p-5 text-sm font-black">{row.label}</th>
              {row.values.map((value, index) => (
                <td
                  key={`${row.label}-${index}`}
                  className="p-5 text-sm font-bold text-black/65"
                >
                  <span
                    className={
                      row.winner === index
                        ? "rounded-full bg-[#d7ff47] px-3 py-2 text-black"
                        : ""
                    }
                  >
                    {value}
                    {row.winner === index ? "  ✓" : ""}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
