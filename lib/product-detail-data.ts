import { catalogProducts } from "@/lib/catalog-data";
import type { CatalogProduct } from "@/types/catalog";
import type { ProductDetail, ProductSpecGroup } from "@/types/product-detail";

function categoryLabel(category: string) {
  return category.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function isNaturalEco(product: CatalogProduct) {
  return product.tags.includes("water-dissolvable") || product.tags.includes("natural");
}

function categorySpecs(product: CatalogProduct): ProductSpecGroup[] {
  return [
    {
      title: "Murti details",
      items: [
        { label: "Collection", value: categoryLabel(product.category) },
        { label: "Finish", value: product.colors.join(" / ") || "As shown" },
        { label: "Availability", value: product.stock === "in-stock" ? "In stock" : product.stock === "low-stock" ? "Limited stock" : "Restocking" },
        { label: "Payment", value: "Cash on Delivery, UPI or Card" },
      ],
    },
    {
      title: "Order & delivery",
      items: [
        { label: "Quantity", value: "1 murti per Buy Now order by default" },
        { label: "Delivery", value: product.delivery },
        { label: "Packing", value: "Careful festival-order packing" },
        { label: "Product appearance", value: "Refer to the actual product photo shown on this page" },
      ],
    },
    ...(isNaturalEco(product) ? [{
      title: "Eco information",
      items: [
        { label: "Product", value: "Natural Eco Ganesh — 6 inch" },
        { label: "Listing information", value: "Marked as eco-friendly and water-dissolvable in the supplied product image" },
        { label: "Visarjan", value: "Follow local visarjan and environmental guidance" },
      ],
    }] : []),
  ];
}

export function getProductDetail(slug: string): ProductDetail | undefined {
  const product = catalogProducts.find((item) => item.slug === slug);
  if (!product) return undefined;
  const colorOptions = product.colors.map((color) => ({ label: color, value: color.toLowerCase().replace(/\s+/g, "-") }));

  return {
    ...product,
    subtitle: `${categoryLabel(product.category)} Ganesh murti from the Prakriti Ganesh festival collection.`,
    description: isNaturalEco(product)
      ? "A 6-inch natural eco Ganesh option. The supplied product image specifically marks this item as eco-friendly and water-dissolvable."
      : "A festive Ganesh murti from the Prakriti Ganesh collection. Please use the product photo as the primary reference for colour, ornaments and decorative finish.",
    images: [{ src: product.image, alt: product.name }],
    sizes: [],
    colorOptions,
    highlights: [
      "Cash on Delivery available",
      "UPI and Card payment option",
      "Buy Now for direct single-murti checkout",
      "Careful festival-order packing",
    ],
    offers: [
      { title: "Ganesh Chaturthi Offer", description: "Festival pricing shown on this product is the current selling price.", tone: "warm" },
      { title: "Cash on Delivery", description: "COD is available on all 16 murtis in the current collection.", tone: "lime" },
      { title: "Secure online payment", description: "UPI and credit / debit card options are also available at checkout.", tone: "plain" },
    ],
    specifications: categorySpecs(product),
    reviewsList: [],
    warranty: "Product condition checked before dispatch",
    returnPolicy: "Damage or delivery issues are handled according to the store return policy",
    seller: "Prakriti Ganesh",
    sku: `PG-${String(catalogProducts.indexOf(product) + 1).padStart(5, "0")}`,
  };
}

export function getRelatedProducts(product: CatalogProduct, limit = 4) {
  const sameCategory = catalogProducts.filter((item) => item.slug !== product.slug && item.category === product.category);
  const fallback = catalogProducts.filter((item) => item.slug !== product.slug && item.category !== product.category);
  return [...sameCategory, ...fallback].slice(0, limit);
}

export function getBundleProducts(product: CatalogProduct) {
  return getRelatedProducts(product, 2);
}
