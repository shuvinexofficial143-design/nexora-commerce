# GPT Customer Operations — Persistent Development Progress

## Branch and baseline
- Owner repository: `shuvinexofficial143-design/nexora-commerce`
- **GPT-owned branch:** `feature/nexora-gpt-customer-ops`
- Verified initial baseline: `cb29ef24dee75c7b6b302cecc2944908dd7f10d8` from `feature/nexora-gift-store` (21 Oct 2026).
- QA reference branch: `feature/nexora-qa-automation` — read only.
- Cline feature branch and main were not modified.

## Milestone 1 — Secure guest order tracking
**State at initial implementation checkpoint:** Implemented; CI verification pending. Do not mark COMPLETE until real Postgres and browser tests pass.

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
- Source implementation checkpoint: pending GitHub Actions run and final SHA insertion.
- No live production DB, shipping, Resend, paid APIs, or checkout payments verified.
- Next milestone after M1: **M2 Customer Returns and Refund Requests** — first audit existing ReturnRequest and admin/refund controls, then implement verified guest-safe return request flow on this isolated branch.

## Risk / integration notes
- Cline owns Homepage/Product Admin/CMS/Attributes; this branch has not modified those files.
- The shared `prisma/schema.prisma` has an additive tracking model and Order relation; coordinate schema merge and controlled DB migration with checkout attempt model.
- `lib/notifications/customer-email.ts` receives a one-line export only.
- Original `app/api/backend/orders/track/route.ts` and `components/orders/track-order-client.tsx` are narrowly replaced because old verification was insufficient.
- Do not auto-merge this branch into Cline or main.
