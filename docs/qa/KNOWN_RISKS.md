# NEXORA Commerce — Milestone 2 QA Risk Register

Reviewed against `feature/nexora-qa-automation`, parent `aeca01adb5d4f41c50301a6d9e66f94430823d79`.

**Status:** Source-code findings and test-scope gaps; do not treat these as confirmed incidents or exploited vulnerabilities. Only QA-owned files are changed in this branch.

## RISK-01: Checkout order creation has no request idempotency

- **Priority:** High; duplicate charges/order records or duplicate stock reservations are possible on client/network retries.
- **Sources:** `app/api/backend/orders/route.ts` POST; `lib/db/orders.ts` `createOrder`.
- **Observation:** Each POST calls `createOrder`; each call allocates a new random order number and inserts an order in a new transaction. No request/idempotency key, existing-order lookup, or unique customer-request constraint is visible.
- **To reproduce in staging only:** Submit the identical checkout payload twice in rapid succession; compare order IDs and reserved units. Do not repeat against production.
- **Suggested app fix in the other agent's branch:** Per-customer idempotency token persisted under a unique DB constraint, replay-safe response, and an atomic order/stock/discount transaction. Unit mocks do not demonstrate cross-request idempotency.

## RISK-02: Concurrent inventory reservation uses prior read, not conditional reservation

- **Priority:** High; overselling possible under concurrent requests.
- **Source:** `lib/db/orders.ts`, availability calculation and `tx.inventoryItem.update({where:{id:s.id},data:{reserved:{increment:q}}})`.
- **Observation:** Availability is read before the transaction and reservations are unconditionally incremented by ID. Two requests can each see the same available quantity.
- **To reproduce:** In an isolated test database with 1 item, execute two concurrent checkouts for that SKU. Assert no over-reservation and at most one order succeeds.
- **Suggested app fix:** Atomic conditional inventory update (database predicate `onHand - reserved >= quantity`) with checked affected-row count, serializable transaction or locking, rollback + retry policy.

## RISK-03: Duplicate line IDs in an order and weak customer input validation

- **Priority:** Medium/High.
- **Source:** `lib/server/backend.ts` `validateOrder`; `lib/db/orders.ts` product matching and reserve loop.
- **Observation:** `validateOrder` enforces integer quantities 1–20 but does not reject or coalesce repeated `productId` lines. `createOrder` checks available quantity per individual line before reserving each; cumulative quantity is not checked. Phone and postal code are required but have no format validation or max-length controls.
- **To reproduce:** In staging, POST two lines of quantity 1 of a product with available stock 1. A cumulative-stock check should reject it. Separately submit nonsensical phone/PIN to validation; it currently checks only non-empty.
- **Suggested app fix:** Aggregate by product/variant before availability checks; strict schema for contact fields and bounded strings, with region-aware phone/PIN validation.

## RISK-04: Coupon usage count race and numeric domain constraints

- **Priority:** Medium/High.
- **Source:** `lib/commerce/coupon-engine.ts`.
- **Observation:** `recordCouponRedemption` does a pre-insert lookup for orderId then inserts and increments usage count without a visible conditional usage-limit update in that transaction. Concurrent checkouts may exceed `usageLimit`; DB uniqueness and transaction behavior need verification. The `PERCENT` and `FIXED` values depend on stored coupon correctness.
- **Suggested fix:** Enforce unique `orderId` on redemption at DB level, atomically decrement/claim remaining uses, and validate coupon value bounds at entry.
- **Current QA:** Unit contract tests cover existing-redemption no-op, zero discount, and insertion/update calls; not database concurrency.

## RISK-05: Client-side cart and checkout validation rely on upstream invariants

- **Priority:** Medium.
- **Source:** `lib/cart-utils.ts`, `lib/checkout/coupon-total.ts`.
- **Observation:** Cart totals multiply unvalidated price and quantity. Checkout coupon calculation subtracts `discountMinor / 100` in its output even if discount exceeds subtotal; `taxable` is clamped, but reported discount can exceed subtotal. These functions should not be used as authoritative server pricing.
- **Suggested fix:** Server-authoritative price/quantity constraints and correct capped output discount.

## RISK-06: Anonymous order creation and account data protection

- **Priority:** Medium — depends on intended business model.
- **Sources:** `app/api/backend/orders/route.ts` allows guest order creation, `lib/auth/session.ts`, `lib/admin/admin-session.ts`.
- **Observation:** Guest checkout is intentional; GET orders requires an authenticated session and admin session requires ACTIVE ADMIN. Current login rate limits are in-memory and use the first `x-forwarded-for` value; review trusted proxy rules and multi-instance rate-limit coordination before scaling.
- **Suggested fix:** Verify proxy trust, shared rate limiter where required, and explicit fraud/abuse limits. Do not block guest checkout without business approval.

## RISK-07: URL validation accepts broad host classes

- **Priority:** Medium, depending on storage ownership.
- **Source:** `lib/product-media.ts` permits any host ending `.supabase.co`, not only a configured project.
- **Observation:** Lookalike domains are rejected, and HTTPS is required. The allowlist deliberately trusts any Supabase-hosted project and does not guarantee hosted file content is safe.
- **Suggested fix:** If media must be owned by Nexora, use explicit project hostname and content processing/CSP.

