import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { createCheckoutPreview, validateCheckoutPreview } from "../../lib/commerce/checkout-preview";
import { createOrder, createOrderWithOutcome } from "../../lib/db/orders";
import { validateOrder } from "../../lib/server/backend";
import { reconcileOrder } from "../../lib/admin/stock";
import { variantSignature } from "../../lib/commerce/product-variants";

function verifyIsolation() {
  if (process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true") throw new Error("Opt-in for disposable test database required");
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    const url = new URL(process.env[key] || "");
    if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname)
      || url.username !== "nexora_qa" || url.pathname !== "/nexora_qa") {
      throw new Error("Refusing non-disposable or production database");
    }
  }
}
verifyIsolation();
const db = getPrisma();
const uid = () => randomUUID().replaceAll("-", "").slice(0, 12);
async function fixture(onHand = 5) {
  const id = uid();
  const user = await db.user.create({ data: { email: `preview-${id}@example.invalid`, name: "Preview Test", passwordHash: "qa-no-login" } });
  const product = await db.product.create({ data: {
    slug: "qa-preview-" + id, sku: "P-QA-" + id, name: "Test Checkout Product",
    description: "Temporary preview fixture", status: "ACTIVE", priceMinor: 80000,
  } });
  const warehouse = await db.warehouse.create({ data: { code: "P-QA-" + id, name: "QA", city: "Indore", state: "MP" } });
  const inventory = await db.inventoryItem.create({
    data: { productId: product.id, warehouseId: warehouse.id, onHand, reserved: 0 },
  });
  return { user, product, inventory };
}
before(async () => { await db.$connect(); });
after(async () => { await db.$disconnect(); });

test("preview reads current PostgreSQL price and stock without order or inventory reservation", async () => {
  const f = await fixture(5);
  const preview = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 2, clientPriceMinor: 80000 }],
    deliveryMethod: "standard",
  }));
  assert.equal(preview.valid, true);
  assert.equal(preview.changedPrice, false);
  assert.equal(preview.lines[0].unitPriceMinor, 80000);
  assert.equal(preview.lines[0].availableStock, 5);
  assert.equal(preview.subtotalMinor, 160000);
  assert.equal(preview.shippingMinor, 0);
  assert.equal(preview.taxMinor, 28800);
  assert.equal(preview.totalMinor, 188800);
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 0);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 0);
});

test("outdated cart price is flagged, not silently charged at a new price", async () => {
  const f = await fixture(6);
  await db.product.update({ where: { id: f.product.id }, data: { priceMinor: 91000 } });
  const checked = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 1, clientPriceMinor: 80000 }],
  }));
  assert.equal(checked.valid, true);
  assert.equal(checked.changedPrice, true);
  assert.equal(checked.lines[0].unitPriceMinor, 91000);
  assert.equal(checked.subtotalMinor, 91000);
  assert.equal(checked.shippingMinor, 9900);
  assert.equal(checked.totalMinor, 117280);
  const accepted = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 1, clientPriceMinor: 91000 }],
  }));
  assert.equal(accepted.changedPrice, false);
});

test("duplicate variant lines aggregate stock and reject oversell without touching reservations", async () => {
  const f = await fixture(3);
  const checked = await createCheckoutPreview(validateCheckoutPreview({
    items: [
      { slug: f.product.slug, quantity: 2, clientPriceMinor: 80000 },
      { slug: f.product.slug, quantity: 2, clientPriceMinor: 80000 },
    ],
  }));
  assert.equal(checked.valid, false);
  assert.equal(checked.lines.every(item => item.state === "insufficient_stock"), true);
  assert.equal(checked.issues.filter(issue => issue.includes("insufficient stock")).length, 1);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 0);
});

test("unpublished and archived products do not resolve to purchasable cart lines", async () => {
  const f = await fixture(4);
  for (const status of ["DRAFT", "ARCHIVED"] as const) {
    await db.product.update({ where: { id: f.product.id }, data: { status } });
    const checked = await createCheckoutPreview(validateCheckoutPreview({
      items: [{ slug: f.product.slug, quantity: 1 }],
    }));
    assert.equal(checked.valid, false);
    assert.equal(checked.lines[0].productId, null);
    assert.equal(checked.lines[0].state, "unavailable");
  }
});

