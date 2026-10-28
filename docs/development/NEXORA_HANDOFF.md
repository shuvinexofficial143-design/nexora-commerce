# NEXORA 4 — GitHub development handoff (28 October 2026)

## Ownership and safety

- Repo: `shuvinexofficial143-design/nexora-commerce`
- **Write only:** `feature/nexora-gift-store`
- Read-only integration references: `feature/nexora-gpt-customer-ops` (Nexora 3), `feature/nexora-qa-automation`.
- Do not merge into main, deploy production, access live payments, apply production database migrations, or modify customer/QA branches.
- Fetch HEAD before every write, use fast-forward only, preserve existing Prisma and checkout contracts.

## Verified milestone

Functional code commit `7041e4c729ce38a3a6c5918ef90a7a1438bd7879` passed all 3 jobs in CI https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40661384662.

Commits in chronological order:
- `9544045638f6dffcb6d55de5338b9e7938f3018e` — dependency patch / browser runner.
- `360559cc10fb55a02a749c62b09a214358864bb4` — safe catalog PATCH / required attributes.
- `cb645fc97bed8f0cf10cc93dc8eb1632dae26c09` — complete Category/Brand Admin editor workflow.
- `7041e4c729ce38a3a6c5918ef90a7a1438bd7879` — active catalog assignments and attributes validation.

Important implementation locations:
- `components/admin/catalog-management.tsx`: Category/Brand/Attribute UI, existing authenticated endpoints, loading/error/empty states and mutation refresh.
- `lib/admin/catalog-admin.ts`: category/brand persistence, soft archive, restore, parent rules, required attributes and assignment checks.
- `lib/admin/product-admin.ts`: transactional create/update, status/media, category/brand assignment, required attribute checks.
- `app/api/admin-app/catalog/options/route.ts`: selectable visible/active category and brand options.
- `tests/catalog-admin-validation.test.ts`: pure validation regression tests.
- `.github/workflows/checkout-safety.yml`: security/type/lint/build, isolated PostgreSQL checkout and Chromium HTTP testing.

## Next authorized milestone

1. Verify current branch HEAD and latest CI; fix any regression before more code.
2. Read the existing Products component (`components/admin/personal-admin-app.tsx`) and product APIs. Add a usable category-specific attribute editor to Product Admin, including required/optional/type-aware controls and server error feedback. Avoid editing variant price/stock logic.
3. Test owner product create/edit/save/reload with required attributes on an isolated migrated database, and test storefront visibility after publishing; do not claim these flows pass without executing them.
4. Add safe inventory and bulk product controls only where the existing stock/reservation contract permits.
5. Record actual changed files, new commit, CI link, database migration requirements and integration gaps in both progress docs.

## Database and unresolved boundaries

- Existing reviewed SQL files `20261021_homepage_banner.sql` and `20261021_catalog_management.sql` have NOT been applied in production. Use only isolated test PostgreSQL and reviewed migrations.
- The automated PostgreSQL job covers checkout/coupon/concurrency, not full authenticated Admin catalog persistence E2E.
- Product variants remain gated by the Nexora 3 checkout identity/order-item/inventory contract.
- Never activate live Cashfree operations during development.
- The documentation commit postdates the above verified functional commit; check actual GitHub HEAD and CI before relying on a status claim.
