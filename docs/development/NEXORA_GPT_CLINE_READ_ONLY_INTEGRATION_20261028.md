# NEXORA — GPT × Cline Admin Compatibility Review (Read-only)
Date: 2026-10-28
Repository: shuvinexofficial143-design/nexora-commerce
Working GPT branch: feature/nexora-gpt-customer-ops (base HEAD 1f0314acf71c3e9564692c5901957f662d48e479)
Cline branch: feature/nexora-gift-store (read-only HEAD 41fa06c4ce32f28b9c64ea831fd41a0584f7bf2a)
Independent QA branch: feature/nexora-qa-automation (69cc280e24cdb1e1e148b8199227e5190ff8d411)
Main: 3c20daa120793ae7185f63d014295c81d86fe7d8

## Actual branch comparison

GitHub compare_commits reports branches diverged, merge base cb29ef24dee75c7b6b302cecc2944908dd7f10d8.
Cline is 4 commits ahead / 33 behind GPT; reverse compare is 33 ahead / 4 behind.
Do NOT assume one branch contains the other. No merge, cherry-pick, rebase, deploy or production migration has been attempted.

## Confirmed schema incompatibilities to resolve BEFORE merge

Cline prisma/schema.prisma includes:
- Category hierarchy and visibility/archival: parentId, children, description, imageUrl, sortOrder, visible, archived, and AttributeDefinition relation.
- Brand description, logoUrl, active and featured flags.
- AttributeDefinition + AttributeType enums, Product.attributes JSON.
- HomepageBanner CMS model.

GPT prisma/schema.prisma includes:
- ProductChoiceGroup, ProductVariant with canonical SKU signature, independently priced onHand/reserved, ProductVariantMovement, OrderTrackingChallenge.
- Product.variants/choiceGroups and OrderItem.productVariantId/variant FK; reviewed migration files.
- Variant-safe checkout preview and atomic order inventory reservation.

These are not equivalent products. A merged schema must retain both sets; otherwise Prisma client generation and Admin/Checkout can break. Specifically, Cline's Product lacks GPT ProductChoiceGroup/ProductVariant relations, while GPT Product lacks Cline Product.attributes and the Category/Brand metadata.

## API / UI collision points

- app/api/admin-app/products/route.ts differs. Cline GET includes categorySlug, brandSlug, featured, compareAtMinor and description; GPT variant editor and consumer APIs need SKU/choice/variant relationships. Maintain both, and distinguish base warehouse from SKU stock.
- Cline adds app/api/admin-app/catalog/**, components/admin/catalog-management.tsx, catalog options and Homepage Banner APIs/UI. GPT adds separate Admin Product Choices and priced Variants editors. Avoid overwriting either admin module during integration.
- components/admin/personal-admin-app.tsx modified in both branches. This is an ownership and integration hotspot.
- prisma/reviewed-migrations/20261021_catalog_management.sql and 20261021_homepage_banner.sql (Cline) must be reconciled with GPT 20261026_product_choice_groups.sql and 20261027_priced_sku_variants.sql; do not run any in production as part of this report.
- package.json / package-lock.json changed on GPT; use reviewed dependency lock and run fresh dependency and security audit on owner-approved integration branch.
- Cline's Category/Brand lifecycle may introduce filters: hidden/archived categories and disabled brands should not be exposed via customer catalog, Search or Checkout after an approved merge; define precedence and test it rather than inferring behavior now.

## Safe integration acceptance checklist

1. Freeze or coordinate both active branch writers; read exact latest heads and full diffs again.
2. Create a SEPARATE owner-approved integration branch from an agreed base, not main and not by overwriting the Cline branch.
3. Merge Prisma models/relations and reviewed SQL migration order, then generate Prisma Client in disposable PostgreSQL only.
4. Manually reconcile overlapping Admin Products API and personal-admin-app UI; retain CMS, catalog attributes, stock/variant controls and auth.
5. Test Category hierarchy/visibility and brand status against Shop, Search, Product Detail, Cart and checkout. Test SKU/warehouse stock precedence and atomic order races.
6. Run all unit, isolated PostgreSQL, HTTP and Chromium tests at exact integration SHA. Verify staging with real seeded catalog and admin operations before discussing production.
7. Require owner approval before any final merge/deployment/migration. Separate QA branch remains read-only unless owner explicitly authorizes integration.

## Current GPT milestone

On GPT branch alone, introducing a read-only checkout-attempt recovery route. Input is an existing high-entropy Idempotency-Key and exact checkout email; result exposes ONLY order number/status/payment method/status, not customer address or items. This is a bearer-capability-style recovery shortcut; full details still require separate email OTP tracking. This route never creates users, orders, reservations or payment sessions.
No Cline code was changed or copied here. Return/refund work remains paused.

## Addendum — GPT-side compatibility improvements (28 Oct)
The GPT-only Admin Products response now also supplies the Cline-readable description, compareAtMinor, featured, brandSlug and categorySlug fields using the existing GPT Prisma relations. It adds SKU-aware stockSource/availableStock/activeVariantCount/totalVariantCount/effectivePriceMinor while retaining legacy onHand/reserved and base price for admin editing. This narrows API response divergence, NOT Prisma model divergence: Cline hierarchical Category, Brand flags, AttributeDefinition and HomepageBanner remain absent on GPT. Neither branch has been merged or written by the other. Do not infer staging or merged correctness from branch-local contract tests.
