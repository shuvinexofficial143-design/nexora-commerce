# GPT Customer Operations — Handoff / Next Command

**Owner branch:** `feature/nexora-gpt-customer-ops` (never `main`, `feature/nexora-gift-store`, or `feature/nexora-qa-automation`).

## Continuation rules
1. Query the latest remote HEAD, feature-only workflow and `docs/development/GPT_CUSTOMER_OPS_PROGRESS.md`.
2. M1 implementation is COMPLETE in isolated CI — code SHA `56ee2024dc566839bd34ddbb250fd43d302fc0a1`, [successful 3-job CI run 39628791391](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39628791391): 82 unit + 16 real Postgres + 8 HTTP + 14 desktop/mobile browser checks all PASS. Re-check any new failures rather than relying only on this text.
3. Keep production rollout blocked until reviewed migration, OTP secret and real Resend delivery validation.
4. **OWNER REPRIORITIZED:** Return/Refund M2 is PAUSED until specifically requested again. On next `next`, continue substantive REAL SHOPPING WEBSITE work instead. Prioritize catalog truthfulness, product detail/delivery availability, and shopping/search experience, while avoiding Cline-owned Admin/Homepage CMS.
5. Do not repeat old architecture or modify Cline-owned product management, homepage, category, or universal attribute files.
6. No production deployments, schema migrations, emails, refunds or paid courier APIs.

## Secure guest tracking APIs
- `POST /api/backend/orders/track/request`: JSON `{orderNumber,email}`. Returns 202 generic message and `challengeId`; actual email sent only when matched.
- `POST /api/backend/orders/track/verify`: JSON `{challengeId,code}`; returns temporary `accessToken` on one successful verification.
- `GET /api/backend/orders/track`: header `Authorization: Bearer <temporary-token>`; never GET order + email directly. Returns current status/items/timestamps/address/payment/eligibility guidance.
- Existing checkout/order creation API untouched.

## Required CI
`.github/workflows/gpt-customer-ops.yml` runs existing units, new security tests, lint, TS, build, strict audit, isolated postgres tests, actual Chromium tracking UI and existing storefront browser regressions. Fill in exact final CI results and SHA after execution.

## Completed CI proof
82 unit PASS; 16 isolated PostgreSQL PASS; 8 localhost HTTP PASS; 14 actual Chromium PASS; TypeScript, lint, production build, security audit PASS. No real emails or production DB were used.

## Current known blockers
Additive tracking challenge SQL needs production schema review and controlled application. Real configured Resend delivery and shared rate limiting need staging/production validation. No production migration or real email in QA.

## Latest owner-directed Website work — important
On 21 Oct 2026 user explicitly said "return refund bad ka he abhi real websit pr toh kam karo": DO NOT automatically resume Return/Refund milestone.

- New live product search milestone code: `9ec406a050473878d08ff2238ad5f053ff2cea1f`.
- Verified CI: [39631607170](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39631607170), all 3 jobs SUCCESS, 130/130 tests PASS.
- Query independent of first 100 products, server-side ACTIVE-only brand/category/SKU matching, real counts and 18-per-page pagination, responsive debounced suggestion dropdown.
- No production deployment or Cline branch merge.
- Current integration risk: `components/search/search-bar.tsx` and `app/search/page.tsx` modified on GPT branch only. Check whether Cline modifies these before integrating.
- The next website milestone should audit demo fallback and fake delivery promises in `lib/catalog-backend.ts` and `components/product/delivery-checker.tsx`, then implement independently verifiable real improvements without overriding Cline's current Admin/CMS changes.

## Latest real website checkpoint — 21 October 2026
Owner's Return/Refund deferral remains in force. Branch implementation `009f15aabe0ee7208d584837d00d8bc5b98fb614` was verified in [GitHub Actions 39633739840](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39633739840): 97/97 unit, 26/26 real temporary PostgreSQL, 8/8 localhost HTTP and 14/14 Chromium checks PASS; TypeScript/lint/build/security PASS.
The live Shop now has actual PostgreSQL pagination and multiple facets, and the live Product Detail no longer invents examples, guarantees, offers, reviews, demo images or delivery dates. Do not overwrite recent live search `app/search/page.tsx` / `lib/storefront/product-discovery.ts` commits. `NEXORA_QA_DEMO_CATALOG=true` with blank DATABASE_URL is only for isolated browser QA.
Next: real-product Cart/Checkout alignment, Admin variants and shipping truthfulness; coordinate Cline Admin/Homepage CMS integration. No production deployment or merge authorized.

