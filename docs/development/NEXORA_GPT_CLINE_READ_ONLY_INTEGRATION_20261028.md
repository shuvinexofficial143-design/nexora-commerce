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


## 28 October 2026 — Cline-Compatible Category/Brand Visibility & Recursive Hierarchy
- **Branch:** feature/nexora-gpt-customer-ops only. **No Vercel deploy**, no production/staging database writes, no other branch changes or merge.
- Read latest Cline branch `7da466b7f5c358df633177d0f53108b28570bc9a` without altering it. Added Cline-matching Category fields `description,imageUrl,sortOrder,visible,archived,parentId,parent,children` and Brand fields `description,logoUrl,active,featured` on GPT Prisma model. Reviewed additive SQL at `prisma/reviewed-migrations/20261028_catalog_hierarchy_visibility.sql` is **NOT run against production**.
- Admin Product Taxonomy now supports selecting parents, updating category visible/archived/sortOrder/parentSlug, brand active/featured. Server rejects invalid PATCH fields, missing references and parent cycles. Admin adds nested category creation and Manage Visibility/Hierarchy UI. Audit for owner-only updates.
- New recursive PostgreSQL eligibility policy considers **all ancestors** and fails closed on hidden/archived ancestors or cycles; no finite hierarchy-depth cap. Uncategorised or unbranded products remain allowed for legacy compatibility, but any product assigned to a hidden/archived category or inactive brand is excluded.
- Applied the same eligible-product filter in ordinary Prisma list, product detail, public facets, SQL-based effective SKU price/stock search (before LIMIT/COUNT), Checkout Preview and fresh Order Reservation transaction. Existing committed order idempotency replay remains possible after category/brand is hidden and never double-reserves stock.
- Published Homepage Banners cannot promote hidden/archived categories or hidden ancestors via `categorySlug` or supported `/shop?category=` target. Demo mode remains separate.
- Added Unit/auth and isolated PostgreSQL regression tests covering deep hierarchy, ancestor visibility, archived children, inactive/featured brands, all catalog/price SQL/facets/detail, quote rejection, order rejection + no reservation, idempotent replay, cycle prevention and banner visibility. Existing CMS integration fixture now creates a real category for its promotion.
- Remaining Cline schema features **not yet merged**: AttributeDefinition/Product.attributes, hierarchy attributes/editor, category images/metadata editors. Final integration branch and staging checkout/payment verification still need owner-approved separate milestones.
- Do not claim exact-HEAD CI success until the fresh workflow passes.


## 28 October 2026 — Product Attributes/SKU-safe Specifications CMS (GPT branch only)

- **NO VERCEL DEPLOYMENT.** User requests coding, tests, and GitHub commits only until final integrated launch. No production DB migrations, real payments or unapproved integration branch writes.
- Read latest Cline AttributeDefinition model and attributes API; preserved Cline's exact `AttributeType` enum, `AttributeDefinition` fields/unique/index, `Category.attributes` relation and `Product.attributes Json?` contract on GPT branch. Additive reviewed SQL in `prisma/reviewed-migrations/20261028_product_attributes_compatible.sql` **not run in production**.
- Owner-only `GET/POST/PATCH /api/admin-app/catalog/attributes`: list/create definitions and active state, bounded field/type/option validation, unique per category and audit; no unauthenticated access.
- New Admin Product section for category-specific attribute definitions with all eight Cline types; Admin Product Editor renders typed options and sends saved attribute values. Draft Products can have missing required values; Publishing or editing an ACTIVE Product validates all active required specs. Category change clears incompatible specs atomically; malformed/unknown values or invalid options cannot update price or state.
- Public product serialization now presents only definitions explicitly ACTIVE, with stored valid attribute values as Specification rows. No guessed material, RAM, color, warranty or delivery claims. Normal SKU price/stock selection and order reservation logic unchanged.
- Added pure validation tests, anonymous-owner API tests, and isolated PostgreSQL transactional integration: add definitions, required activation checks, safe read display, invalid update rollback, category-switch cleanup, deactivate without database loss.
- Cline/QA/main branches remain untouched. **A final explicit integration review is still needed** for Cline admin catalog editor, new Product Attributes, SKU/priced variant schema, categories and banners. This milestone requires exact-head CI verification; do not declare it verified before successful run.


## 28 Oct 2026 — GPT/Cline Integration Milestone: Product Image Gallery

