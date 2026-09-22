-- NEXORA seller-to-product ownership mapping.
-- Safe to run repeatedly on an existing production database.

create table if not exists "SellerProduct" (
  "id" text primary key,
  "sellerProfileId" text not null references "SellerProfile"("id") on delete cascade,
  "productId" text not null references "Product"("id") on delete cascade,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "SellerProduct_productId_key" unique ("productId"),
  constraint "SellerProduct_sellerProfileId_productId_key" unique ("sellerProfileId","productId")
);

create index if not exists "SellerProduct_sellerProfileId_idx"
on "SellerProduct"("sellerProfileId");
