import { loadEnvConfig } from "@next/env";
import { Client } from "pg";

loadEnvConfig(process.cwd());

async function checkConnection(name: "DIRECT_URL" | "DATABASE_URL") {
  const connectionString = process.env[name];

  if (!connectionString) {
    console.log(`${name}: missing`);
    return;
  }

  const url = new URL(connectionString);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(
      "select current_database() as database, current_schema() as schema, current_user as user",
    );
    console.log(`${name}: ok ${JSON.stringify(result.rows[0])}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${name}: failed ${JSON.stringify({
      host: url.hostname,
      port: url.port || "5432",
      user: url.username,
      database: url.pathname.slice(1),
      message,
    })}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function main() {
  await checkConnection("DIRECT_URL");
  await checkConnection("DATABASE_URL");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
