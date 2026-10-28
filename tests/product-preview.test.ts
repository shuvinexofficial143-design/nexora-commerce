import assert from "node:assert/strict";
import test from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {buildProductPreview} from "../lib/admin/product-preview";
import {ProductPreviewPanel} from "../components/admin/product-preview";

const base={name:"Nexora Test Watch",price:"999",compareAtPrice:"1299",
  description:"A real product description",posterUrl:"https://images.unsplash.com/photo-12345",
  gallery:["https://images.unsplash.com/photo-67890"],videoUrl:"https://youtu.be/abcdefghijk",
  status:"DRAFT"};
test("admin preview shows truthful base price and provided compare-at only",()=>{
  const x=buildProductPreview(base);
  assert.equal(x.title,"Nexora Test Watch");
  assert.equal(x.priceLabel,"₹999.00");
  assert.equal(x.compareAtLabel,"₹1,299.00");
  assert.equal(x.stockLabel,"Stock has not been configured");
  assert.equal(x.videoAttached,true);
  assert.equal(x.photos.length,2);
  assert.equal(x.status,"DRAFT");
});
test("SKU-aware preview uses lowest ACTIVE SKU price and never invents parent-price markdown",()=>{
  const x=buildProductPreview({...base,price:"999",compareAtPrice:"2499",
    stockSource:"sku",effectivePriceMinor:147500,availableStock:8,
    activeVariantCount:2,totalVariantCount:3,status:"ACTIVE"});
  assert.equal(x.priceLabel,"SKU prices from ₹1,475.00");
  assert.equal(x.compareAtLabel,null);
  assert.equal(x.stockLabel,"SKU stock available: 8");
  assert.equal(x.variantPrice,true);
});
test("No active SKU fails closed even when parent product has a price",()=>{
  const x=buildProductPreview({...base,stockSource:"sku",effectivePriceMinor:null,
    availableStock:0,status:"ACTIVE"});
  assert.equal(x.priceLabel,"No active SKU price");
  assert.equal(x.compareAtLabel,null);
  assert.equal(x.stockLabel,"No active SKU available");
});
test("invalid images and duplicates excluded; no fake content or pricing",()=>{
  const x=buildProductPreview({
    name:" ",price:"",compareAtPrice:"10000",description:" ",posterUrl:"javascript:alert(1)",
    gallery:["https://evil.example/a.png","http://images.unsplash.com/test",
      "https://images.unsplash.com/photo-abc","https://images.unsplash.com/photo-abc"],
    videoUrl:"https://evil.example/not-video",status:"DRAFT",
  });
  assert.deepEqual(x.photos,["https://images.unsplash.com/photo-abc"]);
  assert.equal(x.title,"Untitled product");
  assert.equal(x.description,"No description entered yet.");
  assert.equal(x.priceLabel,"Enter a selling price");
  assert.equal(x.compareAtLabel,null);
  assert.equal(x.videoAttached,false);
});
test("original price never crossed out unless strictly above genuine base price",()=>{
  for(const compareAtPrice of [null,"","999","500","NaN","-3",Infinity]){
    assert.equal(buildProductPreview({...base,compareAtPrice}).compareAtLabel,null);
  }
  assert.equal(buildProductPreview({...base,compareAtPrice:"1299",stockSource:"warehouse",
    availableStock:0}).stockLabel,"Currently out of stock");
});
test("Cline product preview renders with admin-only label and no save/publish side effect",()=>{
  const markup=renderToStaticMarkup(createElement(ProductPreviewPanel,{
    ...base,posterUrl:null,gallery:[],stockSource:"sku",
    effectivePriceMinor:null,availableStock:0,
  }));
  assert.match(markup,/Unsaved product preview/);
  assert.match(markup,/Admin-only preview/);
  assert.match(markup,/No active SKU price/);
  assert.match(markup,/This preview does not publish the product/);
  assert.doesNotMatch(markup,/₹999/);
  assert.doesNotMatch(markup,/₹1,299/);
});