## Checkout Preflight Milestone — Latest 21 Oct 2026
Owner's priority remains **REAL WEBSITE**, NOT Returns/Refunds. Latest implementation SHA `410f13ecf413dec06180e553175e91e66ceb55e3` with [3/3 successful CI jobs 39636936442](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39636936442): 102 unit, 32 isolated PostgreSQL, 8 localhost HTTP, 16 Chromium checks PASS = **158/158**. TypeScript, lint, build and security audit PASS.
Main new files: `lib/commerce/order-pricing.ts`, `lib/commerce/checkout-preview.ts`, `app/api/backend/checkout/preview/route.ts`, `lib/api/checkout-preview-client.ts`. Also CheckoutPage/CheckoutSummary/CartProvider, shared order pricing, standard-delivery guard and tests. Prices, stock, coupons and shipping are server-verified before checkout; buyer must confirm changed cart prices. No production data was touched.
**Outstanding:** Cline branch retains Admin and Homepage CMS; no approved merge. No variant-aware SKU/inventory schema in current working branch or latest audited Cline branch; don't falsely claim custom options work. Courier serviceability, GST rules, sandbox payment and live staging still unverified.
Next `next`: continue substantial real-website work; coordinate independent branch integration only after reviewing its latest changes and owner authorization. Returns/Refunds remain deferred.

## Latest — 26 October 2026 Product Choices & Security Patches
Owner still wants **REAL WEBSITE**. New admin-controlled option groups are stored as `ProductChoiceGroup` (non-priced, no separate inventory), exposed via Admin Products editor, consumed by published product pages, stored as distinct Cart lines and verified in BOTH checkout preview and order transaction. See `lib/commerce/product-choices.ts` and `app/api/admin-app/products/[productId]/choices/route.ts`.
New reviewed SQL `prisma/reviewed-migrations/20261026_product_choice_groups.sql` was NOT run in production. The schema is additive and must be merged carefully with Cline's `HomepageBanner` and other work.
Critical dependency vulnerabilities from 26 Oct were handled: Next.js/eslint-config-next 16.4.3 and fast-uri 3.1.9, real npm lock regenerated in feature branch, security audit/typecheck/lint/build passed by the temporary protected GitHub job. Check **final exact-HEAD CI run** and retain all failures for follow-up. One-time privileged workflow was removed from the final docs checkpoint.
Next `next` must continue real Storefront, not Returns/Refunds. Never merge into main or deploy production without explicit owner request.

## 27 October 2026 — Latest REAL WEBSITE checkpoint
Priced SKU variants now have their own product/signature SKU, price, on-hand and reserved stock, validated by DB in Product Detail, Cart, Preview and atomic Order transaction, with CANCEL and DELIVER stock reconciliation. Reviewed migration `prisma/reviewed-migrations/20261027_priced_sku_variants.sql` **NOT applied to production**. Admin variants editor is on the isolated feature branch; Cline branch and main untouched. Checkout `expectedUnitPriceMinor` prevents post-quote price races. Functional exact-head CI `40454948802` verified 111 unit + 44 disposable Postgres + 8 HTTP + 14 Chromium = **177 PASS, 0 FAIL**, including TypeScript/lint/build and zero high-severity production vulnerabilities. Next: finish variant-aware SQL catalog filters/sorts and owner-reviewed Cline integration; no Returns/Refunds development. 

## 27 October 2026 — LIVE CATALOG VARIANT PRICE FIX (LATEST)
The previous handoff line saying Shop SQL price filters/sort used base price is **resolved** by `lib/db/catalog-price-query.ts` + `lib/db/products.ts`, fully parameterized effective `MIN(active SKU.priceMinor)` with base fallback and true DB pagination/count; variant SKU search included. On live SKU products, base product compare-at no longer implies a false discount. [CI 40456324343](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40456324343) verified 111 unit + 45 isolated PostgreSQL + 8 HTTP + 14 Chromium = **178 PASS / 0 FAIL**, TypeScript, lint, build and audit pass.
Latest functional SHA `8fa632dc88a79d8d95c980e2d5efba7293d69d18`. Next docs HEAD may trigger another exact SHA CI.
READ-ONLY integration note: Cline `feature/nexora-gift-store` was `4df818003fd4b53db83c03d10989609757efb4d6`; `main` was `3c20daa120793ae7185f63d014295c81d86fe7d8`. No merge or local Cline edits. Do not claim any real merge or staged local preservation verified; reviewed migration and eventual combined full CI are necessary first. No production DB migration / deployment; Return/Refund work deferred.

