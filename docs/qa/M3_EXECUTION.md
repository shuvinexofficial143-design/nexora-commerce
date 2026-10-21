# Milestone 3 — isolated QA execution

## Execution design

- Existing 72 unit/contract tests remain untouched.
- Local HTTP smoke (`scripts/qa/http-smoke.mjs`) runs automatically on QA branch pushes, with local Next.js server, empty DB URLs, disabled login/payments. Eight checks, bounded server readiness. Server logs uploaded even on failures.
- Real PostgreSQL integration (`tests/integration/checkout-postgres.test.ts`) runs only with `NEXORA_QA_ALLOW_DB_INTEGRATION=true` and verifies `DATABASE_URL` and `DIRECT_URL` both point to local host, the database name `nexora_qa`, and user `nexora_qa`. No Supabase/production access. CI runs PostgreSQL 16 in a disposable service container.
- **The repository contains NO `prisma/migrations` directory.** Schema is provisioned with `prisma db push` only on disposable PostgreSQL. This is a schema-sync check, **not** a migration test. The raw-SQL coupon tables are absent from Prisma schema; integration test creates minimal temporary tables solely for coupon contract reproduction. Coupon findings therefore do not verify the deployment's unmanaged table constraints.
- Critical business-invariant tests are **intentionally assertive**, not informational PASSes. If the application can create two orders on replay, over-reserve stock, or exceed coupon usage, the integration job will fail and preserve detailed observed outcomes in GitHub artifacts. Such failures are expected to require source-code fixes by the separate developer.
- Actual Chromium E2E (`scripts/qa/browser-e2e.mjs`) uses temporary Playwright installation outside the repository and no changes to application dependencies. Runs desktop 1366×900 and mobile 390×844 against localhost only. No order or payment submission; invalid checkout stops at contact validation. Failure screenshots and JSON results are saved. Browser failure is a real failure, not ignored.
- Production-only npm audit gate remains active and strict. `package.json` and lockfile unchanged.

## Reproducible integration run (ONLY with disposable local PostgreSQL)

Create an ephemeral local PostgreSQL instance with user `nexora_qa` and DB `nexora_qa`, set both `DATABASE_URL` and `DIRECT_URL` to its exact localhost connection URL, enable `NEXORA_QA_ALLOW_DB_INTEGRATION=true`, then:

```bash
npm ci
npx --no-install prisma db push
npx --no-install tsx --test tests/integration/*.test.ts
```

Never run this suite pointing at production. There are no migration files, and do not invoke production seed scripts.

## Evidence and limits

CI job logs are authoritative for actual test counts, HTTP codes, browser executions and bug confirmations. Document any failed invariants in `docs/qa/KNOWN_RISKS.md`; do not claim PASS until GitHub Actions confirms execution. External APIs, live payment gateways, live customer information, and visual snapshot baselines remain outside scope.
