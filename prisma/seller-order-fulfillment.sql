-- NEXORA per-seller fulfillment state for multi-seller orders.
create table if not exists "SellerOrderFulfillment" (
  "id" text primary key,
  "sellerProfileId" text not null references "SellerProfile"("id") on delete cascade,
  "orderId" text not null references "Order"("id") on delete cascade,
  "status" text not null default 'NEW',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "SellerOrderFulfillment_seller_order_key"
    unique ("sellerProfileId","orderId")
);

create index if not exists "SellerOrderFulfillment_sellerProfileId_idx"
on "SellerOrderFulfillment"("sellerProfileId");

alter table "SellerOrderFulfillment" enable row level security;
