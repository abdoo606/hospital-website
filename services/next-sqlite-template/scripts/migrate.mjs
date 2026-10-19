import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const file = resolve(process.env.DATABASE_PATH || 'data/app.sqlite');
const directory = resolve(process.argv[2] || 'migrations');
mkdirSync(dirname(file), { recursive: true });
const db = new Database(file);
try {
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('journal_mode = WAL');
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  const files = readdirSync(directory).filter(name => name.endsWith('.sql')).sort();
  if (files.some(name => !/^\d{4}_[a-z0-9_]+\.sql$/.test(name))) throw new Error('Migration names must be NNNN_description.sql');
  if (new Set(files.map(name => name.slice(0,4))).size !== files.length) throw new Error('Duplicate migration number');
  const applied = db.prepare('SELECT name, checksum FROM schema_migrations ORDER BY name').all();
  // Validate the entire applied history before executing any new SQL.
  for (const row of applied) {
    if (!files.includes(row.name)) throw new Error(`Missing applied migration: ${row.name}`);
    const sum = createHash('sha256').update(readFileSync(resolve(directory, row.name))).digest('hex');
    if (sum !== row.checksum) throw new Error(`Changed applied migration: ${row.name}`);
  }
  const seen = new Set(applied.map(row => row.name));
  for (const name of files) {
    if (seen.has(name)) continue;
    if (applied.length && name < applied.at(-1).name) throw new Error(`Out-of-order migration: ${name}`);
    const sql = readFileSync(resolve(directory,name),'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)').run(name,checksum);
    })();
    console.log(`Applied ${name}`);
  }
} finally { db.close(); }
