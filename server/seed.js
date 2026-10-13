/**
 * Seed the database.
 *
 *   npm run db:seed      → insert demo content + admin account if the DB is empty
 *   npm run db:reset     → wipe every table and re-seed (asks for confirmation unless --force)
 *   npm run db:demo      → also insert sample patient enquiries to demo the inbox
 */
import { db, migrate, run, get, all, saveSettings, transaction } from './db.js'
import { hashPassword, passwordProblems } from './auth.js'
import * as seed from './seed-data.js'

const args = process.argv.slice(2)
const RESET = args.includes('--reset') || args.includes('--force')
const WITH_DEMO = args.includes('--demo')

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@meridianhospital.com'
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Meridian#2026'
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'Hospital Administrator'

const TABLES = [
  'media',
  'audit_log',
  'appointments',
  'users',
  'insurers',
  'testimonials',
  'faqs',
  'consultants',
  'departments',
  'settings',
]

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function wipe() {
  transaction(() => {
    for (const table of TABLES) db.exec(`DELETE FROM ${table}`)
    db.exec("DELETE FROM sqlite_sequence WHERE name NOT IN ('')")
  })
}

function isSeeded() {
  return get('SELECT COUNT(*) AS n FROM departments')?.n > 0
}

function seedContent() {
  transaction(() => {
    // settings
    saveSettings(seed.settings, { email: 'seed' }, '')

    // departments
    const insertDept = db.prepare(
      `INSERT INTO departments (slug, name, tagline, blurb, icon, highlights, wait_label, sort_order)
       VALUES (@slug, @name, @tagline, @blurb, @icon, @highlights, @wait_label, @sort_order)`,
    )
    seed.departments.forEach((d, i) => {
      insertDept.run({
        slug: slugify(d.name),
        name: d.name,
        tagline: d.tagline,
        blurb: d.blurb,
        icon: d.icon,
        highlights: JSON.stringify(d.highlights),
        wait_label: d.wait_label,
        sort_order: (i + 1) * 10,
      })
    })

    // consultants (link to departments by name)
    const insertConsultant = db.prepare(
      `INSERT INTO consultants
        (name, title, department_id, credentials, years, rating, reviews, languages, availability, sort_order)
       VALUES (@name, @title, @department_id, @credentials, @years, @rating, @reviews, @languages, @availability, @sort_order)`,
    )
    seed.consultants.forEach((c, i) => {
      const dept = get('SELECT id FROM departments WHERE name = ?', [c.department])
      insertConsultant.run({ ...c, department_id: dept?.id ?? null, sort_order: (i + 1) * 10 })
    })

    const insertFaq = db.prepare(
      'INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)',
    )
    seed.faqs.forEach((f, i) => insertFaq.run(f.question, f.answer, (i + 1) * 10))

    const insertTestimonial = db.prepare(
      'INSERT INTO testimonials (quote, name, detail, location, sort_order) VALUES (?, ?, ?, ?, ?)',
    )
    seed.testimonials.forEach((t, i) =>
      insertTestimonial.run(t.quote, t.name, t.detail, t.location, (i + 1) * 10),
    )

    const insertInsurer = db.prepare('INSERT INTO insurers (name, sort_order) VALUES (?, ?)')
    seed.insurers.forEach((name, i) => insertInsurer.run(name, (i + 1) * 10))
  })
}

function seedAdmin() {
  const existing = get('SELECT id FROM users WHERE email = ?', [DEFAULT_ADMIN_EMAIL])
  if (existing) {
    console.log(`  · admin account already exists (${DEFAULT_ADMIN_EMAIL})`)
    return
  }
  const problems = passwordProblems(DEFAULT_ADMIN_PASSWORD)
  if (problems.length) {
    console.warn(`  ! default admin password is weak (missing ${problems.join(', ')})`)
  }
  run(
    `INSERT INTO users (name, email, password_hash, role, must_change_password)
     VALUES (?, ?, ?, 'admin', 1)`,
    [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, hashPassword(DEFAULT_ADMIN_PASSWORD)],
  )
  console.log(`  · admin account created: ${DEFAULT_ADMIN_EMAIL}`)
  console.log(`    password: ${DEFAULT_ADMIN_PASSWORD}  (you will be asked to change it on first login)`)
}

