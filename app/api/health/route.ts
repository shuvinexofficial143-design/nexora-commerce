import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db/prisma";
import { deploymentInfo } from "@/lib/config/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const started = Date.now();

  try {
    await getPrisma().$queryRaw`select 1`;

    return NextResponse.json(
      {
        ok: true,
        service: "nexora-commerce",
        database: "connected",
        deployment: deploymentInfo(),
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      { headers: CORS },
    );
  } catch (error) {
    console.error("NEXORA health check failed", error);

    return NextResponse.json(
      {
        ok: false,
        service: "nexora-commerce",
        database: "unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: CORS },
    );
  }
}
