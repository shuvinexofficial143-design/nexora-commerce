# NEXORA 4 — Admin Development Handoff

Date: 2026-10-29
Repository: `shuvinexofficial143-design/nexora-commerce`
Authorized write branch: `feature/nexora-gift-store`
Verified functional commit: `35165afbd4eeea1a882cca9b61b5d60b58a6acd9`
Functional CI: https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40864792540 — 4/4 PASS.
Owner Chromium + disposable PostgreSQL: **25 PASS / 0 FAIL**.
A documentation-only commit follows; always verify latest actual GitHub HEAD and CI.

## Seller Approval/Edit milestone

- `lib/admin/seller-onboarding.ts`: newly created Seller User starts PENDING_VERIFICATION, not ACTIVE. SellerProfile verification PENDING, payout HOLD.
- `lib/admin/sellers.ts`: Owner reviews strictly accept verificationStatus PENDING/APPROVED/REJECTED and commissionBps integer 0–10000. Other fields (including payout updates) rejected. Row lock serializes reviews. APPROVED activates user; REJECTED suspends; PENDING restricts session. User status + profile + SELLER_REVIEW audit are a single transaction; audit failure rolls back. Identical retries write no duplicate audit. Owner listing includes userStatus.
- `app/api/admin-app/sellers/route.ts`: Owner-only GET/PATCH; appropriate 400, 404, 409, generic 500 and successful response.
- `scripts/qa/admin-browser-e2e.mjs`: new isolated PostgreSQL/Owner browser test verifies invalid/unauthorized updates, audit rollback, two concurrent approvals, payout stays HOLD, idempotency, suspension. Previously flaky Product Audit test now uses its own draft fixture.
- Interim CI `40864069614` failed on that shared-Product QA assertion (400 instead of 500). Corrected exact functional run `40864792540` passed **4/4** and **25/25 Owner tests**.

## Remaining safeguards

- Seller Approval Queue UI still DEMO-only, not connected to real Owner API.
- Existing legacy ACTIVE Seller accounts with PENDING profile status need separately approved access audit/backfill.
- No KYC, payout, seller settlement or real financial approval implemented. Order status email/outbox still best-effort.
- Reviewed migrations are NOT applied to Production. No Vercel deploy, live orders, live sellers, stock, provider calls or payments.
- Do not edit Nexora 3 or QA branches.

Next `next`: verify true latest SHA/CI. Evaluate safe real Seller Approval UI wiring and pending legacy access safety in isolated QA before production. Update docs, verify exact final CI.
