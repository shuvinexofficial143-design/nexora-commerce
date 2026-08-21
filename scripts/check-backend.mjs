import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DIRECT_URL / DATABASE_URL is missing.");
  console.error("Create .env.local from .env.example and paste the NEXORA Supabase connection strings.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
});

try {
  await client.connect();
  const result = await client.query("select current_database() as database, current_user as user, now() as time");
  const row = result.rows[0];
  console.log("✅ NEXORA PostgreSQL connection successful");
  console.log(`Database: ${row.database}`);
  console.log(`User: ${row.user}`);
  console.log(`Server time: ${row.time}`);
} catch (error) {
  console.error("❌ NEXORA database connection failed");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
