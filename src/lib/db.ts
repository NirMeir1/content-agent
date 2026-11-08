import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { eq, and } from "drizzle-orm";
import { mkdirSync } from "node:fs";
import { emptyState, seededState } from "./demo";
import type { State } from "./contracts";
export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  revision: integer("revision").notNull().default(0),
  data: text("data", { mode: "json" }).$type<State>().notNull(),
  updatedAt: text("updated_at").notNull(),
});
let connection: ReturnType<typeof createClient> | undefined;
function client() {
  if (!connection) {
    const url = process.env.DATABASE_URL || "file:./data/pilot.db";
    if (url.startsWith("file:./data/")) mkdirSync("data", { recursive: true });
    connection = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return connection;
}
export function database() {
  return drizzle(client());
}
let initialized: Promise<void> | undefined;
export function initialize() {
  return (initialized ??= (async () => {
    await client().execute(
      "CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    await client().execute(
      "CREATE TABLE IF NOT EXISTS generation_usage (day TEXT PRIMARY KEY, count INTEGER NOT NULL)",
    );
  })());
}
export async function loadWorkspace(key: "demo" | "own") {
  await initialize();
  const db = database();
  await db
    .insert(workspaces)
    .values({
      id: key,
      data: key === "demo" ? seededState() : emptyState(),
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoNothing();
  const [row] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, key));
  return { state: row.data, revision: row.revision };
}
export async function saveWorkspace(
  key: string,
  revision: number,
  state: State,
) {
  const rows = await database()
    .update(workspaces)
    .set({
      data: state,
      revision: revision + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(workspaces.id, key), eq(workspaces.revision, revision)))
    .returning({ revision: workspaces.revision });
  if (!rows.length)
    throw new Error("המידע השתנה בחלון אחר. יש לרענן ולנסות שוב.");
  return revision + 1;
}
export async function resetDemo() {
  await initialize();
  await database().delete(workspaces).where(eq(workspaces.id, "demo"));
  await loadWorkspace("demo");
}
export async function reserveGeneration(day: string) {
  await initialize();
  const limit = Number(process.env.DAILY_GENERATION_LIMIT || 30);
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error("מגבלת יצירה לא תקינה");
  const result = await client().execute({
    sql: "INSERT INTO generation_usage(day,count) VALUES (?,1) ON CONFLICT(day) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count",
    args: [day, limit],
  });
  if (!result.rows.length)
    throw new Error(
      "הגענו למכסת היצירה היומית. אפשר להמשיך לערוך ולאשר, ולנסות ליצור שוב מחר.",
    );
}
