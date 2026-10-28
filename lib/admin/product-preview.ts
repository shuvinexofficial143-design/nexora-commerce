import { isSupportedPosterUrl,isSupportedProductVideoUrl } from "@/lib/product-media";

/** Product preview is UI-only; never invent a live product, stock or discount.
 * Existing SKU products display their actual lowest ACTIVE SKU price, not a
 * misleading parent price or a parent compare-at discount.
 */
export type ProductPreviewInput={
  name:string;price:string|number;compareAtPrice?:string|number|null;
  description:string;posterUrl?:string|null;gallery:readonly string[];
  videoUrl?:string|null;status?:string;
  stockSource?:"sku"|"warehouse";effectivePriceMinor?:number|null;
  availableStock?:number|null;activeVariantCount?:number;totalVariantCount?:number;
};
export type ProductPreviewView={
  title:string;description:string;photos:string[];
  priceLabel:string;compareAtLabel:string|null;
  status:string;stockLabel:string|null;
  videoAttached:boolean;variantPrice:boolean;
};
const formatINR=new Intl.NumberFormat("en-IN",{
  style:"currency",currency:"INR",maximumFractionDigits:2,
});
function validRupees(value:unknown):number|null{
  if(typeof value!=="number"&&typeof value!=="string")return null;
  if(typeof value==="string"&&!value.trim())return null;
  const n=Number(value);
  return Number.isFinite(n)&&n>=0&&n<=1_000_000? n : null;
}
export function buildProductPreview(input:ProductPreviewInput):ProductPreviewView{
  const skuPricing=input.stockSource==="sku";
  const price=validRupees(input.price);
  const skuPrice=typeof input.effectivePriceMinor==="number"&&
    Number.isSafeInteger(input.effectivePriceMinor)&&input.effectivePriceMinor>=0
    ?input.effectivePriceMinor/100:null;
  const visiblePrice=skuPricing?skuPrice:price;
  const original=skuPricing?null:validRupees(input.compareAtPrice);
  const images=new Set<string>();
  for(const candidate of [input.posterUrl,...input.gallery]){
    if(typeof candidate==="string"&&isSupportedPosterUrl(candidate.trim()))
      images.add(candidate.trim());
  }
  let stockLabel:string|null=null;
  if(skuPricing){
    if(visiblePrice===null)stockLabel="No active SKU available";
    else if(input.availableStock===0)stockLabel="SKU variants currently out of stock";
    else if(typeof input.availableStock==="number"&&input.availableStock>0)
      stockLabel="SKU stock available: "+input.availableStock;
    else stockLabel="SKU stock not confirmed";
  }else if(input.availableStock===0)stockLabel="Currently out of stock";
  else if(typeof input.availableStock==="number"&&input.availableStock>0)
    stockLabel="Available inventory: "+input.availableStock;
  else stockLabel="Stock has not been configured";
  return {
    title:input.name.trim()||"Untitled product",
    description:input.description.trim()||"No description entered yet.",
    photos:[...images].slice(0,21),
    priceLabel:visiblePrice===null ? (skuPricing?"No active SKU price":"Enter a selling price")
      :skuPricing?"SKU prices from "+formatINR.format(visiblePrice):formatINR.format(visiblePrice),
    compareAtLabel:original!==null&&price!==null&&original>price?formatINR.format(original):null,
    status:input.status||"DRAFT",
    stockLabel,
    videoAttached:isSupportedProductVideoUrl(input.videoUrl),
    variantPrice:skuPricing,
  };
}
