import { catalogProducts } from "@/lib/catalog-data";
import type { CatalogProduct } from "@/types/catalog";
import type { ProductDetail, ProductReview, ProductSpecGroup } from "@/types/product-detail";

const defaultReviews: ProductReview[] = [
  { id: "rev-1", author: "Aarav M.", rating: 5, title: "Beautiful handmade finish", body: "The murti looked beautiful and the natural clay texture made it feel genuinely handcrafted.", verified: true, helpful: 186, date: "28 Aug 2026" },
  { id: "rev-2", author: "Meera S.", rating: 5, title: "Perfect size for our home", body: "The size was easy to understand from the listing and the murti arrived well packed for the festival.", verified: true, helpful: 94, date: "24 Aug 2026" },
  { id: "rev-3", author: "Rohan K.", rating: 4, title: "Loved the eco focus", body: "A good option for families who want a more nature-conscious Ganesh Chaturthi celebration.", verified: true, helpful: 71, date: "21 Aug 2026" },
];

function sizeFromName(name: string) {
  const match = name.match(/(\d+)\s*inch/i);
  return match ? `${match[1]} inch` : "See product title";
}

function categoryLabel(category: string) {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function materialFor(product: CatalogProduct) {
  if (product.category === "seed-ganesh") return "Natural clay / seed-based eco concept";
  if (product.category === "shadu-mati") return "Shadu Mati / natural clay";
  if (product.category === "natural-finish") return "Natural clay with minimal finish";
  return "Eco-conscious clay-focused construction";
}

function categorySpecs(product: CatalogProduct): ProductSpecGroup[] {
  const common = [
    { label: "Collection", value: categoryLabel(product.category) },
    { label: "Size", value: sizeFromName(product.name) },
    { label: "Material", value: materialFor(product) },
    { label: "Availability", value: product.stock === "in-stock" ? "In stock" : product.stock === "low-stock" ? "Limited stock" : "Restocking" },
  ];

  return [
    { title: "Murti details", items: common },
    {
      title: "Handmade character",
      items: [
        { label: "Finish", value: product.colors.join(" / ") || "Natural" },
        { label: "Craft", value: "Hand-finished; small variations are part of handmade work" },
        { label: "Use", value: product.category === "bulk-orders" ? "Society, office or community celebration" : "Ganesh Chaturthi home celebration" },
      ],
    },
    {
      title: "Eco care",
      items: [
        { label: "Visarjan", value: "Follow local eco-visarjan guidance and product care instructions" },
        { label: "Storage", value: "Keep dry and handle gently before installation" },
        { label: "Packaging", value: "Protective festival-ready packing" },
      ],
    },
  ];
}

function alternateImage(url: string, index: number) {
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}crop=entropy&ixid=prakriti-ganesh-pdp-${index}`;
}

export function getProductDetail(slug: string): ProductDetail | undefined {
  const product = catalogProducts.find((item) => item.slug === slug);
  if (!product) return undefined;

  const colorOptions = product.colors.map((color) => ({ label: color, value: color.toLowerCase().replace(/\s+/g, "-") }));

  return {
    ...product,
    subtitle: `Handcrafted ${categoryLabel(product.category)} murti from ${product.brand}, selected for a mindful Ganesh Chaturthi celebration.`,
    description: `${product.name} is part of the Prakriti Ganesh eco-friendly collection. The store focuses on clay-forward materials, artisan finishing and clear size information so you can choose a murti that suits your home and celebration.`,
    images: [0, 1, 2, 3].map((index) => ({ src: index === 0 ? product.image : alternateImage(product.image, index), alt: `${product.name} view ${index + 1}` })),
    sizes: [],
    colorOptions,
    highlights: [
      materialFor(product),
      `Approx. size: ${sizeFromName(product.name)}`,
      `Delivery: ${product.delivery}`,
      "Secure checkout and careful festival-ready packing",
    ],
    offers: [
      { title: "Festive welcome", description: "Introductory seasonal pricing is already reflected on selected murtis.", tone: "lime" },
      { title: "Bulk planning", description: "Society and office collections are available in the Bulk Orders category.", tone: "plain" },
      { title: "Choose thoughtfully", description: "Compare size, material and finish before placing your order.", tone: "warm" },
    ],
    specifications: categorySpecs(product),
    reviewsList: defaultReviews,
    warranty: "Handmade quality assurance",
    returnPolicy: "Return eligibility depends on condition, damage status and festival delivery terms",
    seller: "Prakriti Ganesh",
    sku: `PG-${product.id.replace("cat_", "").padStart(5, "0")}`,
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