test("successful order uses the same server totals and reserves stock only in order transaction", async () => {
  const f = await fixture(2);
  const quote = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 1, clientPriceMinor: 80000 }],
  }));
  assert.equal(quote.totalMinor, 104300);
  const payload = validateOrder({
    items: [{ productId: f.product.id, quantity: 1 }],
    shippingAddress: { fullName: "QA Customer", phone: "9876543210", line1: "QA Address",
      city: "Indore", state: "MP", postalCode: "452001" },
    contactEmail: f.user.email,
    paymentMethod: "cod", deliveryMethod: "standard",
  });
  const order = await createOrder(f.user.id, payload, "preview-qa-" + uid());
  assert.equal(order.totalMinor, quote.totalMinor);
  assert.equal(order.shippingMinor, quote.shippingMinor);
  assert.equal(order.taxMinor, quote.taxMinor);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 1);
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 1);
});

test("stock can change after preview and subsequent preflight blocks oversell", async () => {
  const f = await fixture(1);
  const input = validateCheckoutPreview({ items: [{ slug: f.product.slug, quantity: 1 }] });
  assert.equal((await createCheckoutPreview(input)).valid, true);
  await db.inventoryItem.update({ where: { id: f.inventory.id }, data: { reserved: 1 } });
  const changed = await createCheckoutPreview(input);
  assert.equal(changed.valid, false);
  assert.equal(changed.lines[0].availableStock, 0);
});

test("stored admin choices appear in checkout preview and reject fabricated combinations", async () => {
  const f = await fixture(8);
  await db.productChoiceGroup.create({
    data: { productId: f.product.id, key: "colour", label: "Colour", required: true,
      values: [{ value: "black", label: "Black", available: true },
        { value: "red", label: "Red", available: false }], sortOrder: 0 },
  });
  const without = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 1, clientPriceMinor: 80000 }],
  }));
  assert.equal(without.valid, false);
  assert.match(without.issues[0], /Choose Colour/);

  const selected = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 2, options: { colour: "black" }, clientPriceMinor: 80000 }],
  }));
  assert.equal(selected.valid, true);
  assert.deepEqual(selected.lines[0].options, { colour: "black" });

  const disabled = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 1, options: { colour: "red" } }],
  }));
  assert.equal(disabled.valid, false);
  const invented = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 1, options: { colour: "gold" } }],
  }));
  assert.equal(invented.valid, false);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 0);
});

test("persisted order stores only actually configured options with unchanged product pricing", async () => {
  const f = await fixture(5);
  await db.productChoiceGroup.create({ data: {
    productId: f.product.id, key: "material", label: "Material", required: true,
    values: [{ value: "steel", label: "Steel", available: true }], sortOrder: 0,
  } });
  const base = {
    items: [{ productId: f.product.id, quantity: 1, variant: { material: "steel" } }],
    shippingAddress: { fullName: "QA Buyer", phone: "9876543210",
      line1: "Temporary QA Street", city: "Indore", state: "MP", postalCode: "452001" },
    contactEmail: f.user.email, paymentMethod: "cod", deliveryMethod: "standard",
  };
  for (const variant of [{ material: "gold" }, { material: "steel", size: "XL" }, {}]) {
    await assert.rejects(
      async () => createOrder(f.user.id, validateOrder({ ...base, items: [{ productId: f.product.id, quantity: 1, variant }] })),
      /Choose Material|not available|no longer offered|Invalid product option/,
    );
  }
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 0);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 0);
  const order = await createOrder(f.user.id, validateOrder(base));
  assert.equal(order.totalMinor, 104300);
  assert.deepEqual(order.items[0].variant, { material: "steel" });
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 1);
});

test("disabled former option blocks replay of old customer cart without charging", async () => {
  const f = await fixture(3);
  const group = await db.productChoiceGroup.create({ data: {
    productId: f.product.id, key: "finish", label: "Finish", required: false,
    values: [{ value: "matte", label: "Matte", available: true }], sortOrder: 0,
  } });
  const selected = validateCheckoutPreview({ items: [{
    slug: f.product.slug, quantity: 1, options: { finish: "matte" },
  }] });
  assert.equal((await createCheckoutPreview(selected)).valid, true);
  await db.productChoiceGroup.update({ where: { id: group.id },
    data: { values: [{ value: "matte", label: "Matte", available: false }] } });
  const checked = await createCheckoutPreview(selected);
  assert.equal(checked.valid, false);
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 0);
});

