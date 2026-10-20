import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { readFile } from "node:fs/promises";
export interface DB {
  query(sql: string, params?: any[]): Promise<{ rows: any[] }>;
  close(): Promise<void>;
}
export async function database(url?: string, directory?: string): Promise<DB> {
  let db: DB;
  if (url) {
    const pool = new pg.Pool({ connectionString: url });
    db = { query: (s, p) => pool.query(s, p), close: () => pool.end() };
  } else {
    const local = new PGlite(directory);
    await local.waitReady;
    db = { query: (s, p) => local.query(s, p), close: () => local.close() };
  }
  const sql = await readFile(
    new URL("../migrations/001_initial.sql", import.meta.url),
    "utf8",
  );
  // Idempotent initial migration, serialized at application startup.
  for (const statement of sql.split(";").filter((x) => x.trim()))
    await db.query(statement);
  return db;
}
