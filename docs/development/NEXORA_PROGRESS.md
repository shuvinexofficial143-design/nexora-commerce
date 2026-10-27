# NEXORA progress

## Current milestone

Admin product management and the dynamic multi-category homepage/CMS vertical slice on `feature/nexora-gift-store`.

## Completed in this checkpoint

- Extended the existing authenticated Admin Products screen with compare-at price, descriptions, featured selection, status controls, media, category/brand-aware creation, search, and status filtering.
- Extended product persistence validation and updates without changing cart identifiers or checkout pricing behavior.
- Added the additive `HomepageBanner` Prisma model and reviewed SQL at `prisma/reviewed-migrations/20261021_homepage_banner.sql`.
- Added authenticated banner list/create/update APIs with internal-link validation and archive support.
- Connected the public homepage hero to published CMS banners, with a safe hardcoded multi-category fallback when the database or migration is unavailable.
- Added an owner Homepage navigation entry and persistent CMS editor with create, edit, publish/unpublish, display order, image URL, CTA, category, and archive controls.
- Preserved checkout-safety merge commit `edbd0ee` and regenerated Prisma types for `CheckoutAttempt` and `HomepageBanner`.
- Completed the safe multi-image product-gallery persistence slice: approved HTTPS gallery URLs are validated, ordered, replaceable in one transaction, exposed by the Admin Products API, and editable from the authenticated Product Admin form.
- Completed live product publishing controls in the editor: category, brand, draft/active/archived status, featured selection, pricing, description, poster, video, and gallery changes persist through the real Prisma-backed Admin API.

## Tests passed

- `npm run type-check`
- `npm run lint -- --no-cache`
- Focused Node test run: 9 passed, 0 failed (`catalog-admin-validation`, `checkout-media`). The earlier checkpoint also recorded 28 passed, 0 failed across checkout-safety/backend/catalog suites.

## Git

- Existing preserved commits: `19445c3`, `7235f48`, `cb29ef2`, `edbd0ee`.
- This implementation checkpoint is pending final build, review, commit, and push.

## Known limitations / next safe steps

- The homepage banner SQL is prepared but intentionally not applied to any production database. Apply it through the normal reviewed migration process before using CMS persistence against a database.
- Added reviewed catalog-management schema/API foundations: nested categories with soft archive and counts, active/featured brands, category-scoped universal attribute definitions, and server-side product attribute validation/storage. Apply `prisma/reviewed-migrations/20261021_catalog_management.sql` before enabling these database-backed endpoints.
- Variant-level pricing/stock and cart-line identity remain intentionally pending: current checkout authoritatively reserves product-level inventory, so variants must be introduced together with the transaction and order-item contract.
- The CMS currently accepts approved remote image URLs and existing Admin media-upload URLs; direct multipart storage is not introduced.
- Product variants remain intentionally gated: variant-level price/stock, cart-line identity, and order-item snapshots must be designed and migrated together before variant editing can be safely enabled.

## Handoff for the next `next`

1. Apply the reviewed catalog SQL through the normal non-production migration process in the target environment, then exercise category, brand, attribute, product publishing, and gallery APIs against a real database.
2. Add database-backed regression coverage for product create/update/gallery replacement and storefront visibility after the database fixture strategy is selected.
3. Design the variant contract before coding: `ProductVariant` SKU/price/stock/media, cart line identity, inventory reservation, and `OrderItem.variant` snapshot must change atomically.
4. After variants, add attribute editor controls to Product Admin; the server-side category attribute validation/storage foundation is already present.