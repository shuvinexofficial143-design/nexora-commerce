import type { CatalogProduct } from "@/types/catalog";
import { productImage01 } from "@/lib/product-images-01";
import { productImage02 } from "@/lib/product-images-02";
import { productImage03 } from "@/lib/product-images-03";
import { productImage04 } from "@/lib/product-images-04";
import { productImage05 } from "@/lib/product-images-05";
import { productImage06 } from "@/lib/product-images-06";
import { productImage07 } from "@/lib/product-images-07";
import { productImage08 } from "@/lib/product-images-08";
import { productImage09 } from "@/lib/product-images-09";
import { productImage10 } from "@/lib/product-images-10";
import { productImage11 } from "@/lib/product-images-11";
import { productImage12 } from "@/lib/product-images-12";
import { productImage13 } from "@/lib/product-images-13";
import { productImage14 } from "@/lib/product-images-14";
import { productImage15 } from "@/lib/product-images-15";
import { productImage16 } from "@/lib/product-images-16";

const products = [
  ["pg_001", "royal-singhasan-ganesh", "Royal Singhasan Ganesh", 272, productImage01, "royal", ["royal", "singhasan", "decorative", "ganesh"]],
  ["pg_002", "pearl-crown-mini-ganesh", "Pearl Crown Mini Ganesh", 299, productImage02, "pearl-mini", ["pearl", "mini", "crown", "ganesh"]],
  ["pg_003", "pearl-halo-mini-ganesh", "Pearl Halo Mini Ganesh", 307, productImage03, "pearl-mini", ["pearl", "halo", "mini", "ganesh"]],
  ["pg_004", "lotus-backdrop-ganesh", "Lotus Backdrop Ganesh", 297, productImage04, "lotus", ["lotus", "decorative", "pink", "ganesh"]],
  ["pg_005", "peacock-pearl-ganesh", "Peacock Pearl Ganesh", 320, productImage05, "pearl-mini", ["peacock", "pearl", "mini", "ganesh"]],
  ["pg_006", "pearl-basket-ganesh", "Pearl Basket Ganesh", 299, productImage06, "pearl-mini", ["pearl", "basket", "mini", "ganesh"]],
  ["pg_007", "bal-modak-ganesh-blue", "Bal Modak Ganesh — Blue", 346, productImage07, "bal-ganesh", ["bal", "modak", "blue", "ganesh"]],
  ["pg_008", "bal-modak-ganesh-traditional", "Bal Modak Ganesh — Traditional", 399, productImage08, "bal-ganesh", ["bal", "modak", "traditional", "ganesh"]],
  ["pg_009", "dancing-flute-ganesh", "Dancing Flute Ganesh", 249, productImage09, "decorative", ["dancing", "flute", "decorative", "ganesh"]],
  ["pg_010", "classic-lotus-seat-ganesh", "Classic Lotus Seat Ganesh", 410, productImage10, "lotus", ["lotus", "classic", "seat", "ganesh"]],
  ["pg_011", "bright-lotus-ganesh", "Bright Lotus Ganesh", 499, productImage11, "lotus", ["lotus", "bright", "decorative", "ganesh"]],
  ["pg_012", "heritage-flute-ganesh", "Heritage Flute Ganesh", 445, productImage12, "decorative", ["flute", "heritage", "decorative", "ganesh"]],
  ["pg_013", "royal-yellow-lotus-ganesh", "Royal Yellow Lotus Ganesh", 612, productImage13, "royal", ["royal", "yellow", "lotus", "ganesh"]],
  ["pg_014", "mushak-vahan-ganesh", "Mushak Vahan Ganesh", 240, productImage14, "traditional", ["mushak", "vahan", "traditional", "ganesh"]],
  ["pg_015", "natural-eco-ganesh-6-inch", "Natural Eco Ganesh — 6 inch", 285, productImage15, "eco", ["eco-friendly", "natural", "6-inch", "water-dissolvable", "ganesh"]],
  ["pg_016", "classic-yellow-lotus-ganesh", "Classic Yellow Lotus Ganesh", 560, productImage16, "lotus", ["yellow", "lotus", "classic", "ganesh"]],
] as const;

export const catalogProducts: CatalogProduct[] = products.map(([id, slug, name, price, image, category, tags], index) => ({
  id,
  slug,
  name,
  brand: "Prakriti Ganesh",
  category,
  price,
  rating: 0,
  reviews: 0,
  badge: index < 4 ? "Festival Pick" : index === 14 ? "Eco Pick" : undefined,
  image,
  colors: ["As shown"],
  stock: "in-stock",
  inventory: 1,
  delivery: "Festival delivery",
  popularity: 100 - index,
  createdAt: `2026-09-${String(index + 1).padStart(2, "0")}`,
  tags: [...tags, "cod", "festival"],
}));
