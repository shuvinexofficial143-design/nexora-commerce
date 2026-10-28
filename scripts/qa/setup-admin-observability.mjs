#!/usr/bin/env node
// Explicit QA-only raw SQL for tables used by the existing admin audit/notification APIs.
import { readFile } from "node:fs/promises";
import pg from "pg";

const allow = process.env.NEXORA_QA_ALLOW_DB_INTEGRATION === "true";
const sources = ["DATABASE_URL", "DIRECT_URL"].map((key) => new URL(process.env[key] || ""));
for (const u of sources) {
  if (!allow || !["127.0.0.1", "localhost", "::1", "[::1]"].includes(u.hostname) ||
      u.pathname !== "/nexora_qa" || u.username !== "nexora_qa") {
    throw new Error("Refusing to apply QA Admin observability SQL outside disposable local database.");
  }
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const sql = await readFile(new URL("../../prisma/reviewed-migrations/20261028_admin_observability.sql", import.meta.url), "utf8");
  await client.query(sql);
  const result = await client.query(
    'SELECT to_regclass(\'"AdminActivityLog"\') AS audit, to_regclass(\'"AdminNotification"\') AS notifications'
  );
  if (!result.rows[0].audit || !result.rows[0].notifications) throw new Error("Admin audit fixture schema missing.");
  console.log("QA_ONLY_ADMIN_OBSERVABILITY_TABLES_READY");
} finally {
  await client.end();
}