## Nexora 3 Search Variant Parity Checkpoint
GPT-owned Search pages and suggestions now use real active variant prices and available stock and match SKU-only terms; tests added for retired SKUs, reserved stock and sell-out. Verify **exact new HEAD** CI before marking this milestone complete. Next milestone candidates: live in-stock filtering across Shop and Search or read-only Cline integration review based on real code. Return/Refund remains PAUSED; no migration, deployment or merge.


## Nexora 3 — Stock Availability Filters across Shop and Search
Adds persisted GET stock facets (available, low-stock, out-of-stock) in Shop, available-only keyword Search, shared variant-aware SQL filtering before pagination, and isolated PostgreSQL/unit regression. Exact-HEAD CI must be verified before PASS. Cline/main/QA separate; never merge/deploy/migrate, and Returns/Refunds remain deferred. Next: Product Detail to Checkout stock availability coherence and safe Cline integration review.

## Nexora 3 — Product Detail → Cart Live Admission
Feature branch now includes buildCartAdmissionRequest/assertCartAdmission, shared addVerifiedItem in CartProvider, desktop/mobile Product Detail stock+price checks before adding, and a cart page live quote with explicit price acceptance and fail-closed checkout link. New isolated PostgreSQL/units test reserved SKU and price race. Verify exact-HEAD CI, do not falsely claim live staging. Next owner next: address reviewed staging integrations/remaining cart and checkout order race edge cases without merging Cline/QA/main. Returns/Refunds deferred.

## Nexora 3 — Checkout Recovery and Immutable Order Intent
GPT branch adds checkout-submission helpers with canonical intent checks, validated quote-to-order SKU mapping, immediate in-flight duplicate guard, and session-scoped Cashfree pending-order recovery (SHA-256 intent digest; no address in storage). A created online order is reused on retry rather than reserving stock twice. Explicit new-checkout action never cancels old order. COD success preserves cart changes made mid-submission. New unit and isolated PG tests cover reordering, price/stock, variant mapping and keyed order replay. Verify exact SHA CI; staging/payment integration remains outstanding. No deploy, migration, refund/return development or cross-branch merge.

## 28 Oct — Network Checkout Outcome Recovery & Cline Read-only Review
Branch-only feature: POST /api/backend/orders/recover validates high-entropy checkout attempt key and email; returns minimal orderNumber/status/payment state without customer PII. Existing guest OTP route remains required for detailed tracking. Client stores key+fingerprint+email, checks on reload/ambiguous network response, blocks fresh orders until recovery or explicit separate-checkout action, retries ONLY exact original in-memory payload/key, and can resume the already-created Cashfree order. No persistent address/cart data. Real DB tests cover lookup and exactly-once stock reservation; exact HEAD CI required to call verified. See docs/development/NEXORA_GPT_CLINE_READ_ONLY_INTEGRATION_20261028.md for independent Cline schema/Admin collision review. Cline/main/QA untouched; production migration/deploy/payments and Return/Refund remain out of scope.

## 28 Oct — SKU-aware Admin Product List and Recovery Chromium
Files: lib/admin/product-list-row.ts (typed serializer), app/api/admin-app/products/route.ts, components/admin/personal-admin-app.tsx, tests/admin-product-list-compatibility.test.ts, scripts/qa/browser-e2e.mjs and Checkout recovered-order OTP link. The GPT Admin endpoint now returns fields overlapping Cline Admin (categorySlug, brandSlug, description, compareAtMinor, featured), plus explicit sku/warehouse stock source, active variant count, sellable available units and minimum active SKU price, preserving base and warehouse edit fields. Chromium simulates 200/404/503/malformed attempt in desktop + mobile using local interception, never makes real order/payment requests. Verify exact commit CI. Cline/main/QA remain read-only; still require owner-approved combined Prisma migration and full integration tests.


