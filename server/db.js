import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data')

export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
const DB_FILE = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : path.join(DATA_DIR, 'hospital.db')

fs.mkdirSync(DATA_DIR, { recursive: true })
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

export const db = new Database(DB_FILE)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

/** Applies schema.sql — idempotent, safe to run on every boot. */
export function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  db.exec(schema)
  return db.prepare('SELECT value FROM schema_meta WHERE key = ?').get('version')?.value
}

// ---------- Small query helpers ----------

export const all = (sql, params = []) => db.prepare(sql).all(params)
export const get = (sql, params = []) => db.prepare(sql).get(params)
export const run = (sql, params = []) => db.prepare(sql).run(params)

export function transaction(fn) {
  return db.transaction(fn)()
}

export function audit({ user, action, entity = '', entityId = '', detail = '', ip = '' }) {
  run(
    `INSERT INTO audit_log (user_id, user_email, action, entity, entity_id, detail, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user?.id ?? null, user?.email ?? 'system', action, entity, String(entityId ?? ''), detail, ip],
  )
}

export function getSettings() {
  const rows = all('SELECT key, value FROM settings')
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export function saveSettings(patch, user, ip) {
  const stmt = db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
  )
  transaction(() => {
    for (const [key, value] of Object.entries(patch)) {
      stmt.run(String(key), value === null || value === undefined ? '' : String(value))
    }
  })
  audit({ user, action: 'update', entity: 'settings', detail: Object.keys(patch).join(', '), ip })
}
