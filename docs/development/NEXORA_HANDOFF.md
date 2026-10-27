# NEXORA development handoff

## Branch

Continue on `feature/nexora-gift-store`. Do not merge the separate GPT Customer Operations branch, deploy production, or run production migrations.

## Verified checkpoint

- Category/subcategory archive CRUD, brand management, category-scoped attribute definitions, and product attribute validation are present in the preserved working tree.
- Product Admin is Prisma-backed and supports product creation, category/brand assignment, status publishing, featured selection, pricing, description, poster/video media, and additional gallery images.
- Gallery image URLs are limited to approved HTTPS hosts, deduplicated, assigned stable order, and replaced transactionally without deleting the poster/video records.

## Continue next

Use the progress document's variant contract checklist before implementing variants. Do not model variants as a UI-only JSON field: checkout reservations, cart identity, and order snapshots must remain authoritative.

## Validation

Run `npm run type-check`, `npm run lint -- --no-cache`, targeted Node tests, and `npm run build` before committing. Apply only reviewed SQL in a non-production environment when database integration testing is available.