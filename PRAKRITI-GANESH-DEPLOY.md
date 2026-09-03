# Prakriti Ganesh — isolated deployment guide

This branch is a Ganesh-store redesign derived from NEXORA code. The original NEXORA `main` branch must remain untouched.

## Non-negotiable separation

1. Create a **new PostgreSQL/Supabase project** for Prakriti Ganesh.
2. Never reuse NEXORA `DATABASE_URL` or `DIRECT_URL`.
3. Create a **new Vercel project** such as `prakriti-ganesh`; do not point the existing NEXORA production project at this branch.
4. Keep Prakriti environment variables only in the new project.
5. The storefront session cookie in this branch is `prakriti_ganesh_session`, separate from the NEXORA cookie.

## Local setup

Copy `.env.prakriti.example` to `.env.local` and fill only the new Prakriti database values.

Then run:

- `npm install`
- `npm run db:generate`
- `npx prisma db push`
- `npm run db:seed`
- `npm run dev`

`db push` is appropriate for this isolated fresh development database while the new schema is being finalized. Before production launch, generate and commit a clean Prisma migration baseline from a fresh Prakriti development database and use `npm run db:deploy` in production.

## Seed accounts

- Admin: `admin@prakritiganesh.demo`
- Customer: `customer@prakritiganesh.demo`
- Demo password: `PrakritiDemo@123`

Change/remove demo accounts before accepting real customers.

## Web admin

`/admin` is enabled only in the Prakriti branch and is server-side protected by the database session and `ADMIN` role.

Current admin sections:

- Overview
- Orders
- Products
- Inventory
- Bulk enquiries
- Customers
- Coupons
- Reviews
- Returns
- Analytics
- AI insights
- Homepage CMS planning

The Products section can create a real database Product, ProductImage and Ujjain InventoryItem when the Prakriti database is connected.

## Bulk enquiries

`/bulk-orders` stores submitted society, mandal and gifting enquiries in the `BulkEnquiry` table. `/admin/bulk-enquiries` reads the live queue.

Because `BulkEnquiry` was added after the original schema, run `npx prisma db push` on the new Prakriti development DB before testing this flow.

## Before launch

Replace temporary Unsplash visuals with real murti photography, verify shipping rules for fragile/large murtis, add production payment credentials, configure transactional email/WhatsApp, review GST/tax behavior, remove demo data, run lint/type-check/build, and deploy only to the separate Prakriti project.
