# GPT Customer Operations — Persistent Development Progress

## Branch and baseline
- Owner repository: `shuvinexofficial143-design/nexora-commerce`
- **GPT-owned branch:** `feature/nexora-gpt-customer-ops`
- Verified initial baseline: `cb29ef24dee75c7b6b302cecc2944908dd7f10d8` from `feature/nexora-gift-store` (21 Oct 2026).
- QA reference branch: `feature/nexora-qa-automation` — read only.
- Cline feature branch and main were not modified.

## Milestone 1 — Secure guest order tracking
**State: COMPLETE in isolated CI (21 Oct 2026). Production release BLOCKED pending reviewed schema migration, secret and real email-provider configuration.**

### Existing feature audited
- `/track-order` already had a UI and query-based lookup.
- Old `GET /api/backend/orders/track?order=...&email=...` revealed item and payment details to anyone who knew an order number and email, without proving email ownership.
- Guest checkout, order status, customer emails (Resend), and PostgreSQL order persistence already existed. Reused these.

### Real implementation
- `lib/orders/secure-tracking.ts` — order/email validation, generic no-enumeration challenge request, 6-digit HMAC-hashed OTP, 10-minute expiry, 5 server-side attempts, 60-second per-order cooldown, single-use verification, 256-bit random short-lived access bearer token stored only as SHA-256 in DB, private order projection, honest status guidance and timeline.
- `app/api/backend/orders/track/request/route.ts` — rate-limited email challenge request; no order leakage.
- `app/api/backend/orders/track/verify/route.ts` — rate-limited code verification.
- `app/api/backend/orders/track/route.ts` — rejects legacy unauthenticated query lookups and requires verified Authorization bearer token with no-store.
- `components/orders/track-order-client.tsx` — mobile-friendly two-step form, useful errors/loading, private order details, purchased products, payment, address only after verification, timeline from real order timestamps, cancellation/return guidance.
- `lib/notifications/customer-email.ts` — exports existing Resend sender; no new paid provider.
- `prisma/schema.prisma` — additive `OrderTrackingChallenge` with order relation and token uniqueness.
- `prisma/reviewed-migrations/20261021_tracking_challenge.sql` — additive SQL, review only. **Not applied to production.**
- Isolated unit, real PostgreSQL and browser security regression tests plus feature-only CI.
- Existing checkout/inventory/customer/Admin functionality preserved.

### Required environment and production release gate
- `ORDER_TRACKING_SECRET`: dedicated random secret, at least 32 characters; do not reuse passwords or commit real keys.
- `RESEND_API_KEY`, `ORDER_EMAIL_FROM`: existing verified Resend sender, required for OTP email.
- Existing `DATABASE_URL` / `DIRECT_URL`.
- Production must have reviewed and applied `OrderTrackingChallenge` table; repository has no historical migrations baseline. Do not assume Prisma db push is safe in production.
- In browser/local fallback CI without email config, tracking page renders but requesting OTP returns 503 without sending anything. This is intentional fail-closed.
- Emails are mocked in isolated DB integration tests; no real email, payment, or refund attempts.
- OTP token only in active tab memory, deliberately lost on reload; user can request verification again.
- No shipping provider integrated; never invent courier events or delivery promises.
- Existing IP rate limiter is in-memory and derives IP from forwarded headers; multi-instance/shared rate limiting and proxy trust need review before production. Per-order DB challenge cooldown and five-attempt cap still apply.
- Status-specific cancellation and return messages explicitly describe **review**, not guaranteed eligibility.
- Existing customers should be informed that tracking now requires email OTP instead of mere email entry.

## Verification and rollout status
- Code checkpoint: `56ee2024dc566839bd34ddbb250fd43d302fc0a1`.
- Verified GitHub Actions: [Run 39628791391](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39628791391) — **all 3 jobs SUCCESS**.
- Unit/security-contract tests: **82 passed, 0 failed**.
- Isolated PostgreSQL checkout + tracking integration: **16 passed, 0 failed**. Real stored-order lookup, wrong-email privacy, 5-attempt lockout, OTP replay prevention, access expiry and email-sender mocks all executed.
- Local HTTP smoke: **8 passed, 0 failed**.
- Chromium browser: **2 secure-tracking desktop/mobile checks + 12 existing storefront flows passed, 0 failed**.
- TypeScript, ESLint, Next production build and strict production dependency audit: **PASS**.
- Combined executed assertions/check cases: **120 PASS / 0 FAIL** (82 unit + 16 PostgreSQL + 8 HTTP + 14 browser). This is QA validation, not a live-production claim.
- No live production DB, shipping, Resend, paid APIs, or checkout payments verified.
- Customer Returns/Refunds M2: **PAUSED BY OWNER** — owner explicitly redirected development to real shopping website, 21 Oct 2026. Existing return/refund code was inspected read-only and not edited in this turn.

## Risk / integration notes
- Cline owns Homepage/Product Admin/CMS/Attributes; this branch has not modified those files.
- The shared `prisma/schema.prisma` has an additive tracking model and Order relation; coordinate schema merge and controlled DB migration with checkout attempt model.
- `lib/notifications/customer-email.ts` receives a one-line export only.
- Original `app/api/backend/orders/track/route.ts` and `components/orders/track-order-client.tsx` are narrowly replaced because old verification was insufficient.
- Do not auto-merge this branch into Cline or main.

## Storefront real-website milestone — Live Product Discovery (21 October 2026)

**State: COMPLETE in isolated CI.** Owner requested real website progress instead of Return/Refund.

