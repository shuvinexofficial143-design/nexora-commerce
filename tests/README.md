# Nexora Commerce — Automated QA

This directory contains isolated, deterministic automated tests for critical commerce behavior. All tests use Node's built-in test runner executed through the project's existing `tsx` dependency. No database credentials, paid APIs, deployed site, payment gateway, browser session, or production data are required.

## Run locally or in CI

```bash
npm ci
npx --no-install tsx --test tests/*.test.ts
npm run lint
npm run type-check
```

GitHub Actions: `.github/workflows/qa.yml`. Its unit job runs on pushes to `feature/nexora-qa-automation` and pull requests targeting `main`. The application-validation job also runs lint, type-check, and production build; it is an independent check so unit failures cannot hide build outcomes. The workflow never deploys or merges.

## Coverage

- Cart math: quantities, variant IDs, coupons, GST, shipping threshold, empty cart
- Catalog: category, brand, inventory, price, rating, discounts, sorting, nonmutation
- Checkout: address formatting, PIN validation, coupon minor/major currency units
- Product media: HTTPS validation, supported host list, YouTube formats, fallbacks
- API client: successful envelope, status/errors, non-JSON response, network outage
- Admin inventory: delivery/cancellation settlement, idempotency, mismatches, multi-warehouse reservations (in-memory fakes)
- Rate limiter: quotas, key isolation, proxy address selection, window reset
- Runtime configuration: URL precedence, safe defaults, feature flags

## Scope and limits

These are focused unit/contract tests, not live payment, production checkout, browser E2E, or real database integration tests. They assert the behavior of the code at the branch revision; they cannot prove remote integrations work. Running the production build in CI validates compilation, but does not deploy. Review workflow results after each push. Storefront/Admin implementation files and package manifests are intentionally untouched.


## Milestone 2 (continued)

Added targeted regression suites for server checkout/order input validation, password hashing, owner credential guards, admin CORS, coupon redemption idempotency *contract*, HTTP handler rejection behavior, and cross-component pricing/filter/media edges.

Run all automated tests with `npx --no-install tsx --test tests/*.test.ts`. Full npm audit + production-only npm audit run in a dedicated GitHub Actions job; high or critical production findings fail that job. Download JSON reports from its workflow artifact. No `npm audit fix --force` is executed.

Optional safe local HTTP smoke checks: build/start the app **locally** with `DATABASE_URL=""`, `DIRECT_URL=""`, `PUBLIC_CUSTOMER_AUTH_ENABLED=false`, `NEXT_PUBLIC_CASHFREE_ENABLED=false`, and run `node scripts/qa/http-smoke.mjs`. The script rejects remote URLs. Alternatively use workflow_dispatch and opt in to `http_smoke`. It makes only GET, OPTIONS, and deliberately rejected POST requests, and does not create orders.

For uncovered production risks and suggested separate-app-branch fixes, see `docs/qa/KNOWN_RISKS.md`. A unit test success must not be interpreted as proof of payment, concurrency, browser, or live database integration safety.

## Milestone 3 — Actual execution

- Existing 72 deterministic unit tests are preserved.
- `tests/integration/checkout-postgres.test.ts` runs only in a disposable Postgres 16 service, refuses non-local DBs, uses temporary fixtures and asserts critical invariants even when known application defects make CI FAIL.
- `scripts/qa/http-smoke.mjs` executed 8/8 checks on GitHub Actions local Next.js server.
- `scripts/qa/browser-e2e.mjs` uses real headless Chromium at desktop/mobile widths with an isolated temporary Playwright install outside the repository. Observed 10 PASS, 2 FAIL (category 404), with screenshots. Never submits real orders.
- See `docs/qa/M3_EXECUTION.md` for guardrails and `docs/qa/KNOWN_RISKS.md` for verified bug evidence.
- No prisma/migrations folder exists; QA uses `prisma db push` against disposable PostgreSQL only. This does not claim migration verification.
