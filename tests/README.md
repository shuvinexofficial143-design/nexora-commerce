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