### Actual code delivered
- `lib/storefront/product-discovery.ts`: PostgreSQL-backed server search of ACTIVE products, AND-across-tokens matching name/SKU/short description/category/brand, stable sort, 18-result pages, max 100 navigable pages, real result count and safe field selection. No restriction to first 100 catalog products.
- `app/api/storefront/search/suggestions/route.ts`: public live suggestions, up to seven product results, maximum query input, rate-limit handling, no private customer fields.
- `components/search/search-bar.tsx`: both mobile/desktop site-header search bars support debounced live suggestions, accessible keyboard navigation, result prices, category and brand, and direct product links.
- `app/search/page.tsx`: database-backed search results, valid pagination links, explicit unavailable state and clear no-results state.
- Demo search data is used only when `NEXORA_QA_DEMO_CATALOG=true` **and** the database URL is empty — set only in isolated browser CI, never in real catalog operation.
- Existing homepage CMS, Admin Product Management, Cline files, payment, checkout, inventory, Returns/Refund and the QA branch were not changed.
- Added six new deterministic unit checks, four isolated PostgreSQL checks including 121-product search coverage, desktop/mobile browser regressions, and CI-only demo environment.

### Verified execution
- Code checkpoint `9ec406a050473878d08ff2238ad5f053ff2cea1f`.
- GitHub Actions [Run 39631607170](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39631607170): **3 jobs SUCCESS**.
- 88/88 unit tests PASS, 20/20 disposable PostgreSQL integration PASS, 8/8 local HTTP smoke PASS, 14/14 actual Chromium desktop/mobile checks PASS.
- TypeScript, ESLint, Next production build, strict production dependency audit: PASS.
- Total **130/130 executed checks PASS**; live production web deployment NOT performed.
- No production schema change was needed for storefront search.

### Follow-up / integration scope
- User-facing Search improvement exists on `feature/nexora-gpt-customer-ops`, **not** on Cline's actively developed `feature/nexora-gift-store` and not on `main`. Owner approval and reviewed merge are required before it appears on live website.
- Cline owns Admin, Homepage CMS and universal product attributes; avoid parallel edits/automated merges.
- Next requested real website priority: improve truthfulness/reliability of product availability and delivery messaging, review fake demo/catalog fallback behavior for actual production, and verify real navigation/UI on Cline's latest baseline.
- Existing `lib/catalog-backend.ts` still has its older demo fallback and unverified delivery labels; **NOT fixed by this search milestone**. Do not describe all product discovery as production-ready until these are resolved.
- No live PostgreSQL, Resend, paid API, production payment or deployed storefront test was performed.


## Live Shopping Website — Product Catalog and Truthful Product Details (21 October 2026)

**Implementation: COMPLETE in isolated CI.** Owner explicitly deferred Returns and Refunds; the work continued the storefront, without starting new returns development.

### New functional behavior
- `lib/db/products.ts`: supports multiple categories and brands, database-level name/SKU/description/category/brand search, price bounds, rating filters and deterministic Featured/Price/Rating/Newest sorting. Product count and 24-item pages are calculated from PostgreSQL, not the first 100 items. Published/ACTIVE products only.
- `lib/storefront/catalog-query.ts`: validated multi-select query parameters, price/rating/page bounds, safe page links and explicit QA preview opt-in.
- `lib/storefront/catalog-data.ts`: paged live DB queries, active category/brand facets and stale-page clamping.
- `components/catalog/live-catalog-view.tsx` plus `app/shop/page.tsx`: responsive shop with mobile/desktop category, brand, price, rating and sorting controls, pagination and useful empty/error states.
- `app/api/backend/products/route.ts`: keeps existing API shape while supporting bounded multi-filter DB query and pagination.
- `lib/catalog-backend.ts`: no implicit demo-product fallback in live mode (including DB downtime or zero published products); no fallback demo badges, imaginary delivery dates or demo product photos. Neutral local placeholder when no real image exists.
- `app/product/[slug]/page.tsx`: demo static product routes only when deliberately enabled in isolated preview.
- `types/catalog.ts` and `lib/product-detail-data.ts`: real products display the stored SKU, short/long description, actual image list and only true availability; no fictional reviews, unsupported warranty, offers, variants, category-based specifications or manufactured alternate image views.
- `components/product/delivery-checker.tsx`: validates Indian PIN format but explicitly does NOT claim courier serviceability or invent a delivery promise.
- `components/product/product-reviews-preview.tsx`, `components/product/frequently-bought-together.tsx`, `components/product/offer-list.tsx`, `components/product/product-service-strip.tsx`: live products omit fabricated review examples, unearned bundle-saving CTA, nonexistent offers and unproven easy-return/warranty claims; previews remain opt-in only.
- `public/product-placeholder.svg`: neutral locally served placeholder, not another product's photo.
- Real isolated Postgres regression covers 35 temporary catalog fixtures (34 ACTIVE, one DRAFT), multi-category/brand, sorting, filtering/search, page count and stock/no-stock accuracy. New deterministic unit tests verify data mapping/claims and input bounds.

### Verified delivery
- Functional commits `6bed117087af1f9060cfc3a4be9c8d2f1c48aace`, `d0f983af912c4cb015b3168d41b6ea0dc48e83e0`, `91061219c011e09fc421a160912c86ca1d2c87f8`, `009f15aabe0ee7208d584837d00d8bc5b98fb614`.
- CI [run 39633739840](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39633739840) **all three jobs SUCCESS**.
- 97/97 unit tests, 26/26 isolated PostgreSQL integration, 8/8 localhost HTTP checks, 14/14 desktop/mobile Chromium checks (12 storefront + 2 order-privacy UI). Total **145/145** tests PASS.
- TypeScript, ESLint, Next.js production build and strict production dependency audit PASS.
- No production deployment, migrations, refund, payment or customer email sent. No change to Cline feature branch, main or QA branch.