## 28 October — Vercel Preview CTA Contrast & Clear Demo Labels

Root cause: Tailwind CSS v4 uses cascade layers, but app/globals.css declared an unlayered global `a { color: inherit; text-decoration: none }`. This overrides layered `text-white` and `underline` utilities on link buttons. Fixed the anchor rule by moving it into `@layer base`, restoring utility precedence across the storefront. Admin password placeholder contrast also increased. Added actual Chromium desktop/mobile computed-style contrast tests for empty-cart CTA, unavailable-Shop retry CTA, and owner-login button/password input (3 per viewport). No credentials or live payments were used.

For safe preview inspection only, existing `NEXORA_QA_DEMO_CATALOG` feature flag can be enabled on the GPT branch's Vercel Preview environment (not Production) when DATABASE_URL is absent. Demo Shop and Product Detail now clearly state SAMPLE PRODUCTS and that checkout/payments are not configured. Demo does NOT supply genuine inventory, order/payment capabilities or owner credentials; for live product management, an isolated staging DATABASE_URL, reviewed migrations and ADMIN_USERNAME/ADMIN_PASSWORD are still required. Cline/main/QA remain unmodified. Latest exact-HEAD CI verification required.

## 28 Oct 2026 — REAL HOMEPAGE DATA + VISUAL REFRESH (GPT branch)

Customer-facing milestone based on user Vercel screenshots:
- Replaced old app/page.tsx hardcoded product/brand/promotional/claim sections with a redesigned responsive homepage, using an actual current, ACTIVE DB product list (bounded to 48) and the existing verified SKU-aware mapper; does not make unverified claims about sales volumes, ratings, stock, returns, dispatch, memberships, or "trending".
- Entire homepage pulls hero product, category cards/counts/images, newest product grid, other discovery products and brand names from the SAME listed product set. The count on category cards is explicitly a "current selection" count, not full-catalog statistics. Featured/new products exclude out-of-stock entries, and only links to existing slugs are shown.
- Desktop and mobile home is visibly different: large lime/dark split hero, real product spotlight, dynamic category image grid, product shelf and brands. An empty or unavailable live DB shows an explicit status instead of falling back to fake stock and example products.
- The existing opt-in preview demo flag NEXORA_QA_DEMO_CATALOG remains separate, clearly marked and only active with no DATABASE_URL. Preview demo items are NOT purchasable as live inventory. No production data/migrations/payments were touched.
- New pure helper and tests for category counts, deduplicated slugs, available SKU selection, brands, empty list and invalid URL slugs. New local Chromium desktop/mobile checks for homepage content/claims and category navigation. Exact HEAD CI required.
- Cline's separately developed HomepageBanner, catalog hierarchy/Brand lifecycle require a reviewed integration branch before live CMS features may be merged. Do not claim CMS control is already connected.

## 28 October 2026 — Owner Catalog Taxonomy to Live Homepage Integration

**Only GPT branch. VERCEL DEPLOYMENT IS DELIBERATELY DEFERRED UNTIL FINAL RELEASE.** No Vercel API calls, preview builds, promotions, production updates, schema migrations or payment requests in this milestone.

- Owner admin now provides a Categories and Brands management form and selectors in Create Draft Product and Edit Product. Create/list live category and brand options using the new authenticated `/api/admin-app/product-taxonomy` endpoint. Duplicate slugs conflict; invalid names/slugs are rejected.
- Real Product create/update transactions can associate existing categories and brands via validated slugs, reject unknown targets without partial price updates, clear an association, edit description and retain existing video/poster behavior. Audit records for category/brand create.
- Existing SKU-aware Shop/Live Homepage query is reused; no second catalog cache or fake merchandising data was introduced. Admin list already serializes categorySlug and brandSlug, so edit form can prefill live associations.
- Added pure validation tests for category/brand input and isolated PostgreSQL E2E tests: options persist, create DRAFT and verify unlisted, activate product, record actual available stock, confirm live homepage and catalog pricing/category/brand, relocate category while atomically changing price, fail unknown slug without partial update, alter active SKU availability, archive and remove public visibility.
- DB E2E requires local disposable PostgreSQL opt-in. Cline's Category hierarchy/Brand status flags/HomepageBanner schema remain distinct and unmerged. Future owner-approved integration branch and staging DB are still needed. Production remains untouched.
- This milestone requires exact-HEAD CI before it can be described as verified.


