/**
 * Database backup:  npm run db:backup
 *
 * Uses SQLite's online backup API, so it is safe to run while the hospital
 * website is live — no need to stop the server. Uploaded photos and the
 * database file are copied into backups/<timestamp>/.
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'server', 'data')
const DB_FILE = process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.join(DATA_DIR, 'hospital.db')

if (!fs.existsSync(DB_FILE)) {
  console.error(`No database found at ${DB_FILE}. Run \`npm run db:seed\` first.`)
  process.exit(1)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const target = path.join(__dirname, '..', 'backups', stamp)
fs.mkdirSync(target, { recursive: true })

const destination = path.join(target, 'hospital.db')
const source = new Database(DB_FILE, { readonly: true })
await source.backup(destination)
source.close()

// Uploaded media (hospital photography) — copied, not moved.
const uploads = path.join(DATA_DIR, 'uploads')
let mediaCount = 0
if (fs.existsSync(uploads)) {
  const destUploads = path.join(target, 'uploads')
  fs.mkdirSync(destUploads, { recursive: true })
  for (const file of fs.readdirSync(uploads)) {
    fs.copyFileSync(path.join(uploads, file), path.join(destUploads, file))
    mediaCount += 1
  }
}

const size = (fs.statSync(destination).size / 1024).toFixed(0)
console.log(`\n  Backup created: ${path.relative(process.cwd(), target)}`)
console.log(`  · hospital.db  ${size} kB`)
console.log(`  · uploads      ${mediaCount} file(s)`)
console.log(`\n  Store it off-site. Patient enquiry data is personal data under GDPR.\n`)