### Known release boundaries
- Search Suggestions milestone from earlier `9ec406a` is preserved. This milestone does NOT overwrite `app/search/page.tsx`.
- `NEXORA_QA_DEMO_CATALOG=true` with **no database URL** enables preview data only in isolated browser CI. Production should run real DB mode; do not enable demo flag.
- Live storefront needs actual published product records and a configured production/staging PostgreSQL database. No external production DB was inspected or mutated.
- Cline independently owns Admin Product Management, Homepage CMS, banners, categories and attributes. An owner-reviewed integration is required for these independent changes to appear together. Current GPT branch has no automatic merge into main.
- Unverified: deployed live website, real courier availability, actual admin-populated catalog and authenticated payment/checkout E2E.
- **Next owner-approved website milestone:** real Product Detail/Cart/Checkout consistency with Admin-set variants, truthful shipping charges, and final reviewed branch integration — NOT Returns/Refunds.


## Milestone — Real Cart → Verified Checkout (21 October 2026)

**Status: CODE COMPLETE, CI VERIFIED (isolated), NOT DEPLOYED.** Return/Refund development remains PAUSED by owner request.

### Root-cause audit
- Cart persists a local snapshot of price, name and stock, which can become stale when the Admin changes products or another customer reserves inventory.
- The existing order transaction always reads and charges current PostgreSQL price and reserves stock atomically, so old UI prices could disagree with actual order totals.
- Checkout UI advertised express/priority/same-day delivery and hardcoded arrival guarantees without any live courier integration or PIN serviceability proof.
- Admin schema currently has product-level inventory, price, SKU, images and category/brand but **no verified product-option/variant-price/variant-stock model**. Do not invent configurable variants before coordinating with Cline's Admin schema.

### Shipped code, feature branch only
- `lib/commerce/order-pricing.ts`: shared minor-unit price calculations for actual checkout and the preview, with existing 18% tax and standard ₹99 shipping below ₹999. Existing tax rule is preserved pending owner tax-policy review, not a claim all products legally require 18% GST.
- `lib/commerce/checkout-preview.ts`: bounded cart/quantity/price validation, read-only real ACTIVE product lookup, duplicate-line stock aggregation, current price comparison, stock and coupon checks, exact tax/shipping estimate, explicit invalid/unavailable reason codes; **no inventory reservation, order creation, email or payment**.
- `POST /api/backend/checkout/preview`: rate-limited public endpoint, no-store/no private order data. Only temporary QA DB was queried during testing.
- `lib/api/checkout-preview-client.ts` plus `components/checkout/checkout-page-client.tsx`: refreshes server-verified quotes when cart/coupon changes, shows current price/stock status and issues; customers explicitly accept updated prices to reprice their bag; quote is refreshed immediately before order submission; final transactional checkout safety still applies.
- `components/cart/cart-provider.tsx`: customer-approved price reconciliation of existing cart lines, preserving quantities/line IDs without silently changing the bag.
- `components/checkout/checkout-summary.tsx`: displays server-verified INR total, shipping, discount and tax rather than old local estimate as the payable amount.
- `lib/db/orders.ts` calls the shared pricing function for authoritative totals and retains original idempotent/atomic stock reservation.
- `lib/checkout-data.ts`, `lib/server/backend.ts`: standard shipping only while no verified courier coverage exists; reject unverified express/priority choices even when posted manually.
- `components/cart/cart-line-item.tsx` and `components/cart/cart-summary.tsx`: avoid stale "in stock" promise; label cart total as estimate pending database verification.
- No schema changes and no new external API/provider billing.
- Existing Auth, Checkout Safety, M1 OTP Tracking, Search, Live Product Page and QA tests retained.

### Executed proof
- Implementation commit `5cf10c1ecc9ec89332b69dec83b114b34aa7b670`.
- Targeted stock-issue deduplication fix commit `410f13ecf413dec06180e553175e91e66ceb55e3`.
- Final successful GitHub Actions [run 39636936442](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39636936442), **3/3 jobs SUCCESS**.
- **102/102 unit tests**, **32/32 real disposable PostgreSQL tests**, **8/8 local HTTP smoke**, **16/16 actual Chromium desktop/mobile checks**, all PASS. **158/158 checks PASS / 0 FAIL**.
- TypeScript, ESLint, Next.js production build and strict production dependency audit PASS.
- DB tests demonstrate read-only quote, live price changes, duplicate-line stock aggregation, missing/DRAFT/ARCHIVED product rejection, same totals as actual order, and stock race recheck. Browser QA verifies checkout **fails closed** without a configured live DB and does not advertise unsupported delivery speeds.

### Still required for actual production
- An owner-reviewed merge with Cline's Admin/CMS branch; this branch has **not** merged to `feature/nexora-gift-store` or `main`.
- Real staging/production checkout with seeded published products, real (nonproduction) payment sandbox verification, courier/PIN availability, shipping rules and owner-reviewed GST/tax policy.
- Product-specific configurable options, SKU/variant-specific inventory, personalization validation/price and Admin controls need their real schema and controlled migrations. Do not trust fabricated client variants or claim these are complete.
- A paid express shipping option must not be reintroduced until serviceability and charge support actually exist.
- No production migration, order, payment, email or deploy was performed.

### Next `next` owner scope
Focus on actual catalog-to-checkout compatibility with Admin-owned custom attributes once model exists, real cart price recalculation and storefront integration verification. Avoid Returns/Refunds and unrelated features.

## 26 October 2026 — Universal admin-controlled product choices

**Owner-authorized `next` milestone — implemented on GPT feature branch; independent full CI on patched dependency commit pending.**

