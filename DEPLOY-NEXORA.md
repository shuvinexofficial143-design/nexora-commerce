# NEXORA production deployment

Batch 08 turns `nexora-commerce` into the HTTPS backend used by the Android admin app.

## Security model

- `/admin` is permanently rendered as 404.
- The Android app does not contain `DATABASE_URL` or `DIRECT_URL`.
- Admin APIs are reachable over HTTPS but require a valid server-issued ADMIN bearer token.
- Capacitor origin `https://localhost` is explicitly allowed for admin API CORS.
- Production DB credentials are stored in Vercel encrypted environment variables.

## Deployment

From PowerShell:

`powershell -ExecutionPolicy Bypass -File C:\WebProjects\nexora-commerce\scripts\deploy\deploy-production.ps1`

The script reads your existing `.env.local` without printing secrets, signs in to Vercel if required, creates/links the `nexora-commerce` project under the `avanti-verse` scope, deploys it, persists production env values, verifies DB/CORS, and writes the final HTTPS URL into:

`C:\WebProjects\nexora-admin-app\.env.android`

After this passes, the Admin APK can be built against the live server.