## 28 Oct 2026 — Homepage Banner CMS, GPT Branch Only (pending exact-HEAD CI)

This milestone intentionally makes **NO VERCEL deployment**. User explicitly directed: keep coding/testing in GitHub until final release.

- Reconciled Cline banner model read-only (Cline branch HEAD 41fa06c4ce32f28b9c64ea831fd41a0584f7bf2a); introduced an identically named `HomepageBanner` Prisma model with matching Cline field names and index on GPT branch, plus a reviewed additive SQL migration at `prisma/reviewed-migrations/20261028_homepage_banner_compatible.sql`. No external or production migration performed.
- Authenticated owner `GET/POST /api/admin-app/banners`, `PATCH /api/admin-app/banners/[bannerId]` (matches Cline API path), only verified owner session, no-store responses, explicit audit records, meaningful HTTP 400/404 for invalid/not-found input. No delete/public write.
- New `/admin/banners` owner UI with Create, desktop and mobile images, CTA destination/text, optional category, sort order, Draft/Published/Archived states, editor, media upload integration, and safe fallback when empty. Sidebar navigation added.
- Public `app/page.tsx` uses dynamic server-side `getPublishedHomepageBanners`. Non-demo mode shows first published/non-archived banner as hero and up to four additional banners in order; when none exists, existing SKU-aware product spotlight remains. Demo catalog mode does not access live banner DB and cannot imply a real published campaign. SQL listing fails closed if unconfigured/unavailable.
- All image URLs restricted to approved HTTPS hosts already allowed by Next image config; CTA internal shop/search/product/track-order only; dangerous external/protocol-relative URLs, oversized content, malformed slugs/fields and noninteger sort order rejected. Archived banners unpublish. Existing stale invalid records are filtered from public views.
- Unit/security tests cover URL validation and anonymous GET/POST/PATCH denial; isolated PostgreSQL tests cover unpublished/draft privacy, published order, mobile image, atomic invalid edits, archive/unarchive and unpublish. CI must pass on the exact final SHA before claiming verified.
- Cline and QA branches not changed or merged; integration conflict risk persists for other Cline catalog/brand/category models and the combined product-admin UI. No real Cashfree payment, email, customer order, returns/refunds, or production DB change.


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


## 28 Oct 2026 — Advanced Attribute Filters and Product Search Facets (CI pending)

Owner requested coding only; **NO VERCEL deployment** and no Production/staging DB writes. GPT branch only; Cline/QA/main unchanged.

- Added strict repeated `attr=categorySlug.attributeSlug:value` URL contract with bounds (20 selections, 8 groups, 8 values per group), fail-closed malformed input and stable filter pagination.
- SQL-based product filtering combines multiple values of same attribute with OR and different attribute groups with AND, scoped by exactly matching active `AttributeDefinition` and category slug. JSONB scalar typed values and MULTI_SELECT array membership support TEXT, NUMBER, BOOLEAN, SELECT, COLOR and MULTI_SELECT. The SQL filters before COUNT, SKU-effective-price, stock and LIMIT/OFFSET; no in-memory post-pagination count mismatch.
- Live Shop adds owner-defined Attribute Filters (select/boolean multiple choice, exact TEXT/NUMBER), retains choices through URL; combines with Category, Brand, Stock, Price, Rating and Sorting.
- Public attributes exposed only for eligible visible categories with active published products. Search Page links keyword queries to the Advanced Shop filters; public Products API now accepts the bounded `attr` and `stock` query parameters. Direct Search autocomplete/text search still uses its existing verified backend; attr filtering is exposed via /shop?q=... or /api/backend/products.
- Pure parsing/URL roundtrip tests and isolated PostgreSQL fixtures test OR/AND matches, MULTI_SELECT, false BOOLEAN, exact material TEXT, filtered SQL price ordering/pagination, draft/hidden/brand and inactive-definition protections.
- No production migration, Vercel deployment, real payment, unapproved Cline merge or branch change.
- Confirm latest exact SHA TypeScript, ESLint, build, unit, DB and Chromium CI before declaring verified.


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