### Completed functional source changes
- Additive `ProductChoiceGroup` Prisma model for up to eight named selectable choice groups per product, each with up to 20 values, required/optional selection and enable/disable flags. Product-specific extra price/stock **not** supported or claimed.
- Reviewed-only migration: `prisma/reviewed-migrations/20261026_product_choice_groups.sql`. **NEVER applied to production**.
- Authenticated Admin GET/PUT endpoint: `/api/admin-app/products/[productId]/choices`, bounded input, replacement inside one transaction, existing admin session protection.
- Admin Products screen now includes a nontechnical group/value editor with enable/disable, create/delete, required flag and Save. Does not modify Cline's feature branch.
- Published product detail reads real Admin choices from PostgreSQL, renders choice picker and blocks Add to Cart until required options are chosen.
- Cart carries canonical selected option keys/values, generates distinct line IDs per combination and retains legacy line IDs for noncustomized items.
- Checkout preview rejects missing, disabled, fabricated or removed selections, reflects saved options in quote signatures, and rechecks the selection immediately before order submission.
- Order transaction validates selected options again against persisted ProductChoiceGroup records; only accepted selections are saved in OrderItem.variant. Existing idempotency, inventory reservation and price computation remain unchanged.
- New unit and real isolated PostgreSQL test cases cover group limits, disabled values, missing required choices, line-identity differentiation, catalog option persistence, preview selection, order rejection and stock untouched on invalid selection.
- No independent SKU, per-option price or option-specific inventory is implied; requires separate approved schema.
- No `main`, Cline feature branch, QA feature branch, live payment, database migration or production deployment changed.

### Security maintenance, dated 26 October
- Security audit revealed critical vulnerabilities in old Next.js 16.3.8 and moderate fast-uri 3.1.8. Remediated with **Next.js 16.4.3**, **eslint-config-next 16.4.3** and **fast-uri 3.1.9**.
- A temporary branch-scoped GitHub Action regenerated the actual `package-lock.json` via npm and confirmed `npm audit --omit=dev --audit-level=high` found zero vulnerabilities; TypeScript/ESLint/Build succeeded after Admin editor lint fix.
- Audited security-lock commit: `d75caa37effc2fff61b21357a88f282eece7259d`. One-time write workflow removed in next docs checkpoint; retain read-only QA workflow.
- Exact-head full CI for final docs/security-workflow-removal checkpoint must be checked separately before marking this milestone fully green.

### Deployment and integration blockers
- The option group table exists only in source and disposable QA PostgreSQL until a reviewed migration is applied to a target environment.
- Admin-managed attribute selections intentionally use the product's base price and base inventory. Per-variant SKU/stock/price and text personalization are not implemented.
- Cline's owner-managed Admin/CMS branch remains separate. Final integration must preserve both `HomepageBanner` and `OrderTrackingChallenge`/ProductChoiceGroup models, along with any latest Cline schema.
- Real end-to-end purchases and real customer data untested; no live operation claimed.

### Next `next`
Continue the real website with controlled Product Variant SKUs/Inventory/Price or integration QA only after audit of the latest independent Admin/CMS branch. Returns/Refunds remain deferred as requested.


## 27 October 2026 — Priced SKU Variants, Stock Reservation & Settlement

**Owner requested real website progress; Returns/Refunds development remains deferred.** Existing Cline Admin/Homepage and QA branches were left untouched.

### Implementation in the isolated GPT feature branch
- Additive `ProductVariant` with canonical exact choice-combination signature, unique SKU, independent selling price (INR paise), total on-hand stock, reserved units, active flag and unique product/signature key.
- Additive `ProductVariantMovement` audit records for order reservations and RELEASE / OUTBOUND settlements, with optional `OrderItem.productVariantId` link.
- Read-only reviewed SQL: `prisma/reviewed-migrations/20261027_priced_sku_variants.sql`. Requires prior `ProductChoiceGroup` migration. **No production SQL was executed.**
- Bounded authenticated Admin SKU API: `/api/admin-app/products/[productId]/variants` GET, POST and PATCH. POST validates actual admin choices and uniqueness; PATCH only price/on-hand/active, preserves immutable combination/SKU and uses optimistic concurrency/available-reservation checks.
- Admin Products screen includes a SKU Variant Editor for selecting combinations, SKU, independent price, stock and active state. After variants exist, the old option-group editor is prevented from replacing their definitions behind customers' backs.
- Customer product detail exposes only active priced combinations; selecting the exact combination shows that SKU's current DB-derived price and on-hand minus reserved stock. Missing/out-of-stock combination disables Add to Cart and mobile purchase.
- Product/Cart mapping preserves existing nonvariant behavior, while separately priced variants have distinct cart lines and distinct verified price.
- Side-effect-free checkout preview resolves choice combinations from DB and aggregates demand by actual variant stock bucket; absent/disabled/insufficient inventory is rejected; quote signature includes variant ID.
- Checkout transaction recalculates exact variant SKU, price and validated choices; atomically reserves variant-specific stock, NOT parent stock, and saves real SKU/price/option snapshot into OrderItem.
- Customer checkout passes `expectedUnitPriceMinor` based on the latest server preview, which is checked inside the order transaction. A post-quote Admin price change rejects checkout without charging/reserving.
- Admin CANCEL/DELIVER order reconciliation releases/decrements the correct variant inventory and records stock movements, while the unchanged legacy warehouse inventory path remains operational.
- Newly added tests verify independent black/white price and stock, duplicate demand aggregation, disabled SKU, cancel and deliver reconciliation, concurrent last-unit shoppers, mixed variant/nonvariant orders and late price changes.
- Existing unit regression mock updated to support atomic conditional legacy stock updates, no skipped or deleted old tests.

### Verification
- Functional commit `d1ee8594fcbc4d189a1d422853dd31a69a73c560` and fixes `ef4a80759386e35879c0543fc6ed09175d14cf39`, `f506da20869ebf675c5b7eada08b1715ff192f32`.
- [Successful isolated CI 40454948802](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40454948802): all three jobs PASS, **111/111 Unit, 44/44 isolated PostgreSQL, 8/8 HTTP and 14/14 Chromium desktop/mobile (177/177 checks)**, TypeScript, lint, Next build, high-severity production dependency audit (zero vulnerabilities). The latest UX/docs-only checkpoint is separately rechecked in CI.
- No real production order, payment, inventory movement, migration, deploy, branch merge, refund or customer email was executed.

