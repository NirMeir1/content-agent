import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
export default async function setup() {
  mkdirSync("data", { recursive: true });
  const client = createClient({ url: "file:./data/e2e.db" });
  await client.execute(
    "CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, updated_at TEXT NOT NULL)",
  );
  await client.execute("DELETE FROM workspaces");
  client.close();
}
