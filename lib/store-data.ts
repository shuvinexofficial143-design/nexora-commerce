import type { Category, Product } from "@/types/commerce";
import { catalogProducts } from "@/lib/catalog-data";

const productImage = (index:number) => catalogProducts[index]?.image ?? catalogProducts[0].image;

export const categories: Category[] = [
  { slug:"royal", name:"Royal Ganesh", eyebrow:"Statement designs", description:"Ornate throne, crown and royal-finish Ganesh murtis.", image:productImage(0) },
  { slug:"pearl-mini", name:"Pearl Mini", eyebrow:"Decorative minis", description:"Pearl and jewellery-detail murtis for compact home setups.", image:productImage(1) },
  { slug:"lotus", name:"Lotus Collection", eyebrow:"Festive backdrop", description:"Ganesh murtis featuring lotus-inspired festive styling.", image:productImage(3) },
  { slug:"bal-ganesh", name:"Bal Ganesh", eyebrow:"Cute home picks", description:"Friendly Bal Ganesh designs with expressive festive finishes.", image:productImage(6) },
  { slug:"decorative", name:"Decorative", eyebrow:"Special poses", description:"Distinctive dancing, flute and display-focused Ganesh designs.", image:productImage(8) },
  { slug:"eco", name:"Natural Eco", eyebrow:"6 inch eco option", description:"The clearly marked natural, water-dissolvable eco Ganesh option.", image:productImage(14) },
];

export const featuredProducts: Product[] = catalogProducts.slice(0, 8);