### Release boundaries / next milestone
- Variant inventory currently uses SKU-wide stock counters, not a per-warehouse variant stock ledger. Warehouse-specific SKU transfers, purchase orders and inbound stocking remain separate future work; existing warehouse stock is NOT silently shared.
- Homepage/catalog price-range filters and price sorting still reference base Product price at SQL query level even when product cards show lowest active variant price; needs an honest variant-aware SQL filter/sort milestone.
- Unit and isolated Postgres tests validate actual variant pricing/reservations. Browser CI is preview/demo-only, **not** a real staging/production database end-to-end purchase.
- Await reviewed integration with latest Cline `feature/nexora-gift-store` and schema migrations; do not modify `main`, deploy production or run migrations without explicit owner request. Returns/Refunds remain deferred.

## 27 October 2026 — Variant-Aware Live Catalog Price Filtering / Sorting

**Status: COMPLETE on isolated GPT feature branch; verified with real disposable PostgreSQL, not deployed.** No Return/Refund development.

### Correctness defect and solution
- Prior Shop/Search `min/max` filtering and Price Low/High sorting used `Product.priceMinor` even for items showing `MIN(active ProductVariant.priceMinor)` on their customer-facing card.
- New `lib/db/catalog-price-query.ts` executes fully parameterized PostgreSQL queries to select the actual eligible product IDs, total match count and deterministic LIMIT/OFFSET based on `COALESCE(MIN(active variant price), base price)`. No raw user input is concatenated into SQL.
- `lib/db/products.ts` routes price-sorted and/or price-filtered searches to the DB price path, then hydrates the bounded page by product IDs in the SAME order. Other default, rating and date queries retain existing Prisma behavior.
- Query filtering preserves published ACTIVE status; case-insensitive name, description, category, brand, base-SKU and new variant-SKU search; OR across selected categories/brands and AND across different facets; rating minimum; deterministic tie-breakers.
- Product mapping `lib/catalog-backend.ts` suppresses base `compareAtMinor` on independently priced SKU products (no fabricated percentage/bargain claims).
- With no active variants, existing Card fallback stays the base price and the SQL predicate/sort agrees. An active SKU with 0 remaining stock still has a real price and appears unavailable; this milestone does not invent stock.
- New disposable PostgreSQL fixture asserts 2-page ordering in both directions, effective-price min/max, filtered total/pagination, inactive SKU exclusion from minimum, unpublished DRAFT exclusion, variant SKU search and Brand/Category facets.
- No data migration, production database operation, real payment, customer email, deployment, merge, Refund/Return development or Cline branch write.

### Verified CI and checkpoint
- Functional commit `9fbd38e59c95d0cc29c70fd18ab8a2648db612e3`.
- Corrected test fixture `8fa632dc88a79d8d95c980e2d5efba7293d69d18` (DRAFT product had accidentally defaulted to ACTIVE; no test removed).
- GitHub Actions [run 40456324343](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40456324343): all 3 jobs SUCCESS; 111/111 unit, 45/45 disposable PostgreSQL, 8/8 local HTTP, 14/14 Chromium mobile/desktop = **178/178 PASS**.
- TypeScript, ESLint, Next.js production build and production dependency security audit PASS; **zero audited vulnerabilities**.

### Integration and scope boundaries
- Current independently verified `feature/nexora-gpt-customer-ops` carries `ProductChoiceGroup`, `ProductVariant`, `ProductVariantMovement`, checkout stock transactions and this price query.
- Independently verified Cline branch HEAD at beginning of milestone: `feature/nexora-gift-store` = `4df818003fd4b53db83c03d10989609757efb4d6`. The branch has NOT been merged or edited in this milestone. `main` was `3c20daa120793ae7185f63d014295c81d86fe7d8` and was not touched.
- Before any eventual integration, perform a fresh two-way diff / ownership review and reconcile Prisma models, Admin Products UI, Homepage/CMS, separate QA, Cline's local staged changes, and applied migration history; do NOT blindly overwrite either branch.
- The reviewed `20261026_product_choice_groups.sql` and `20261027_priced_sku_variants.sql` migrations remain unapplied on production. Isolated Prisma schema push was confined to ephemeral QA PostgreSQL.
- Browser regression tests use a demo-mode server without live DB; real staging deployment, production SKU migration, genuine customer checkout, courier shipping policies, and final merged-branch tests are NOT verified.

### Next owner `next`
Continue actual customer-visible website capability and QA; preserve Cline's independent work, avoid Returns/Refunds. Candidate: improve variant search result relevance and Admin SKU availability experience, or build a safe merge readiness report; never merge, migrate or deploy production without explicit approval.

## 27 October 2026 — Search → Product Detail Variant Parity (Nexora 3)

**Implementation committed on owner branch; exact-HEAD GitHub CI must verify it.**
- Search result pages now hydrate saved choice groups and all SKU variants, reusing the same authoritative DB serializer as Shop/Product Detail; no parent base price or warehouse stock shown for independently priced SKUs.
- Search terms include active variant SKU matches before paging (inactive/retired SKU-only matches excluded). Category, brand, multi-token pagination preserved.
- Suggestions compute minimum active SKU price (base fallback when no active SKU exists) and actual SKU available stock, without leaking underlying stock counts or variant records in public JSON. Search combobox identifies out-of-stock products.
- Added disposable PostgreSQL regression for live variant SKU-only search, retired identifier exclusion, stock reservations and sell-out; contract test asserts token SKU search.
- No production migration, deploy, branch merge, payments, emails or refunds. Staging and Cline integration still require owner review.


