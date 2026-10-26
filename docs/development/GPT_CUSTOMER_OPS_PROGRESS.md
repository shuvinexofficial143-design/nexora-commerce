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
