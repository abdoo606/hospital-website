import 'server-only';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
const globalForDb = globalThis as unknown as { sqlite?: Database.Database };
export function getDb(): Database.Database {
  if (!globalForDb.sqlite) {
    const db = new Database(resolve(process.env.DATABASE_PATH || 'data/app.sqlite'), { fileMustExist: true });
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    globalForDb.sqlite = db;
  }
  return globalForDb.sqlite;
}