- **No Vercel deploy; no production schema migrations; no branch merge.** GPT feature branch only.
- Independently compared live branch HEADs: GPT `bafeeceaf5da3f8cf4c105311fee188a0745a9d2`; Cline `924b7fcec971e507b6204e763be7e4443c34827f`; QA `69cc280e24cdb1e1e148b8199227e5190ff8d411`. Both product-admin.ts and personal-admin-app.tsx diverged substantially. Cline bulk publish currently bypasses GPT category-specific required attribute validation, so **DO NOT blindly copy bulk publishing**.
- Safely ported Cline's `components/admin/product-gallery-editor.tsx` to GPT with separate, Cline-compatible `sortOrder` conventions: 0 primary poster, 1 video, 10..29 extra gallery images. Added `lib/admin/product-gallery.ts` normalization and admin serialized `galleryImages` in the existing GPT SKU-aware serializer without changing stock/price fields.
- Admin Create/Edit Product Forms now allow up to 20 approved HTTPS images, upload, reorder/remove. Creation and updates use one existing Prisma transaction; extra gallery replaces only its reserved [10..29] records. Poster or video update/delete cannot accidentally overwrite or remove the first gallery image; unsupported/duplicate media inputs abort before updating product price/media.
- Existing public Product page image mapping and Gallery read `ProductImage` records ordered by sortOrder, so extra images are visible without touching checkout/Pricing/SKU safety.
- New pure unit tests and disposable PostgreSQL integration tests cover create with poster+video+gallery, admin serialization and live mapping, poster-only update, reorder/removal, invalid rollback and poster deletion without gallery loss.
- Outstanding Cline features: bulk publish/draft/feature controls, compareAt price admin edit, category image metadata editor, Attribute advanced editor and QA-specific tests; require carefully reviewed ports or separate integration branch. Avoid a raw Cline merge that overwrites GPT checkout, order recovery, SKU, security, search and banner changes.
- Exact final GPT HEAD CI must succeed before marking this milestone verified.


## 28 October 2026 — GPT/Cline Integration: Safe Bulk Product Management (CI pending)
- **No Vercel deployment, no production/staging migrations or writes, no cross-branch merge.** GPT branch only.
- Read Cline Bulk service/API contracts from `9a4d17d609bd2e54800ab05ffea6f61e109e0469`; preserved actions `PUBLISH`, `MOVE_TO_DRAFT`, `FEATURE`, `UNFEATURE`, max 25 products and `updatedAt` revision pins.
- Re-implemented Cline Bulk inside GPT's SKU-aware backend with a **single Serializable transaction**. All revisions validated before changes; concurrent edits return conflict; archived products rejected.
- Crucial GPT-only protection: all draft→ACTIVE transitions are validated with the same `validateProductAttributes` required/typed specification logic as individual publishes, plus full recursive public Category eligibility and active Brand eligibility. No price/stock, choice-group or SKU mutation in bulk. Already ACTIVE products in a PUBLISH request are left unchanged.
- Each changed row gets a bound-parameter `PRODUCT_BULK_*` audit entry **within the transaction** so failed batches leave neither partial product state nor misleading audit records. Existing raw `AdminActivityLog` schema is required; QA test creates it only on disposable local PostgreSQL.
- New Admin Products section with checkbox selection, action choice, Apply, Clear, loading/error feedback and refreshed table after success.
- Added pure input validation, unauthenticated API, isolated PostgreSQL rollback/required field, hidden-category/inactive-brand, revision conflict, featured/draft, idempotent no-op and audit tests. No production payments or data changed.
- Cline Gallery port from prior milestone remains; Cline's remaining Catalog UX, compare-at editor and Final Branch Integration are still separate tasks.
- Do not claim exact HEAD CI success until GitHub run completes.


## 28 Oct 2026 — Remaining Catalog Admin Integration: Original Price + Category/Brand Display CMS
- GPT branch only; **NO VERCEL deployment**, no production database writes, no Cline/QA/main merge.
- Verified Cline catalog metadata and compare-at field names; GPT Prisma models already had `compareAtMinor`, `Category.description/imageUrl`, `Brand.description/logoUrl`: no schema migration needed.
- New strict `lib/admin/catalog-pricing.ts` normalizes INR original price into integer paise, rejects nonnumeric/negative/oversized values, rejects original price below the final selling price. Parent original price is deliberately suppressed for independently priced SKU variants in the existing public mapper.
- Owner create/edit product forms now accept optional original price and support explicit clear. Both price and original price are validated together inside existing Prisma transaction, so invalid edits cannot change description or selling price.
- Category and Brand admin listing and PATCH now manage optional descriptions and approved HTTPS category images/brand logos via shared `lib/admin/catalog-metadata.ts`, including explicit removal. New Admin editor uses existing image uploader, without inventing image URLs or mutating gallery.
- Live homepage category metadata is derived only from eligible visible categories with published products; approved owner-provided images and display order override fallback product imagery. Unapproved or stale media URLs are ignored, hidden categories are never inserted into public categories. QA demo continues using its own sample categories.
- Tests: pure price/metadata validation and homepage category fallback, plus disposable PostgreSQL create/edit rollback, comparison price display, CMS persistence, invalid media rollback, hidden category exclusion. Exact-head GitHub CI required before considering verified.
- Remaining: Cline nonconflicting editor details, final integration branch review, staging configuration, real Cashfree/checkout and full production readiness QA.