## 27 October 2026 — Live SQL Stock Availability Filters (Nexora 3)
**Implementation on GPT branch; exact-HEAD CI verification required before PASS.**
- Live Shop now accepts available (any stock), low-stock (1–8 units), out-of-stock, and preserves filters across URL pagination and price/sort.
- Parameterized SQL applies stock and effective SKU price together before count/pagination, active SKU availability when any SKU rows exist, otherwise nonnegative warehouse stock.
- Search available-only toggle uses same SQL while retaining token AND semantics, true total and final page clamping; inactive variant SKU queries do not expose retired products.
- New disposable PostgreSQL coverage validates stock reservations, disabled SKU parent stock, combined price/stock/brand/category filters, pagination, and stock transitions.
- No schema changes, production migrations/deployments, orders, payments, returns/refunds, or branch merges. Real staging validation and Cline integration remain blocked.

## 27 October 2026 — Real SKU Add-to-Cart and Cart-wide Preflight
**Branch-only functional implementation. Exact-head CI must verify before treating complete.**
- Database-backed Product Detail buy controls on desktop and mobile now use existing no-side-effect checkout preview on Add to Cart; this checks current SKU combination, persisted price, current unreserved stock and matching SKU demand already held in customer cart.
- Shared CartProvider live admission lock prevents simultaneous overlapping SKU check requests. A changed cart during the request fails closed, and errors show clearly near the buy button. Other demo-only UI remains unchanged.
- Cart page now queries current server quote on cart/coupon changes, displays real pricing/availability issues and server-verified totals, and requires explicit acceptance for newly changed prices. The checkout navigation is blocked until a valid live quote. Final order creation retains a separate authoritative DB reservation.
- Added focused unit contract and disposable PostgreSQL regression for choice combinations, final unit reserved by a competing purchase, changed variant price, no order created on preflight and no legacy warehouse reservation.
- Existing secure tracking, checkout idempotency and stock transaction behavior preserved. No production database, migrations, payments, emails, deployment, branch merge or Returns/Refunds expansion.

## 27 October 2026 — Checkout Submission Identity & Pending Payment Recovery (Nexora 3)

**Exact HEAD CI verification required; no real checkout/payment performed.**
- Checkout captures a canonical full customer intent (SKU/options, quantities, reviewed prices, email, address, coupon, payment, delivery). Async validation and product submission fail closed on changed intent; synchronous ref guard blocks same-frame duplicate Place Order clicks.
- The final order line builder uses matching product IDs and unit prices from the authoritative refreshed DB checkout quote. It checks ordered SKU choices, quantities, line totals, stock and price; no redundant unverified product slug lookup.
- Created Cashfree orders persist a minimal SHA-256 intent fingerprint plus order number/email in browser session. After payment-session load failure, the original order can be resumed without re-creating stock reservations. Explicit separate-checkout choice discards only the local retry shortcut, never cancels/release orders. Recovery also shows with an empty cart.
- Checkout renders pending order reference and tracking link, and freezes contact/address/payment inputs while a submission runs. Successful COD redirects to its persisted order confirmation. Cart is only cleared if it stayed unchanged during the request.
- Unit coverage: changed intent dimensions, tampered recovery record, SKU mapping/misalignment and price/stock preflight. Disposable PostgreSQL regression: multi-SKU quote maps to exact order items, retry uses one idempotency key and reserves each SKU exactly once even after price updates.
- Production Cashfree sessions, real orders, refunds, emails, deployment, migration and branch integration NOT exercised. Cline/QA/main preserved. Returns/Refunds remain deferred.

## 28 Oct 2026 — Customer Checkout Network Outcome Recovery (Nexora 4)
**Implementation committed on isolated GPT branch; exact HEAD CI required before claiming PASS.**
- New read-only POST /api/backend/orders/recover, bound to a high-entropy Idempotency-Key AND normalized checkout email, rate limited, no-store. Returns only existing order reference and lifecycle/payment status, with no address or items; full order details still require email OTP tracking.
- Client stores a minimal session-scope key, order-request fingerprint and email (no cart/address). Checkout automatically checks previous attempt on reload and after ambiguous POST/network failure. Prevents new submission while the old attempt is unresolved; explicit separate-checkout action is required before choosing a different order.
- Same-tab retry sends the EXACT preserved original payload with SAME key, including after original stock was reserved. Server uniqueness and existing transaction replay avoid duplicate order and stock reservations. Recovery can resume existing Cashfree payment by order reference without calling Create Order.
- Added pure request validation and disposable PostgreSQL tests for positive lookup, no side effects, wrong key/email, unknown user, HTTP no-store and true same-key replay.
- Read-only Cline schema/Admin compatibility review: docs/development/NEXORA_GPT_CLINE_READ_ONLY_INTEGRATION_20261028.md. No cross-branch edits, merges, schema change, migrations, payments or production deployment.

## 28 October 2026 — Recovery Chromium Regression & Admin SKU/Cline Response Parity

**Implementation on isolated GPT branch; verify exact HEAD CI before calling verified.**
- Added four real localhost Chromium recovery checks on BOTH desktop and mobile: simulated cancelled existing COD order is never mislabeled as a fresh success; simulated unknown 404 remains blocked until explicit separate checkout; simulated 503 service failure fails closed; tampered session keys never trigger recovery fetch. No live order create, payment or external calls are made in the browser tests.
- Changed recovered COD/status link to the existing email-OTP /track-order page, not an unverified /checkout/success claim; legacy hosted payment recovery remains separate.
- Admin Products GET now includes Cline-overlap metadata supported by GPT schema (description, compareAtMinor, featured, categorySlug, brandSlug) without touching Cline branch. A typed serializer preserves legacy base product/warehouse fields for editing but explicitly reports SKU-sourced vs warehouse-sourced sellable stock, active/total variant counts and minimum active SKU effective price.
- Admin Products list now shows SKU available count / active variants and saleable starting price (or No active SKU); it does not falsely present base warehouse stock as SKU availability. Added pure tests for SKU reservations, disabled variants, negative-bin clamping and Cline-compatible metadata.
- Remaining: true end-to-end integrated Cline+GPT Prisma schema, Category/Brand visibility filtering, owner-approved staging with published products and live payments. No branch merge, schema migration, deploy, real order, refund or return.


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


