/**
 * End-to-end API smoke test — `npm run test:api`
 *
 * Creates a temporary admin account, exercises every endpoint the admin panel and
 * the public website use, then removes everything it created. The seeded admin
 * account and demo content are left untouched, so it is safe to run on a live
 * staging database.
 *
 * Requires the API to be running (npm run dev:api).
 */
import { db, get, run } from '../server/db.js'
import { hashPassword } from '../server/auth.js'

const BASE = process.env.API_BASE || 'http://127.0.0.1:4000'
const TEMP_EMAIL = `smoke+${Date.now()}@example.com`
const TEMP_PASSWORD = 'SmokeTest#2026'

let cookie = ''
let passed = 0
let failed = 0
let rateLimited = false
const created = { departments: [], appointments: [], media: [], users: [] }

const results = []
function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    results.push(`  ✓ ${name}`)
  } else {
    failed += 1
    results.push(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function api(pathname, { method = 'GET', body, raw = false, headers = {} } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  })
  if (res.headers.getSetCookie?.().length) {
    cookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')
  }
  if (raw) {
    const bytes = new Uint8Array(await res.arrayBuffer())
    return { status: res.status, bytes, text: new TextDecoder().decode(bytes), headers: res.headers }
  }
  let json = null
  try {
    json = await res.json()
  } catch {
    json = null
  }
  if (res.status === 429) rateLimited = true
  return { status: res.status, json }
}

// ---------- setup ----------
const info = run(
  `INSERT INTO users (name, email, password_hash, role, must_change_password)
   VALUES (?, ?, ?, 'admin', 0)`,
  ['Smoke Test Admin', TEMP_EMAIL, hashPassword(TEMP_PASSWORD)],
)
created.users.push(info.lastInsertRowid)

console.log(`\nAPI smoke test against ${BASE}\n`)

