import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";

const NATIVE_ORIGINS = new Set([
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
  "ionic://localhost",
  "https://127.0.0.1",
  "http://127.0.0.1",
]);

function allowedOrigins() {
  const configured = (process.env.ADMIN_APP_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return new Set([...NATIVE_ORIGINS, ...configured]);
}

function requestOrigin(request: Request) {
  return request.headers.get("origin")?.trim().replace(/\/$/, "") ?? null;
}

function acceptedOrigin(request: Request) {
  const origin = requestOrigin(request);
  if (!origin) return null;
  return allowedOrigins().has(origin) ? origin : null;
}

export function adminCorsHeaders(request: Request) {
  const origin = acceptedOrigin(request);

  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Expose-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };
}

export function adminJson<T>(request: Request, data: T, status = 200) {
  return NextResponse.json(
    { ok: true, data },
    { status, headers: adminCorsHeaders(request) },
  );
}

export function adminFailure(request: Request, error: string, status = 400) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: adminCorsHeaders(request) },
  );
}

export function adminOptions(request: Request) {
  const origin = requestOrigin(request);

  if (origin && !acceptedOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: "Origin not allowed." },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          Vary: "Origin",
        },
      },
    );
  }

  return new NextResponse(null, {
    status: 204,
    headers: adminCorsHeaders(request),
  });
}

export async function requireAdmin(request: Request) {
  return getAdminSession(request);
}

export function adminUnexpected(request: Request, error: unknown) {
  console.error("NEXORA Admin API error", error);
  return adminFailure(request, "Unexpected admin server error.", 500);
}
