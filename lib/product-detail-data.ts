import { catalogProducts } from "@/lib/catalog-data";
import type { CatalogProduct } from "@/types/catalog";
import type { ProductDetail, ProductImage, ProductReview, ProductSpecGroup } from "@/types/product-detail";

const defaultReviews: ProductReview[] = [
  { id: "rev-1", author: "Aarav M.", rating: 5, title: "Premium feel and great value", body: "Packaging felt premium, the product matched the photos and delivery was quicker than expected.", verified: true, helpful: 186, date: "12 Aug 2026" },
  { id: "rev-2", author: "Meera S.", rating: 4, title: "Very good everyday pick", body: "Quality is strong for the price. I would like one more colour option, but overall I am happy with it.", verified: true, helpful: 94, date: "08 Aug 2026" },
  { id: "rev-3", author: "Rohan K.", rating: 5, title: "Would buy again", body: "Easy purchase experience and the product has been reliable since day one.", verified: true, helpful: 71, date: "03 Aug 2026" },
];

function categorySpecs(product: CatalogProduct): ProductSpecGroup[] {
  const common = [
    { label: "Brand", value: product.brand },
    { label: "Category", value: product.category.replace(/(^.|-.)/g, (part) => part.toUpperCase()) },
    { label: "Availability", value: product.stock === "in-stock" ? "In stock" : product.stock === "low-stock" ? "Limited stock" : "Restocking" },
  ];

  if (product.category === "electronics") {
    return [
      { title: "Product", items: common },
      { title: "Technical", items: [{ label: "Connectivity", value: "Wireless / USB-C ready" }, { label: "Power", value: "Rechargeable" }, { label: "Compatibility", value: "Universal" }] },
      { title: "In the box", items: [{ label: "Included", value: "Main unit, cable, quick-start guide" }, { label: "Warranty", value: "1 year limited warranty" }] },
    ];
  }
  if (product.category === "fashion" || product.category === "accessories") {
    return [
      { title: "Product", items: common },
      { title: "Material & care", items: [{ label: "Finish", value: "Premium everyday finish" }, { label: "Care", value: "Wipe clean / gentle care recommended" }, { label: "Fit", value: "Designed for everyday comfort" }] },
    ];
  }
  return [
    { title: "Product", items: common },
    { title: "Details", items: [{ label: "Use", value: "Everyday use" }, { label: "Finish", value: "Premium retail finish" }, { label: "Origin", value: "Responsibly sourced" }] },
  ];
}

function alternateImage(url: string, index: number) {
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}crop=entropy&ixid=nexora-pdp-${index}`;
}

type ProductDetailOverrides = {
  subtitle?: string;
  description?: string;
  sku?: string;
  images?: ProductImage[];
};

export function buildProductDetail(product: CatalogProduct, overrides: ProductDetailOverrides = {}): ProductDetail {
  const colorOptions = product.colors.map((color) => ({ label: color, value: color.toLowerCase().replace(/\s+/g, "-") }));
  const hasSizes = ["fashion", "fitness"].includes(product.category);
  const sizes = hasSizes ? ["XS", "S", "M", "L", "XL"].map((size, index) => ({ label: size, value: size, available: index !== 0 })) : [];
  const defaultImages = [0, 1, 2, 3].map((index) => ({
    src: index === 0 ? product.image : alternateImage(product.image, index),
    alt: `${product.name} view ${index + 1}`,
  }));

  return {
    ...product,
    subtitle: overrides.subtitle ?? `A refined ${product.category} essential from ${product.brand}, selected for everyday performance and premium design.`,
    description: overrides.description ?? `${product.name} combines considered design, dependable quality and an easy everyday experience. It is part of the NEXORA curated catalogue and includes protected checkout, simple returns and responsive support.`,
    images: overrides.images?.length ? overrides.images : defaultImages,
    sizes,
    colorOptions,
    highlights: ["Curated premium quality", product.delivery === "Tomorrow" ? "Fast delivery available" : `Delivery in ${product.delivery}`, "Secure checkout and buyer protection", "Easy 7-day return eligibility"],
    offers: [
      { title: "Welcome offer", description: "Get 10% off up to ₹750 on your first NEXORA order.", code: "HELLO10", tone: "lime" },
      { title: "Bank offer", description: "Extra ₹500 instant saving on eligible card purchases above ₹4,999.", tone: "plain" },
      { title: "Bundle saving", description: "Add a recommended companion item and unlock an extra bundle discount.", tone: "warm" },
    ],
    specifications: categorySpecs(product),
    reviewsList: defaultReviews,
    warranty: product.category === "electronics" ? "1 year manufacturer-style limited warranty" : "Quality assurance included",
    returnPolicy: "Easy 7-day return on eligible unused items",
    seller: "NEXORA Select",
    sku: overrides.sku ?? `NX-${product.id.replace("cat_", "").padStart(5, "0")}`,
  };
}

export function getProductDetail(slug: string): ProductDetail | undefined {
  const product = catalogProducts.find((item) => item.slug === slug);
  return product ? buildProductDetail(product) : undefined;
}

export function getRelatedProducts(product: CatalogProduct, limit = 4, source: CatalogProduct[] = catalogProducts) {
  const sameCategory = source.filter((item) => item.slug !== product.slug && item.category === product.category);
  const fallback = source.filter((item) => item.slug !== product.slug && item.category !== product.category);
  return [...sameCategory, ...fallback].slice(0, limit);
}

export function getBundleProducts(product: CatalogProduct, source: CatalogProduct[] = catalogProducts) {
  return getRelatedProducts(product, 2, source);
}