async function variantFixture() {
  const f = await fixture(80); // Parent stock must NOT be consumed by SKU checkouts.
  await db.productChoiceGroup.create({
    data: { productId: f.product.id, key: "colour", label: "Colour", required: true,
      values: [{value:"black",label:"Black",available:true},
        {value:"white",label:"White",available:true}], sortOrder: 0 },
  });
  const black = await db.productVariant.create({
    data: { productId: f.product.id, signature: variantSignature({colour:"black"}),
      choices: {colour:"black"}, sku:"VAR-B-" + uid(), priceMinor:129900,
      onHand:2, reserved:0, active:true },
  });
  const white = await db.productVariant.create({
    data: { productId: f.product.id, signature: variantSignature({colour:"white"}),
      choices: {colour:"white"}, sku:"VAR-W-" + uid(), priceMinor:159900,
      onHand:1, reserved:0, active:true },
  });
  return { ...f, black, white };
}
function createVariantOrderInput(productId: string, options: Record<string,string>) {
  return validateOrder({
    items:[{ productId, quantity:1, variant:options }],
    shippingAddress: { fullName:"QA Buyer", phone:"9876543210",
      line1:"Temporary Test Address", city:"Indore", state:"MP", postalCode:"452001" },
    paymentMethod:"cod", deliveryMethod:"standard", contactEmail:"qa@example.invalid",
  });
}

test("variant quote resolves exact independently priced SKU without reserving stock", async () => {
  const f = await variantFixture();
  const input = validateCheckoutPreview({ items:[
    { slug:f.product.slug, quantity:1, options:{colour:"black"}, clientPriceMinor:129900 },
    { slug:f.product.slug, quantity:1, options:{colour:"white"}, clientPriceMinor:159900 },
  ] });
  const quote = await createCheckoutPreview(input);
  assert.equal(quote.valid,true);
  assert.equal(quote.changedPrice,false);
  assert.deepEqual(quote.lines.map(x=>x.unitPriceMinor), [129900,159900]);
  assert.deepEqual(quote.lines.map(x=>x.availableStock), [2,1]);
  assert.deepEqual(quote.lines.map(x=>x.variantId), [f.black.id,f.white.id]);
  assert.equal(quote.subtotalMinor,289800);
  assert.equal(quote.shippingMinor,0);
  assert.equal((await db.productVariant.findUniqueOrThrow({where:{id:f.black.id}})).reserved,0);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({where:{id:f.inventory.id}})).reserved,0);
});

test("same SKU demands aggregate while other SKU stock stays independent", async () => {
  const f = await variantFixture();
  const threeBlack = await createCheckoutPreview(validateCheckoutPreview({ items:[
    {slug:f.product.slug,quantity:2,options:{colour:"black"}},
    {slug:f.product.slug,quantity:1,options:{colour:"black"}},
  ] }));
  assert.equal(threeBlack.valid,false);
  assert.equal(threeBlack.lines.every(x=>x.state==="insufficient_stock"),true);
  const oneEach = await createCheckoutPreview(validateCheckoutPreview({ items:[
    {slug:f.product.slug,quantity:1,options:{colour:"black"}},
    {slug:f.product.slug,quantity:1,options:{colour:"white"}},
  ] }));
  assert.equal(oneEach.valid,true);
});

test("variant price change is flagged and invalid/disabled choice fails closed", async () => {
  const f = await variantFixture();
  await db.productVariant.update({where:{id:f.black.id},data:{priceMinor:139900}});
  const quote=await createCheckoutPreview(validateCheckoutPreview({ items:[
    {slug:f.product.slug,quantity:1,options:{colour:"black"},clientPriceMinor:129900},
  ] }));
  assert.equal(quote.changedPrice,true);
  assert.equal(quote.lines[0].unitPriceMinor,139900);
  await db.productVariant.update({where:{id:f.black.id},data:{active:false}});
  const disabled=await createCheckoutPreview(validateCheckoutPreview({ items:[
    {slug:f.product.slug,quantity:1,options:{colour:"black"}},
  ] }));
  assert.equal(disabled.valid,false);
  assert.equal(disabled.lines[0].state,"unavailable");
  await assert.rejects(
    createOrder(f.user.id,createVariantOrderInput(f.product.id,{colour:"black"})),
    /SKU combination is unavailable/,
  );
});

test("SKU reservation is atomic; cancelling releases only selected SKU", async () => {
  const f=await variantFixture();
  const order=await createOrder(f.user.id,createVariantOrderInput(f.product.id,{colour:"black"}));
  assert.equal(order.items[0].sku,f.black.sku);
  assert.equal(order.items[0].productVariantId,f.black.id);
  assert.equal(order.items[0].unitPriceMinor,129900);
  assert.deepEqual(order.items[0].variant,{colour:"black"});
  assert.equal((await db.productVariant.findUniqueOrThrow({where:{id:f.black.id}})).reserved,1);
  assert.equal((await db.productVariant.findUniqueOrThrow({where:{id:f.white.id}})).reserved,0);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({where:{id:f.inventory.id}})).reserved,0);
  await db.$transaction(async tx=>{
    await reconcileOrder(tx,order,"CANCEL");
    await tx.order.update({where:{id:order.id},data:{status:"CANCELLED"}});
  });
  const after=await db.productVariant.findUniqueOrThrow({where:{id:f.black.id}});
  assert.equal(after.reserved,0);
  assert.equal(after.onHand,2);
  assert.equal(await db.productVariantMovement.count({where:{orderId:order.id,type:"RELEASE"}}),1);
});

