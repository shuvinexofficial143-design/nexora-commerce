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
