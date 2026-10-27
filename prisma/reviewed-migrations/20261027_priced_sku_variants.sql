-- Additive, review-before-production only; no destructive changes.
CREATE TABLE "ProductVariant" (
 "id" TEXT PRIMARY KEY,
 "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
 "signature" TEXT NOT NULL,
 "choices" JSONB NOT NULL,
 "sku" TEXT NOT NULL UNIQUE,
 "priceMinor" INTEGER NOT NULL,
 "onHand" INTEGER NOT NULL DEFAULT 0,
 "reserved" INTEGER NOT NULL DEFAULT 0,
 "active" BOOLEAN NOT NULL DEFAULT FALSE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ProductVariant_productId_signature_key" UNIQUE ("productId","signature"),
 CONSTRAINT "ProductVariant_stock_nonnegative" CHECK ("onHand" >= 0 AND "reserved" >= 0 AND "reserved" <= "onHand"),
 CONSTRAINT "ProductVariant_price_nonnegative" CHECK ("priceMinor" >= 0)
);
CREATE INDEX "ProductVariant_productId_active_idx" ON "ProductVariant"("productId","active");
ALTER TABLE "OrderItem" ADD COLUMN "productVariantId" TEXT;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productVariantId_fkey"
 FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL;
CREATE INDEX "OrderItem_productVariantId_idx" ON "OrderItem"("productVariantId");
CREATE TABLE "ProductVariantMovement" (
 "id" TEXT PRIMARY KEY,
 "variantId" TEXT NOT NULL REFERENCES "ProductVariant"("id") ON DELETE RESTRICT,
 "orderId" TEXT,
 "type" "InventoryMovementType" NOT NULL,
 "quantity" INTEGER NOT NULL,
 "reference" TEXT NOT NULL,
 "note" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ProductVariantMovement_variantId_createdAt_idx" ON "ProductVariantMovement"("variantId","createdAt");
CREATE INDEX "ProductVariantMovement_orderId_type_idx" ON "ProductVariantMovement"("orderId","type");