test("SKU delivery decreases only its own on-hand and reserved stock", async()=>{
  const f=await variantFixture();
  const order=await createOrder(f.user.id,createVariantOrderInput(f.product.id,{colour:"white"}));
  await db.$transaction(async tx=>{
    await reconcileOrder(tx,order,"DELIVER");
    await tx.order.update({where:{id:order.id},data:{status:"DELIVERED"}});
  });
  const after=await db.productVariant.findUniqueOrThrow({where:{id:f.white.id}});
  assert.equal(after.onHand,0);
  assert.equal(after.reserved,0);
  assert.equal((await db.productVariant.findUniqueOrThrow({where:{id:f.black.id}})).onHand,2);
  assert.equal(await db.productVariantMovement.count({where:{orderId:order.id,type:"OUTBOUND"}}),1);
});

test("simultaneous shoppers cannot oversell the final variant unit", async()=>{
  const f=await variantFixture();
  const alt=await db.user.create({data:{email:"variant-other-"+uid()+"@example.invalid",
    name:"Other QA Buyer",passwordHash:"qa-no-login"}});
  const input=createVariantOrderInput(f.product.id,{colour:"white"});
  const results=await Promise.allSettled([
    createOrder(f.user.id,input), createOrder(alt.id,input),
  ]);
  const success=results.filter(x=>x.status==="fulfilled");
  assert.equal(success.length,1);
  assert.equal((await db.productVariant.findUniqueOrThrow({where:{id:f.white.id}})).reserved,1);
  assert.equal((await db.productVariant.findUniqueOrThrow({where:{id:f.white.id}})).onHand,1);
});

test("mixed priced-variant and legacy product lines reconcile both inventories", async()=>{
  const f=await variantFixture();
  const other=await fixture(3);
  const order=await createOrder(f.user.id,validateOrder({
    items:[
      {productId:f.product.id,quantity:1,variant:{colour:"black"}},
      {productId:other.product.id,quantity:1},
    ],
    shippingAddress:{fullName:"QA Buyer",phone:"9876543210",line1:"Test St",
      city:"Indore",state:"MP",postalCode:"452001"},
    paymentMethod:"cod",deliveryMethod:"standard",contactEmail:"qa@example.invalid",
  }));
  assert.equal((await db.inventoryItem.findUniqueOrThrow({where:{id:other.inventory.id}})).reserved,1);
  await db.$transaction(async tx=>{
    await reconcileOrder(tx,order,"CANCEL");
    await tx.order.update({where:{id:order.id},data:{status:"CANCELLED"}});
  });
  assert.equal((await db.inventoryItem.findUniqueOrThrow({where:{id:other.inventory.id}})).reserved,0);
  assert.equal((await db.productVariant.findUniqueOrThrow({where:{id:f.black.id}})).reserved,0);
});

test("quote to order price race rejects unexpected SKU reprice with no reservation", async()=>{
  const f=await variantFixture();
  const quote=await createCheckoutPreview(validateCheckoutPreview({items:[
    {slug:f.product.slug,quantity:1,options:{colour:"black"},clientPriceMinor:129900},
  ]}));
  assert.equal(quote.valid,true);
  await db.productVariant.update({where:{id:f.black.id},data:{priceMinor:145000}});
  await assert.rejects(createOrder(f.user.id,validateOrder({
    ...createVariantOrderInput(f.product.id,{colour:"black"}),
    items:[{productId:f.product.id,quantity:1,variant:{colour:"black"},
      expectedUnitPriceMinor:quote.lines[0].unitPriceMinor!}],
  })),/Product price changed after verification/);
  assert.equal((await db.productVariant.findUniqueOrThrow({where:{id:f.black.id}})).reserved,0);
  assert.equal(await db.order.count({where:{userId:f.user.id}}),0);
});
test("legacy product server price race rejects stale quote too",async()=>{
  const f=await fixture(4);
  await db.product.update({where:{id:f.product.id},data:{priceMinor:90000}});
  await assert.rejects(createOrder(f.user.id,validateOrder({
    ...createVariantOrderInput(f.product.id,{}),
    items:[{productId:f.product.id,quantity:1,expectedUnitPriceMinor:80000}],
  })),/Product price changed after verification/);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({where:{id:f.inventory.id}})).reserved,0);
});