## 28 October 2026 — Banner Preview + Revision-Safe Reorder Integration
- User explicitly requires continuing GPT branch development only. **NO Vercel deployment, no production database mutation or migrations**, no blind Cline/QA merge.
- Rechecked Cline latest `104af207b2ab7e45b9ff2380da4830155893ca51` vs GPT `76223598fcb69d7172c075c936a503651f324724`. Safely ported Cline's admin-only desktop/mobile `BannerPreview`; embedded it on draft and existing banner edit forms.
- Added Cline-compatible `POST /api/admin-app/banners/reorder` with Owner-session auth and bounded request. Serializable transaction, revision-pin `updatedAt`, all active non-archived banner IDs required, duplicate/forged revision rejection, failed all-or-nothing stale edits. Archived banners excluded. Admin Move up/down buttons call reorder and reload actual saved rows.
- Fixed public homepage banner starvation: formerly selecting five candidates from PostgreSQL before filtering hidden/archived-category campaigns could mask valid later campaigns. Now scan up to 1000 published candidates, filter invalid/hidden linked categories first, THEN take five live banners.
- Added pure parsing/auth tests, disposable PostgreSQL tests for moving all active banners, stale/archived ID failures and six hidden banners ahead of a valid sixth-plus campaign. Existing schema is sufficient; no migration.
- This milestone stays incomplete until exact-HEAD TypeScript, ESLint, production build, unit, isolated PostgreSQL and desktop/mobile Chromium regressions pass. Remaining Cline/QA integration and actual staging + payment verification are separate milestones.


## 28 October 2026 — Cline Product Preview + GPT SKU-safe Unsaved Preview and Create-Draft Specs
- Branch restriction: only GPT `feature/nexora-gpt-customer-ops`. **No Vercel deploy, no production database migration or writes, no Cline/QA/main branch changes.**
- Rechecked Cline HEAD `c2024b1a3f1c39c89c1eaa9a4a09c685e1cfd0cc`; safely adapted its `components/admin/product-preview.tsx` into GPT rather than blindly merging divergent Product Admin code.
- New pure `lib/admin/product-preview.ts`: preview uses only actual draft/name/description/media/price/stock input. Keeps approved HTTPS images, removes duplicate/untrusted images, validates supported video, never invents stock or customer testimonials.
- **Critical SKU safety:** when a Product has independently priced variants, preview displays the effective lowest active SKU price (or **No active SKU price**) instead of misleading parent base price; never invents parent compare-at discount for SKU-priced items. Preview is explicitly admin-only and does not persist, publish, reserve stock, or guarantee real final checkout prices.
- Admin Create-Draft and Edit forms both render unsaved product preview with gallery thumbnails and valid video notice. Existing Product Edit form is keyed by `product.id + updatedAt` to remount after a successful canonical save and prevent stale field state.
- New create-draft editor supports **category-specific attribute values on initial creation** with strict server-side validation, instead of forcing a second Edit step. Category change clears incompatible unsaved values.
- Added unit + SSR markup tests for missing/invalid parent/SKU prices, compare-at suppression, actual stock, approved media deduplication and non-mutating preview; a disposable PostgreSQL test verifies initial draft attribute persistence and ACTIVE publish validation.
- This milestone is not marked verified until exact-HEAD Unit, TypeScript, ESLint, Production Build, Security, Disposable PostgreSQL and Chromium regression jobs pass.
- Separate remaining blockers: full Cline + QA final feature integration review, real connected staging database, real Cashfree gateway sandbox, customer-side Order/Payment final E2E, and final Vercel deployment only when owner directs.


## 28 October 2026 — GPT/Cline Final Integration Safety: Atomic Owner Product Audit

- Compared GPT HEAD `579ac5dfbbb0425e81b02653c5adeb32cd6e35b3` with current Cline HEAD `534d932432c8c02dc15e844b215c607855c520fe`, and QA HEAD `69cc280e24cdb1e1e148b8199227e5190ff8d411`. The branches remain divergent; DO NOT blindly merge and overwrite GPT SKU / checkout safety.
- **Critical gap fixed:** GPT Admin product create/edit routes previously performed Product+Media DB transaction first, then owner Audit insert as a separate transaction. Audit failure caused an HTTP 500 while Product data had already been committed, leaving misleading state.
- Ported Cline's transaction-aware `logAdmin(input, tx)` signature and made the *existing* GPT `createProduct`/`updateProduct` accept an optional owner user ID. Authenticated admin routes now pass their verified owner ID into the transaction and no longer call audit separately. Product, gallery/video, price/attributes/status and the audit row succeed or fail as one atomic unit. Original direct service callers (the isolated legacy integration tests) remain compatible without an owner ID.
- `PRODUCT_CREATE` and `PRODUCT_UPDATE` audit actions are recorded exactly once on successful owner writes; invalid or failed audit inserts cause automatic full rollback, not half-saved products. No extra Owner authorization or permission system introduced.
- Added 5 PostgreSQL tests with an explicit disposable `nexora_qa` guard. They create an owner and disposable audit table, then use QA-only PostgreSQL trigger fault injection to prove failed create and edit audit inserts roll back Product, Gallery, Poster/Video, Price, Description, Status and update revision. Trigger/function are dropped after tests. Also confirms success produces exactly one audit each and forged owner identity is rejected.
- **No Vercel deployment, production DB migrations, live orders/payments or other branch changes.** Existing `AdminActivityLog` table still needs owner-reviewed staging setup. CI runs on exact commit are required before calling this milestone verified.
- Remaining integration: independent Cline admin browser E2E (currently adapted for a different UI), staging schema/migrations, real sandbox Cashfree + checkout, and final deploy only after owner requests.


