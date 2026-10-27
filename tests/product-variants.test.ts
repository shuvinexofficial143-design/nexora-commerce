import assert from "node:assert/strict";
import test from "node:test";
import { parseProductChoiceGroups } from "../lib/commerce/product-choices";
import { variantSignature, validateVariantDefinition, publicVariant } from "../lib/commerce/product-variants";
const groups = parseProductChoiceGroups([
  { key:"colour", label:"Colour", required:true, values:[
    { value:"black",label:"Black",available:true }, { value:"white",label:"White",available:true },
  ] },
  { key:"size", label:"Size", required:false, values:[
    {value:"m",label:"Medium",available:true}, {value:"xl",label:"Extra Large",available:false},
  ] },
]);

test("variant signature is canonical across choice order and optional selections", () => {
  assert.equal(variantSignature({ size: "m", colour: "black" }),
    variantSignature({ colour: "black", size: "m" }));
  assert.notEqual(variantSignature({ colour: "black" }), variantSignature({ colour:"white" }));
});

test("variant SKU definition enforces saved choices, stock and price", () => {
  const item = validateVariantDefinition(groups, { choices: { colour:"black" },
    sku:"NX-BLK", priceMinor:129900, onHand:3, active:true });
  assert.equal(item.signature, variantSignature({ colour:"black" }));
  assert.equal(item.onHand, 3);
  assert.equal(item.priceMinor, 129900);
  for (const bad of [
    { ...item, choices: { colour:"gold" } },
    { ...item, choices: { colour:"black", size:"xl" } },
    { ...item, sku:"broken sku" },
    { ...item, priceMinor:-1 },
    { ...item, onHand: -1 },
    { ...item, active:"yes" },
  ]) assert.throws(() => validateVariantDefinition(groups, bad));
});

test("public variant reports only real unreserved available quantities", () => {
  const x = publicVariant({id:"variant-test", signature:"{}", choices:{colour:"black"},
    sku:"NX-BLK", priceMinor:129900, onHand:3, reserved:2, active:true});
  assert.equal(x.availableStock,1);
  assert.equal(x.priceMinor,129900);
});