function demoEnquiries() {
  const samples = [
    ['Sarah Whitfield', 'sarah.whitfield@example.com', '+44 7700 900123', 'Cardiology', 'Dr. Amelia Hartley', 'new', 'Chest tightness on exertion for three weeks. GP has requested a specialist opinion.', 'Evening (17:00 – 20:00)', 'BUPA insurance'],
    ['Yusuf Al-Ansari', 'y.alansari@example.com', '+974 5555 0112', 'Oncology', 'Dr. Priya Raghunathan', 'contacted', 'Recently diagnosed, travelling from Doha. Need imaging and a treatment plan within one week.', 'As soon as possible', 'Self-funding'],
    ['Margaret Doyle', 'm.doyle@example.com', '+44 7700 900541', 'Orthopaedics', 'Mr. Daniel Okonjo', 'booked', 'Right knee osteoarthritis, keen to discuss robotic knee replacement.', 'Morning (08:00 – 12:00)', 'AXA Health insurance'],
    ['Peter Nowak', 'peter.nowak@example.com', '+48 600 123 456', 'Diagnostics & Imaging', '', 'completed', 'Health screening package plus full blood profile before starting a new job.', 'Morning (08:00 – 12:00)', 'Self-funding'],
    ['Lin Wei', 'lin.wei@example.com', '+65 8123 4567', 'Maternity', 'Dr. Hannah Weiss', 'new', 'First pregnancy, 9 weeks. Looking for private consultant-led care.', 'Afternoon (12:00 – 17:00)', 'Allianz Care insurance'],
    ['Derek Halloway', 'd.halloway@example.com', '+44 7700 900887', 'Neurology', 'Dr. Sofia Marchetti', 'cancelled', 'Recurring migraines — cancelled, will rebook after holiday.', 'Evening (17:00 – 20:00)', 'Self-funding'],
  ]

  transaction(() => {
    const stmt = db.prepare(
      `INSERT INTO appointments
        (reference, patient_name, email, phone, department, consultant, preferred_time, message, status, funder, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'website', datetime('now', ?))`,
    )
    samples.forEach((s, i) => {
      const [name, email, phone, department, consultant, status, message, time, funder] = s
      stmt.run(
        `MER-${400100 + i * 37}`,
        name,
        email,
        phone,
        department,
        consultant,
        time,
        message,
        status,
        funder,
        `-${i + 1} days`,
      )
    })
  })
  console.log(`  · ${samples.length} sample patient enquiries inserted`)
}

// ---------- run ----------

console.log('\nPrivate Hospital CMS — database seed')
migrate()

if (RESET) {
  wipe()
  console.log('  · all tables cleared')
}

if (isSeeded()) {
  console.log('  · content already present — skipping content seed (use `npm run db:reset` to wipe)')
} else {
  seedContent()
  console.log('  · settings, departments, consultants, FAQs, testimonials and insurers inserted')
}

seedAdmin()

if (WITH_DEMO) demoEnquiries()

const counts = {
  departments: get('SELECT COUNT(*) n FROM departments').n,
  consultants: get('SELECT COUNT(*) n FROM consultants').n,
  faqs: get('SELECT COUNT(*) n FROM faqs').n,
  insurers: get('SELECT COUNT(*) n FROM insurers').n,
  users: get('SELECT COUNT(*) n FROM users').n,
  appointments: get('SELECT COUNT(*) n FROM appointments').n,
}

console.log('\n  Database ready:')
for (const [table, n] of Object.entries(counts)) console.log(`    ${table.padEnd(14)} ${n}`)
console.log('\n  Next: npm run dev  →  site on :5173  ·  admin on :5173/admin.html\n')

if (WITH_DEMO && get('SELECT COUNT(*) n FROM appointments').n > 0) {
  console.log('  Tip: sample enquiries contain fictional patients — clear them before going live:')
  console.log('       npm run db:reset\n')
}
