import { ValidationError } from "@/lib/db/errors";
/** INR prices are normalized to integer paise. The base-product compare-at
 * price is never used as a discount reference for independently priced SKUs. */
function toMinor(value:unknown):number {
  if(typeof value!=="number"||!Number.isFinite(value)||value<0||value>1_000_000)
    throw new ValidationError("Original price must be a valid rupee amount.");
  const minor=Math.round(value*100);
  if(!Number.isSafeInteger(minor))
    throw new ValidationError("Original price is outside the supported range.");
  return minor;
}
export function resolveCompareAtMinor(
  hasCompareAtInput:boolean,value:unknown,sellingMinor:number,existing:number|null,
):number|null{
  let next=existing;
  if(hasCompareAtInput)
    next=(value===null||value==="")?null:toMinor(value);
  if(next!==null&&next<sellingMinor)
    throw new ValidationError("Original price must not be below the selling price.");
  return next;
}