## 28 October 2026 — Real Authenticated Owner Admin Chromium E2E (CI verification pending)

- Existing 32 desktop/mobile Chromium checks covered storefront/customer security but DID NOT exercise real Owner login and Product/Banner admin browser flows.
- Added `scripts/qa/gpt-admin-browser-e2e.mjs`: hard-gated to local `127.0.0.1:3137`, explicit `nexora_qa` PostgreSQL user and database, opt-in `NEXORA_QA_ALLOW_DB_INTEGRATION`, disposable QA owner `@example.invalid`, disabled Cashfree and disabled demo catalog. Refuses production addresses or credentials. Bootstraps `AdminActivityLog` **only** in ephemeral QA DB because raw admin audit is not in the Prisma schema.
- Real Playwright Chromium tests anonymous Owner API rejection; login through actual UI and secure owner session; category+brand+required attribute API persists and renders; Create Draft via actual Admin form with category-specific spec and compare-at; Product edit pricing/poster and unsaved preview via UI; publish and public detail; hide and re-show via hierarchy; bulk draft and stale revision rejection; Admin banner creation and mobile preview toggle. No real orders, payments, outbound emails or uploads. On failure write screenshots and results to QA-only artifact.
- Added a fourth independent GitHub Actions job `authenticated-admin-browser`: PostgreSQL 16 container, `prisma db push` to disposable DB only, Next.js dev on localhost for cookie compatibility, temporary Playwright outside repository, screenshots/log evidence on failure.
- Maintains prior Unit/Build, isolated DB and 32 customer browser regressions without changing them. Cline/QA/main left untouched. **NO Vercel deployment** and **NO production/staging database writes**.
- This milestone is complete only after the **new fourth GitHub CI job** and prior 3 jobs all pass on the exact latest HEAD. Follow up with CI error fixes if any.


## 28 October 2026 — Real Local Checkout COD + Payment-Safety Browser E2E (CI verification pending)

- Only GPT branch; **NO Vercel deployment, Production DB, real Cashfree payment, external email or order**.
- Extend existing standalone disposable PostgreSQL + authenticated admin Chromium GitHub CI job (formerly 9/9 browser E2E checks) with `scripts/qa/gpt-checkout-browser-e2e.mjs`.
- New 9 local-only checks: Cashfree session/status/webhook fail closed with gateway credentials disabled; real authoritative HTTP checkout preview confirms live price/stock without reservation; missing Idempotency-Key rejects guest and order writes; real COD guest POST creates exactly one order and reserved unit; same-key retry replays original order; same-key mutated cart returns conflict; email+capability-scoped recovery reveals only minimal order status, refuses other email; oversell blocks a second transaction; REAL Chromium customer checkout from temporary localStorage bag + typed delivery address to COD order success, then independently verify reserved stock and cleared browser bag.
- Script refuses non-local `127.0.0.1:3137`, wrong database user/db, absent integration flag, configured Cashfree, configured email sender, enabled demo catalog. All SQL fixtures use bound params and PostgreSQL in disposable CI container. Evidence records checkout results and optional browser screenshots; no real customer contact/email is used.
- Existing CI's prior Unit/TypeScript/ESLint/Build, PostgreSQL and 32 Browser regressions remain. The independent authenticated-admin job now tests both admin and real checkout paths, and keeps QA artifacts.
- Source code of checkout/payment unchanged: this increment is a missing high-value **regression coverage gate**, not a claim Cashfree live payments were tested.
- Must verify exact-HEAD CI 4/4 jobs success; follow up on any failures. Remaining: actual staging schema/runbook, third-party Cashfree sandbox, overall Cline/QA branch integration, final Vercel only after owner directive.


## 28 October 2026 — Checkout Fulfillment Warehouse and Concurrent Admin Stock Safety (verified)
- Only `feature/nexora-gpt-customer-ops`; no Vercel deploy, production data or payment action, cross-branch change or schema migration.
- Checkout preview now counts `InventoryItem` stock only when its `Warehouse.active` is true. The order transaction uses the same warehouse filter; its final guarded stock UPDATE also rechecks Warehouse.active so deactivation between quote and reservation fails closed.
- Admin stock adjustments now use one conditional SQL UPDATE against the **current** onHand/reserved values rather than an unprotected read followed by an absolute write. This prevents lost increments, negative/overflow quantities and stock reductions below concurrently reserved units. Movement recording stays inside the same transaction.
- Disposable PostgreSQL regressions added: inactive-only warehouse after a valid quote; mixed active/offline warehouses; reactivation; rejection with no order/movement; two concurrent stock adjustments; reserved-stock guard; simultaneous checkout and stock reduction.
- Existing priced SKU variants keep their independent variant stock path; no parent-stock double reservation.
- Exact new HEAD CI remains mandatory; do not treat this as production-ready until migration/schema and end-to-end staging checks are separately approved.
- **Verification:** exact code commit `c9c7c6290fa2e637f07fb87d8fe2f6377444efb4`, GitHub Actions run [40713212969](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40713212969) completed **SUCCESS 4/4 jobs, 0 failures**: isolated PostgreSQL integration, Unit/TypeScript/ESLint/Build/Security, customer Chromium and authenticated Owner Admin + local COD Chromium. This is disposable QA evidence only, not live staging/production readiness.
