# GPT Customer Operations — Handoff / Next Command

**Owner branch:** `feature/nexora-gpt-customer-ops` (never `main`, `feature/nexora-gift-store`, or `feature/nexora-qa-automation`).

## Continuation rules
1. Query the latest remote HEAD, feature-only workflow and `docs/development/GPT_CUSTOMER_OPS_PROGRESS.md`.
2. Verify Milestone 1 outcomes against actual GitHub Actions, not this document alone.
3. Finish any pending M1 fixes/verification first; do not mark COMPLETE from code review only.
4. For new `next`, begin M2 customer return requests using authenticated tracking access, reusing existing ReturnRequest/Admin approval/refund safety guards.
5. Do not repeat old architecture or modify Cline-owned product management, homepage, category, or universal attribute files.
6. No production deployments, schema migrations, emails, refunds or paid courier APIs.

## Secure guest tracking APIs
- `POST /api/backend/orders/track/request`: JSON `{orderNumber,email}`. Returns 202 generic message and `challengeId`; actual email sent only when matched.
- `POST /api/backend/orders/track/verify`: JSON `{challengeId,code}`; returns temporary `accessToken` on one successful verification.
- `GET /api/backend/orders/track`: header `Authorization: Bearer <temporary-token>`; never GET order + email directly. Returns current status/items/timestamps/address/payment/eligibility guidance.
- Existing checkout/order creation API untouched.

## Required CI
`.github/workflows/gpt-customer-ops.yml` runs existing units, new security tests, lint, TS, build, strict audit, isolated postgres tests, actual Chromium tracking UI and existing storefront browser regressions. Fill in exact final CI results and SHA after execution.

## Current known blockers
Additive tracking challenge SQL needs production schema review and controlled application. Real configured Resend delivery and shared rate limiting need staging/production validation. No production migration or real email in QA.