## Security audit remediation boundaries

`npm audit --json` and `npm audit --omit=dev --json` are now captured in the QA workflow. `npm audit --omit=dev --audit-level=high` is a strict non-ignored gate. See workflow run logs/artifacts for **exact** current advisory IDs, dependency paths and fix recommendations. No dependency manifests can be changed from this QA branch.

## Test classifications

- `tests/*.test.ts`: deterministic unit/contract checks using isolated in-memory or fake Prisma transactions; tests of route handlers never create real orders or touch a live DB.
- `scripts/qa/http-smoke.mjs`: optional HTTP checks against *localhost only*, requiring an explicitly started local web server. These are HTTP smoke tests, **not** browser E2E.
- **Not verified:** real database concurrency, Cashfree charge/refund, external email, full authenticated checkout lifecycle, visual regression, real browser automation.

---

# Milestone 3 — Confirmed Isolated Test Findings (21 October 2026)

**Reproducible GitHub Actions:** [first executed Chromium/Postgres run](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39617678156). These are *actual failures* against unchanged application functions in an ephemeral PostgreSQL 16 service and actual headless Chromium on localhost. Application source has not been modified in the QA branch. Snapshot below refers to that run; the coupon test initially had a QA fixture case mismatch and has been corrected for re-execution.

## CONFIRMED — RISK-01: No order idempotency (High)

Real Postgres integration test invoked `createOrder` twice with same customer/cart payload.
- Observed: **2 distinct order numbers**, 2 persisted orders, 2 units reserved.
- Expected replay safety: one logical order for the same checkout attempt, with a client/server idempotency key and database uniqueness.
- Application fix (separate branch): explicit idempotency token, unique persistence, and deterministic replay response; ensure separate *intentional* purchases still work.
- Evidence: `QA_RISK_01_OBSERVED` log in `nexora-qa-postgres-integration` artifact.

## CONFIRMED — RISK-02: Concurrent overselling (Critical operational defect)

2 simultaneous `createOrder` requests with only 1 unit `onHand`; an ephemeral DB trigger `pg_sleep(0.3)` on reservation updates ensured overlapping pre-transaction stock reads.
- Observed: **2 orders successful, onHand=1, reserved=2**.
- Expected: at most one accepted order and invariant `reserved <= onHand`.
- Fix: transactional stock acquisition using conditional `UPDATE` and affected-row count (or row locks/serializable with retry); check aggregate demand and refuse races. Avoid product availability checks outside transaction.
- Evidence: `QA_RISK_02_OBSERVED` in integration logs.

## CONFIRMED — RISK-03: Duplicate lines and malformed checkout fields

- Two lines for the *same product*, each quantity 1, with only 1 unit available: order accepted and `reserved=2`.
- Invalid phone `not-a-phone` and PIN `invalid`: `validateOrder` accepted values; fails validation invariant.
- 10,000-character customer name and address: `validateOrder` accepted the unbounded fields.
- Fix: coalesce identical product+variant entries, check cumulative quantity; validate phone/PIN and sensible field size limits both client and server side.

## CONFIRMED — BROWSER-NAV-01: Broken category links (High discoverability risk)

Playwright Chromium executed on desktop (1366×900) and mobile (390×844), isolated local server, no production.
- Home category CTA links to `/category/electronics`; actual HTTP response **404**, expected 200, at BOTH viewport sizes.
- Source: `components/home/category-strip.tsx` generates `/category/${category.slug}`. `app/category/[slug]` route is absent in audited branch. Other category showcase uses `/shop?category=...`.
- Fix in Storefront branch: route all visible category links to supported `/shop?category=...`, or implement category route intentionally. Re-run browser navigation tests after fix.
- 12 real browser checks: 10 passed / 2 failed. Failure screenshots and JSON saved in `nexora-qa-chromium-evidence` artifact.

## RISK-04 coupon schema caveat

No `prisma/migrations` directory or `Coupon` model exists in `prisma/schema.prisma`. A minimal table is created **only inside the disposable QA database** for an implementation-contract concurrency probe. This does not confirm actual production coupon constraints. Initial QA test failed on lowercase fixture coupon vs `resolveCoupon` uppercase normalization; fixture corrected and must be re-executed before classifying a coupon usage-limit failure as a reproduced QA-contract defect.

## Validated safeguards

- Valid order writes exactly one reservation movement.
- Insufficient stock rejects before opening transaction.
- Injected SQL error during RESERVE correctly rolls back both order creation and reserved units.
- Local HTTP smoke: all 8 checks PASS on isolated Next.js server, with expected statuses 200/401/403/404/400.
- Existing 72 unit/contract tests retained and successful. Production dependency audit remains strict.

## Unverified

Production PostgreSQL schema differs from QA schema because no migrations exist and coupons are raw SQL. Database findings are confirmed against the repository's Prisma schema provisioned with `prisma db push` on PostgreSQL 16, not against live Supabase. Actual payment charge/refund, email, cross-instance load balancing and production database cannot be claimed tested.