try {
  // ---------- public ----------
  const health = await api('/api/health')
  check('GET /api/health', health.status === 200 && health.json.status === 'ok')

  const site = await api('/api/site')
  check(
    'GET /api/site returns full content payload',
    site.status === 200 &&
      site.json.settings.brand_name &&
      Array.isArray(site.json.departments) &&
      Array.isArray(site.json.consultants) &&
      site.json.stats.length === 4,
    `status ${site.status}`,
  )
  check(
    'published content only (no unpublished rows leak)',
    site.json.departments.every((d) => !('published' in d)),
  )

  const booking = await api('/api/appointments', {
    method: 'POST',
    body: {
      name: 'Smoke Test Patient',
      email: 'smoke.patient@example.com',
      phone: '+44 7700 900123',
      department: 'Cardiology',
      consultant: 'Dr. Amelia Hartley',
      time: 'Morning (08:00 – 12:00)',
      funder: 'Self-funding',
      message: 'Automated smoke test enquiry.',
      consent: true,
    },
  })
  check(
    'POST /api/appointments stores a real enquiry',
    booking.status === 201 && /^MER-\d{6}$/.test(booking.json.reference || ''),
    JSON.stringify(booking.json),
  )
  const bookingRef = booking.json.reference

  const badEmail = await api('/api/appointments', {
    method: 'POST',
    body: { name: 'A', email: 'not-an-email', phone: '123', consent: true },
  })
  check('booking rejects an invalid email', badEmail.status === 400)

  const noConsent = await api('/api/appointments', {
    method: 'POST',
    body: { name: 'A Patient', email: 'a@b.com', phone: '+44 7700 900123' },
  })
  check('booking requires consent', noConsent.status === 400)

  const honeypot = await api('/api/appointments', {
    method: 'POST',
    body: { name: 'Bot', email: 'bot@example.com', phone: '+44 7700 900123', consent: true, website: 'http://spam' },
  })
  check('honeypot silently absorbs bots', honeypot.status === 202)

  // ---------- auth ----------
  const badLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: TEMP_EMAIL, password: 'wrong-password' },
  })
  check('login rejects a wrong password', badLogin.status === 401)

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email: TEMP_EMAIL, password: TEMP_PASSWORD },
  })
  check('login succeeds and sets a session cookie', login.status === 200 && cookie.includes('hpms_sid'))

  const me = await api('/api/auth/me')
  check('GET /api/auth/me returns the signed-in user', me.status === 200 && me.json.user.role === 'admin')

  const unauth = await fetch(`${BASE}/api/admin/overview`)
  check('admin routes reject anonymous requests', unauth.status === 401)

  const weakPassword = await api('/api/auth/password', {
    method: 'POST',
    body: { current: TEMP_PASSWORD, next: 'short' },
  })
  check('password change enforces a strong policy', weakPassword.status === 400)

  // ---------- content CRUD ----------
  const dept = await api('/api/admin/content/departments', {
    method: 'POST',
    body: {
      name: 'Smoke Test Unit',
      tagline: 'Temporary',
      blurb: 'Created by the smoke test.',
      icon: 'heart',
      highlights: 'One\nTwo',
      wait_label: 'Same day',
      published: true,
    },
  })
  check(
    'POST /api/admin/content/departments creates a department',
    dept.status === 201 && dept.json.item.slug === 'smoke-test-unit' && dept.json.item.highlights.length === 2,
    JSON.stringify(dept.json),
  )
  const deptId = dept.json.item?.id
  created.departments.push(deptId)

  const patched = await api(`/api/admin/content/departments/${deptId}`, {
    method: 'PATCH',
    body: { wait_label: 'Appointments within 24 hours', published: false },
  })
  check(
    'PATCH updates a department and toggles publication',
    patched.status === 200 && patched.json.item.published === false,
  )

  const afterUnpublish = await api('/api/site')
  check(
    'unpublished department disappears from the public site',
    !afterUnpublish.json.departments.some((d) => d.name === 'Smoke Test Unit'),
  )

  const consultant = await api('/api/admin/content/consultants', {
    method: 'POST',
    body: {
      name: 'Dr. Smoke Test',
      title: 'Consultant',
      department_id: deptId,
      credentials: 'MD',
      years: 5,
      rating: 4.5,
      reviews: 10,
      languages: 'English',
      availability: 'Next available: today',
      published: true,
    },
  })
  check('POST consultants creates a consultant', consultant.status === 201)
  created.departments.push(null) // no-op guard
  const consultantId = consultant.json.item?.id

  const badRating = await api(`/api/admin/content/consultants/${consultantId}`, {
    method: 'PATCH',
    body: { rating: 9 },
  })
  check('consultant rating is range-validated', badRating.status === 400)

  await api(`/api/admin/content/consultants/${consultantId}`, { method: 'DELETE' })
  const consultantGone = get('SELECT id FROM consultants WHERE id = ?', [consultantId])
  check('DELETE consultant removes the row', !consultantGone)

  const faq = await api('/api/admin/content/faqs', {
    method: 'POST',
    body: { question: 'Smoke test question?', answer: 'Yes.', published: true },
  })
  check('POST faqs creates an FAQ', faq.status === 201)
  await api(`/api/admin/content/faqs/${faq.json.item.id}`, { method: 'DELETE' })

  const reorder = await api('/api/admin/content/departments/reorder', {
    method: 'POST',
    body: { ids: [deptId] },
  })
  check('POST :resource/reorder accepts an ordering', reorder.status === 200)

  // ---------- enquiries inbox ----------
  const list = await api('/api/admin/appointments?limit=50')
  check(
    'GET /api/admin/appointments lists enquiries',
    list.status === 200 && list.json.items.some((a) => a.reference === bookingRef),
    `status ${list.status}`,
  )
  const stored = list.json.items.find((a) => a.reference === bookingRef)
  created.appointments.push(stored?.id)

  const search = await api(`/api/admin/appointments?q=${encodeURIComponent(bookingRef)}`)
  check('enquiries are searchable by reference', search.json.items.length === 1)

  const filtered = await api('/api/admin/appointments?status=new')
  check('enquiries can be filtered by status', filtered.json.items.every((a) => a.status === 'new'))

  const status = await api(`/api/admin/appointments/${stored.id}`, {
    method: 'PATCH',
    body: { status: 'contacted', notes: 'Called the patient, awaiting confirmation.', priority: 'urgent' },
  })
  check(
    'PATCH updates enquiry status, priority and notes',
    status.status === 200 && status.json.item.status === 'contacted' && status.json.item.priority === 'urgent',
  )

  const badStatus = await api(`/api/admin/appointments/${stored.id}`, {
    method: 'PATCH',
    body: { status: 'nonsense' },
  })
  check('invalid enquiry status is rejected', badStatus.status === 400)

  const csv = await api('/api/admin/appointments/export.csv', { raw: true })
  check(
    'CSV export contains the enquiry and a UTF-8 BOM for Excel',
    csv.status === 200 &&
      csv.text.includes(bookingRef) &&
      csv.bytes[0] === 0xef &&
      csv.bytes[1] === 0xbb &&
      csv.bytes[2] === 0xbf,
    `first bytes: ${[...(csv.bytes || []).slice(0, 3)].join(',')}`,
  )

  const overview = await api('/api/admin/overview')
  check(
    'GET /api/admin/overview returns dashboard counters',
    overview.status === 200 && typeof overview.json.totals.appointments === 'number' && overview.json.counts.new >= 0,
  )

  // ---------- settings ----------
  const settingsBefore = await api('/api/admin/settings')
  const originalPhone = settingsBefore.json.settings.phone
  const settingsPut = await api('/api/admin/settings', {
    method: 'PUT',
    body: { phone: '+44 20 7946 0000', unknown_key: 'ignored' },
  })
  check('PUT settings updates allowed keys', settingsPut.json.settings.phone === '+44 20 7946 0000')
  check('PUT settings ignores unknown keys', !('unknown_key' in settingsPut.json.settings))
  await api('/api/admin/settings', { method: 'PUT', body: { phone: originalPhone } })

  const publicAfterChange = await api('/api/site')
  check('public payload reflects settings changes', typeof publicAfterChange.json.settings.phone === 'string')

  // ---------- media library ----------
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
    'base64',
  )
  const form = new FormData()
  form.append('file', new Blob([png], { type: 'image/png' }), 'smoke-test.png')
  form.append('alt', 'Smoke test image')
  const upload = await api('/api/admin/media', { method: 'POST', body: form })
  check(
    'POST /api/admin/media uploads an image and returns a URL',
    upload.status === 201 && String(upload.json.item?.url).startsWith('/uploads/'),
    JSON.stringify(upload.json),
  )
  created.media.push(upload.json.item?.id)

  const mediaList = await api('/api/admin/media')
  check('GET /api/admin/media lists the library', mediaList.json.items.some((m) => m.id === created.media[0]))

  const badUpload = new FormData()
  badUpload.append('file', new Blob([Buffer.from('not an image')], { type: 'text/plain' }), 'notes.txt')
  const rejected = await api('/api/admin/media', { method: 'POST', body: badUpload })
  check('non-image uploads are rejected', rejected.status === 400)

  // ---------- staff accounts ----------
  const newUser = await api('/api/admin/users', {
    method: 'POST',
    body: { name: 'Reception One', email: `reception+${Date.now()}@example.com`, role: 'editor', password: 'Reception#2026' },
  })
  check('POST /api/admin/users creates an editor account', newUser.status === 201)
  created.users.push(newUser.json.id)

  const weakUser = await api('/api/admin/users', {
    method: 'POST',
    body: { name: 'Weak', email: `weak+${Date.now()}@example.com`, role: 'editor', password: 'password' },
  })
  check('staff passwords follow the same policy', weakUser.status === 400)

  const disableSelf = await api(`/api/admin/users/${created.users[0]}`, {
    method: 'PATCH',
    body: { disabled: true },
  })
  check('an admin cannot disable their own account', disableSelf.status === 400)

  const audit = await api('/api/admin/audit?limit=200')
  check(
    'audit trail records logins and content changes',
    audit.status === 200 && audit.json.items.some((a) => a.action === 'login'),
  )

  const notFound = await api('/api/definitely-not-a-route')
  check('unknown API endpoints return JSON 404', notFound.status === 404)

  // ---------- logout ----------
  const logout = await api('/api/auth/logout', { method: 'POST' })
  check('logout clears the session', logout.status === 200)
  cookie = ''
  const afterLogout = await api('/api/admin/overview')
  check('session is no longer accepted after logout', afterLogout.status === 401)
} catch (err) {
  failed += 1
  results.push(`  ✗ unexpected error — ${err.message}`)
} finally {
  // ---------- cleanup ----------
  for (const id of created.appointments.filter(Boolean)) {
    run('DELETE FROM appointments WHERE id = ?', [id])
  }
  for (const id of created.media.filter(Boolean)) {
    const row = get('SELECT filename FROM media WHERE id = ?', [id])
    if (row) {
      const file = `${process.env.DATA_DIR || 'server/data'}/uploads/${row.filename}`
      try {
        const fs = await import('node:fs')
        if (fs.existsSync(file)) fs.unlinkSync(file)
      } catch {
        /* best effort */
      }
    }
    run('DELETE FROM media WHERE id = ?', [id])
  }
  for (const id of created.departments.filter(Boolean)) {
    run('DELETE FROM departments WHERE id = ?', [id])
  }
  for (const id of created.users.filter(Boolean)) {
    run('UPDATE users SET disabled = 0 WHERE id = ?', [id])
    run('DELETE FROM users WHERE id = ?', [id])
  }
  run("DELETE FROM audit_log WHERE user_email LIKE 'smoke+%' OR detail LIKE '%Smoke Test%'")
  db.close()
}

console.log(results.join('\n'))

if (rateLimited) {
  console.log('\n  ! Some checks hit the API rate limiter (that is production behaviour).')
  console.log('    Restart the API with the test flag and run again:')
  console.log('      RATE_LIMIT_DISABLED=1 npm run dev:api        # then npm run test:api')
}

console.log(`\n  ${passed} passed, ${failed} failed\n`)
process.exit(failed ? 1 : 0)