test("live product cart admission rejects reserved final SKU and changed prices with no side effects", async () => {
  const f = await variantFixture();
  const existing = [{
    id: f.product.id, slug: f.product.slug, name: f.product.name, brand: "QA",
    image: "/product-placeholder.svg", stock: "low-stock" as const, price: 1299,
    quantity: 1, lineId: "black", choices: { colour: "black" },
  }];
  const { buildCartAdmissionRequest, assertCartAdmission } = await import("../../lib/commerce/cart-admission");
  const input = validateCheckoutPreview(buildCartAdmissionRequest(existing[0], { colour: "black" }, existing));
  assert.equal(input.items[0].quantity, 2);
  const before = await createCheckoutPreview(input);
  assert.equal(before.valid, true);
  assertCartAdmission(before, input);
  await db.productVariant.update({ where: { id: f.black.id }, data: { reserved: 1 } });
  const soldOut = await createCheckoutPreview(input);
  assert.equal(soldOut.valid, false);
  assert.equal(soldOut.lines[0].availableStock, 1);
  assert.throws(() => assertCartAdmission(soldOut, input), /insufficient stock/i);
  await db.productVariant.update({ where: { id: f.black.id },
    data: { reserved: 0, priceMinor: 135000 } });
  const repriced = await createCheckoutPreview(input);
  assert.equal(repriced.changedPrice, true);
  assert.throws(() => assertCartAdmission(repriced, input), /price changed/);
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 0);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 0);
});

test("verified multi-SKU quote produces authoritative order items and identical retry never reserves twice", async () => {
  const f = await variantFixture();
  const { verifiedCheckoutOrderItems } = await import("../../lib/commerce/checkout-submission");
  const cart = [
    { id: f.product.id, slug: f.product.slug, name: f.product.name, brand: "QA",
      image: "/product-placeholder.svg", stock: "low-stock" as const, price: 1299,
      quantity: 1, lineId: "black", choices: { colour: "black" } },
    { id: f.product.id, slug: f.product.slug, name: f.product.name, brand: "QA",
      image: "/product-placeholder.svg", stock: "low-stock" as const, price: 1599,
      quantity: 1, lineId: "white", choices: { colour: "white" } },
  ];
  const preview = await createCheckoutPreview(validateCheckoutPreview({items:[
    { slug:f.product.slug, quantity:1, options:{colour:"black"}, clientPriceMinor:129900 },
    { slug:f.product.slug, quantity:1, options:{colour:"white"}, clientPriceMinor:159900 },
  ]}));
  assert.equal(preview.valid, true);
  const items = verifiedCheckoutOrderItems(cart, preview);
  assert.deepEqual(items.map(x=>x.expectedUnitPriceMinor),[129900,159900]);
  assert.deepEqual(items.map(x=>x.variant),[{colour:"black"},{colour:"white"}]);
  const payload = validateOrder({ ...createVariantOrderInput(f.product.id,{colour:"black"}),
    contactEmail:f.user.email, items });
  const key = "qa-retry-variant-" + uid();
  const first = await createOrderWithOutcome(f.user.id,payload,key);
  const second = await createOrderWithOutcome(f.user.id,payload,key);
  assert.equal(first.created,true);
  assert.equal(second.created,false);
  assert.equal(first.order.id,second.order.id);
  assert.equal(await db.order.count({where:{userId:f.user.id}}),1);
  assert.equal((await db.productVariant.findUniqueOrThrow({where:{id:f.black.id}})).reserved,1);
  assert.equal((await db.productVariant.findUniqueOrThrow({where:{id:f.white.id}})).reserved,1);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({where:{id:f.inventory.id}})).reserved,0);
  await db.productVariant.update({where:{id:f.black.id},data:{priceMinor:149900}});
  const replay = await createOrderWithOutcome(f.user.id,payload,key);
  assert.equal(replay.created,false);
  assert.equal(replay.order.id,first.order.id);
  assert.equal(await db.order.count({where:{userId:f.user.id}}),1);
  const stale = await createCheckoutPreview(validateCheckoutPreview({items:[
    {slug:f.product.slug, quantity:1, options:{colour:"black"}, clientPriceMinor:129900},
  ]}));
  assert.equal(stale.changedPrice,true);
  // Price changed does not imply stock/choice invalidity: customer must
  // explicitly accept the new quote before submitting an order.
  assert.equal(stale.valid,true);
  assert.throws(() => verifiedCheckoutOrderItems([cart[0]], stale),
    /another live verification/i);
});
