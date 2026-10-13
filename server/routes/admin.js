import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import multer from 'multer'
import {
  all,
  get,
  run,
  saveSettings,
  getSettings,
  transaction,
  audit,
  UPLOAD_DIR,
} from '../db.js'
import { requireAuth, requireAdmin, hashPassword, passwordProblems } from '../auth.js'
import * as v from '../validate.js'

const router = express.Router()

// Every admin route requires a signed-in user.
router.use(requireAuth)

class BadInput extends Error {}
const need = (result) => {
  if (result.error) throw new BadInput(result.error)
  return result.value
}

const slugify = (name) =>
  String(name)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

const uniqueSlug = (name, ignoreId = null) => {
  const base = slugify(name) || 'department'
  let candidate = base
  let n = 2
  while (
    get('SELECT id FROM departments WHERE slug = ? AND id IS NOT ?', [candidate, ignoreId])
  ) {
    candidate = `${base}-${n++}`
  }
  return candidate
}

const asArray = (json) => {
  try {
    const parsed = JSON.parse(json || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ============================================================
//  Resource definitions — one table of truth for the CRUD screens
// ============================================================

const RESOURCES = {
  departments: {
    table: 'departments',
    label: 'Department',
    order: 'sort_order ASC, id ASC',
    required: ['name'],
    fields: {
      name: (val) => need(v.str(val, { required: true, max: 120, field: 'Name' })),
      tagline: (val) => need(v.str(val, { max: 160, field: 'Tagline' })),
      blurb: (val) => need(v.str(val, { max: 1200, field: 'Description' })),
      icon: (val) => need(v.str(val, { max: 40, field: 'Icon' })),
      highlights: (val) => JSON.stringify(need(v.list(val, { max: 8 })).map((s) => s)),
      wait_label: (val) => need(v.str(val, { max: 120, field: 'Waiting time' })),
      sort_order: (val) => need(v.int(val, { min: -9999, max: 9999, field: 'Order', fallback: 0 })),
      published: (val) => v.bool(val),
    },
    out: (row) => ({
      ...row,
      highlights: asArray(row.highlights),
      published: Boolean(row.published),
    }),
  },

  consultants: {
    table: 'consultants',
    label: 'Consultant',
    order: 'sort_order ASC, id ASC',
    required: ['name'],
    fields: {
      name: (val) => need(v.str(val, { required: true, max: 120, field: 'Name' })),
      title: (val) => need(v.str(val, { max: 160, field: 'Job title' })),
      department_id: (val) => {
        const id = v.id(val)
        return id && get('SELECT id FROM departments WHERE id = ?', [id]) ? id : null
      },
      credentials: (val) => need(v.str(val, { max: 120, field: 'Credentials' })),
      years: (val) => need(v.int(val, { min: 0, max: 70, field: 'Years of experience' })),
      rating: (val) => need(v.num(val, { min: 0, max: 5, field: 'Rating' })),
      reviews: (val) => need(v.int(val, { min: 0, max: 100000, field: 'Review count' })),
      languages: (val) => need(v.str(val, { max: 160, field: 'Languages' })),
      availability: (val) => need(v.str(val, { max: 120, field: 'Availability' })),
      photo: (val) => need(v.str(val, { max: 300, field: 'Photo' })),
      bio: (val) => need(v.str(val, { max: 4000, field: 'Biography' })),
      sort_order: (val) => need(v.int(val, { min: -9999, max: 9999, field: 'Order', fallback: 0 })),
      published: (val) => v.bool(val),
    },
    out: (row) => ({ ...row, published: Boolean(row.published) }),
  },

  faqs: {
    table: 'faqs',
    label: 'FAQ',
    order: 'sort_order ASC, id ASC',
    required: ['question'],
    fields: {
      question: (val) => need(v.str(val, { required: true, max: 300, field: 'Question' })),
      answer: (val) => need(v.str(val, { max: 4000, field: 'Answer' })),
      sort_order: (val) => need(v.int(val, { min: -9999, max: 9999, field: 'Order', fallback: 0 })),
      published: (val) => v.bool(val),
    },
    out: (row) => ({ ...row, published: Boolean(row.published) }),
  },

  testimonials: {
    table: 'testimonials',
    label: 'Testimonial',
    order: 'sort_order ASC, id ASC',
    required: ['quote'],
    fields: {
      quote: (val) => need(v.str(val, { required: true, max: 1200, field: 'Quote' })),
      name: (val) => need(v.str(val, { max: 120, field: 'Patient name' })),
      detail: (val) => need(v.str(val, { max: 160, field: 'Treatment' })),
      location: (val) => need(v.str(val, { max: 120, field: 'Location' })),
      sort_order: (val) => need(v.int(val, { min: -9999, max: 9999, field: 'Order', fallback: 0 })),
      published: (val) => v.bool(val),
    },
    out: (row) => ({ ...row, published: Boolean(row.published) }),
  },

  insurers: {
    table: 'insurers',
    label: 'Insurer',
    order: 'sort_order ASC, id ASC',
    required: ['name'],
    fields: {
      name: (val) => need(v.str(val, { required: true, max: 120, field: 'Insurer name' })),
      sort_order: (val) => need(v.int(val, { min: -9999, max: 9999, field: 'Order', fallback: 0 })),
      published: (val) => v.bool(val),
    },
    out: (row) => ({ ...row, published: Boolean(row.published) }),
  },
}

const resourceList = Object.keys(RESOURCES)

resourceList.forEach((resource) => {
  const config = RESOURCES[resource]
  const base = `/content/${resource}`

  // list (including unpublished, for the admin UI)
  router.get(base, (_req, res) => {
    const rows = all(`SELECT * FROM ${config.table} ORDER BY ${config.order}`)
    res.json({ items: rows.map(config.out) })
  })

  router.get(`${base}/:id`, (req, res) => {
    const id = v.id(req.params.id)
    const row = id ? get(`SELECT * FROM ${config.table} WHERE id = ?`, [id]) : null
    if (!row) return res.status(404).json({ error: `${config.label} not found.` })
    res.json({ item: config.out(row) })
  })

  router.post(base, (req, res, next) => {
    try {
      const input = req.body || {}
      for (const key of config.required) {
        if (!String(input[key] ?? '').trim()) {
          throw new BadInput(`${config.label} ${key} is required.`)
        }
      }
      const data = {}
      for (const [field, parse] of Object.entries(config.fields)) {
        if (field in input) data[field] = parse(input[field])
      }
      if (resource === 'departments') data.slug = uniqueSlug(data.name)

      const columns = Object.keys(data)
      const info = run(
        `INSERT INTO ${config.table} (${columns.join(', ')})
         VALUES (${columns.map(() => '?').join(', ')})`,
        columns.map((c) => data[c]),
      )
      audit({
        user: req.user,
        action: 'create',
        entity: resource,
        entityId: info.lastInsertRowid,
        detail: String(data.name || data.question || data.quote || ''),
        ip: req.ip,
      })
      const row = get(`SELECT * FROM ${config.table} WHERE id = ?`, [info.lastInsertRowid])
      res.status(201).json({ item: config.out(row) })
    } catch (err) {
      next(err)
    }
  })

  router.patch(`${base}/:id`, (req, res, next) => {
    try {
      const id = v.id(req.params.id)
      const existing = id ? get(`SELECT * FROM ${config.table} WHERE id = ?`, [id]) : null
      if (!existing) return res.status(404).json({ error: `${config.label} not found.` })

      const input = req.body || {}
      const data = {}
      for (const [field, parse] of Object.entries(config.fields)) {
        if (field in input) data[field] = parse(input[field])
      }
      if (resource === 'departments' && data.name && data.name !== existing.name) {
        data.slug = uniqueSlug(data.name, id)
      }
      const columns = Object.keys(data)
      if (!columns.length) return res.json({ item: config.out(existing) })

      run(
        `UPDATE ${config.table} SET ${columns.map((c) => `${c} = ?`).join(', ')},
         updated_at = datetime('now') WHERE id = ?`,
        [...columns.map((c) => data[c]), id],
      )
      audit({
        user: req.user,
        action: 'update',
        entity: resource,
        entityId: id,
        detail: columns.join(', '),
        ip: req.ip,
      })
      const row = get(`SELECT * FROM ${config.table} WHERE id = ?`, [id])
      res.json({ item: config.out(row) })
    } catch (err) {
      next(err)
    }
  })

  router.delete(`${base}/:id`, (req, res) => {
    const id = v.id(req.params.id)
    const existing = id ? get(`SELECT * FROM ${config.table} WHERE id = ?`, [id]) : null
    if (!existing) return res.status(404).json({ error: `${config.label} not found.` })
    run(`DELETE FROM ${config.table} WHERE id = ?`, [id])
    audit({
      user: req.user,
      action: 'delete',
      entity: resource,
      entityId: id,
      detail: String(existing.name || existing.question || existing.quote || ''),
      ip: req.ip,
    })
    res.json({ ok: true })
  })

  /** Reorder: body { ids: [3,1,2] } → sort_order 10,20,30… */
  router.post(`${base}/reorder`, (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(v.id).filter(Boolean) : []
    if (!ids.length) return res.status(400).json({ error: 'No ids supplied.' })
    transaction(() => {
      ids.forEach((id, index) => {
        run(`UPDATE ${config.table} SET sort_order = ?, updated_at = datetime('now') WHERE id = ?`, [
          (index + 1) * 10,
          id,
        ])
      })
    })
    audit({ user: req.user, action: 'reorder', entity: resource, detail: ids.join(','), ip: req.ip })
    res.json({ ok: true })
  })
})

// ============================================================
//  Patient enquiries
// ============================================================

const STATUSES = ['new', 'contacted', 'booked', 'completed', 'cancelled', 'spam']

function appointmentFilters(query) {
  const where = ['deleted_at IS NULL']
  const params = []
  if (query.status && STATUSES.includes(query.status)) {
    where.push('status = ?')
    params.push(query.status)
  }
  if (query.q) {
    where.push(
      '(patient_name LIKE ? OR email LIKE ? OR phone LIKE ? OR reference LIKE ? OR department LIKE ? OR consultant LIKE ?)',
    )
    const like = `%${String(query.q).slice(0, 80)}%`
    params.push(like, like, like, like, like, like)
  }
  if (query.from) {
    where.push('created_at >= ?')
    params.push(String(query.from).slice(0, 10))
  }
  if (query.to) {
    where.push('created_at <= ?')
    params.push(`${String(query.to).slice(0, 10)} 23:59:59`)
  }
  return { where: where.join(' AND '), params }
}

router.get('/overview', (_req, res) => {
  const counts = Object.fromEntries(
    STATUSES.map((status) => [
      status,
      get('SELECT COUNT(*) n FROM appointments WHERE status = ? AND deleted_at IS NULL', [status]).n,
    ]),
  )
  const totals = {
    appointments: get('SELECT COUNT(*) n FROM appointments WHERE deleted_at IS NULL').n,
    thisWeek: get(
      `SELECT COUNT(*) n FROM appointments WHERE deleted_at IS NULL AND created_at >= datetime('now','-7 days')`,
    ).n,
    departments: get('SELECT COUNT(*) n FROM departments').n,
    consultants: get('SELECT COUNT(*) n FROM consultants').n,
    faqs: get('SELECT COUNT(*) n FROM faqs').n,
    users: get('SELECT COUNT(*) n FROM users WHERE disabled = 0').n,
    unpublished: get(
      'SELECT (SELECT COUNT(*) FROM departments WHERE published = 0) + (SELECT COUNT(*) FROM consultants WHERE published = 0) n',
    ).n,
  }
  const recent = all(
    `SELECT id, reference, patient_name, email, department, consultant, status, created_at
       FROM appointments WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 6`,
  )
  const perDay = all(
    `SELECT date(created_at) AS day, COUNT(*) AS n
       FROM appointments
      WHERE deleted_at IS NULL AND created_at >= datetime('now','-13 days')
      GROUP BY day ORDER BY day ASC`,
  )
  res.json({ counts, totals, recent, perDay, statuses: STATUSES })
})

router.get('/appointments', (req, res) => {
  const { where, params } = appointmentFilters(req.query)
  const limit = Math.min(Number(req.query.limit) || 25, 200)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const items = all(
    `SELECT * FROM appointments WHERE ${where}
      ORDER BY CASE status WHEN 'new' THEN 0 ELSE 1 END, created_at DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  )
  const total = get(`SELECT COUNT(*) n FROM appointments WHERE ${where}`, params).n
  res.json({ items, total, limit, offset })
})

router.patch('/appointments/:id', (req, res) => {
  const id = v.id(req.params.id)
  const existing = id ? get('SELECT * FROM appointments WHERE id = ?', [id]) : null
  if (!existing) return res.status(404).json({ error: 'Enquiry not found.' })

  const patch = {}
  if ('status' in req.body) {
    const status = need(v.oneOf(req.body.status, STATUSES, { field: 'Status' }))
    patch.status = status
  }
  if ('priority' in req.body) {
    patch.priority = need(v.oneOf(req.body.priority, ['low', 'normal', 'urgent'], { field: 'Priority' }))
  }
  if ('notes' in req.body) patch.notes = need(v.str(req.body.notes, { max: 4000, field: 'Notes' }))
  if ('department' in req.body) patch.department = need(v.str(req.body.department, { max: 120 }))
  if ('consultant' in req.body) patch.consultant = need(v.str(req.body.consultant, { max: 120 }))

  const columns = Object.keys(patch)
  if (!columns.length) return res.json({ item: existing })

  run(
    `UPDATE appointments SET ${columns.map((c) => `${c} = ?`).join(', ')},
     updated_at = datetime('now') WHERE id = ?`,
    [...columns.map((c) => patch[c]), id],
  )

  if (patch.status && patch.status !== existing.status) {
    audit({
      user: req.user,
      action: 'update',
      entity: 'appointments',
      entityId: id,
      detail: `status ${existing.status} → ${patch.status} (${existing.reference})`,
      ip: req.ip,
    })
  } else {
    audit({
      user: req.user,
      action: 'update',
      entity: 'appointments',
      entityId: id,
      detail: columns.join(', '),
      ip: req.ip,
    })
  }

  res.json({ item: get('SELECT * FROM appointments WHERE id = ?', [id]) })
})

/**
 * DELETE removes an enquiry.
 *   ?hard=1  → row is removed from the active database (does not purge backups/exports)
 *   default  → soft delete, hidden from the inbox but recoverable from the database
 */
router.delete('/appointments/:id', (req, res) => {
  const id = v.id(req.params.id)
  const existing = id ? get('SELECT * FROM appointments WHERE id = ?', [id]) : null
  if (!existing) return res.status(404).json({ error: 'Enquiry not found.' })

  if (req.query.hard === '1') {
    run('DELETE FROM appointments WHERE id = ?', [id])
    audit({
      user: req.user,
      action: 'delete',
      entity: 'appointments',
      entityId: id,
      detail: `permanent erasure of ${existing.reference}`,
      ip: req.ip,
    })
    return res.json({ ok: true, erased: true })
  }

  run(`UPDATE appointments SET deleted_at = datetime('now') WHERE id = ?`, [id])
  audit({
    user: req.user,
    action: 'delete',
    entity: 'appointments',
    entityId: id,
    detail: `soft delete of ${existing.reference}`,
    ip: req.ip,
  })
  res.json({ ok: true, erased: false })
})

const csvCell = (value) => {
  let text = value === null || value === undefined ? '' : String(value)
  // Prevent formula injection when hospital staff open exported patient data in Excel.
  if (/^[\u0000-\u0020\uFEFF]*[=+\-@]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

router.get('/appointments/export.csv', (req, res) => {
  const { where, params } = appointmentFilters(req.query)
  const rows = all(`SELECT * FROM appointments WHERE ${where} ORDER BY created_at DESC`, params)
  const columns = [
    'reference',
    'created_at',
    'status',
    'priority',
    'patient_name',
    'email',
    'phone',
    'department',
    'consultant',
    'preferred_date',
    'preferred_time',
    'funder',
    'message',
    'notes',
  ]
  const csv = [
    columns.join(','),
    ...rows.map((row) => columns.map((c) => csvCell(row[c])).join(',')),
  ].join('\n')

  audit({
    user: req.user,
    action: 'export',
    entity: 'appointments',
    detail: `${rows.length} rows`,
    ip: req.ip,
  })

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="patient-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
  )
  res.send(`\uFEFF${csv}`)
})

// ============================================================
//  Settings
// ============================================================

const SETTING_KEYS = new Set([
  'brand_name', 'brand_suffix', 'legal_name', 'tagline',
  'phone', 'emergency_phone', 'email', 'address', 'hours',
  'accreditations', 'emergency_banner',
  'seo_title', 'seo_description',
  'hero_heading', 'hero_highlight', 'hero_sub',
  'hero_image', 'about_image', 'facility_image',
  'stat1_value', 'stat1_suffix', 'stat1_label',
  'stat2_value', 'stat2_suffix', 'stat2_label',
  'stat3_value', 'stat3_suffix', 'stat3_label',
  'stat4_value', 'stat4_suffix', 'stat4_label',
  'booking_note', 'retention_months',
  'privacy_notice_url', 'terms_url', 'cookie_policy_url', 'accessibility_url',
])

const LEGAL_DOCUMENT_URLS = new Set([
  'privacy_notice_url', 'terms_url', 'cookie_policy_url', 'accessibility_url',
])

const isSafeDocumentUrl = (value) => {
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

router.get('/settings', (_req, res) => {
  res.json({ settings: getSettings() })
})

router.put('/settings', requireAdmin, (req, res) => {
  const patch = {}
  for (const [key, value] of Object.entries(req.body || {})) {
    if (!SETTING_KEYS.has(key)) continue
    const checked = v.str(value, { max: 2000, field: key })
    if (checked.error) return res.status(400).json({ error: checked.error })
    if (LEGAL_DOCUMENT_URLS.has(key) && checked.value && !isSafeDocumentUrl(checked.value)) {
      return res.status(400).json({ error: `${key} must be an HTTPS URL or a same-site path.` })
    }
    patch[key] = checked.value
  }
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update.' })
  saveSettings(patch, req.user, req.ip)
  res.json({ settings: getSettings() })
})

// ============================================================
//  Media library (hospital photography / logos)
// ============================================================

const ALLOWED_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED_MIME[file.mimetype]}`),
  }),
  limits: { fileSize: 6 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME[file.mimetype]) {
      return cb(new BadInput('Only JPG, PNG, WEBP, AVIF or GIF images are allowed.'))
    }
    cb(null, true)
  },
})

router.get('/media', (_req, res) => {
  const items = all('SELECT * FROM media ORDER BY created_at DESC LIMIT 200')
  res.json({ items: items.map((m) => ({ ...m, url: `/uploads/${m.filename}` })) })
})

router.post('/media', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received.' })
  const alt = String(req.body?.alt || '').slice(0, 200)
  const info = run(
    `INSERT INTO media (filename, original_name, mime, size, alt, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, alt, req.user.email],
  )
  audit({
    user: req.user,
    action: 'upload',
    entity: 'media',
    entityId: info.lastInsertRowid,
    detail: req.file.originalname,
    ip: req.ip,
  })
  res.status(201).json({
    item: {
      id: info.lastInsertRowid,
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime: req.file.mimetype,
      size: req.file.size,
      alt,
      url: `/uploads/${req.file.filename}`,
    },
  })
})

router.delete('/media/:id', (req, res) => {
  const id = v.id(req.params.id)
  const item = id ? get('SELECT * FROM media WHERE id = ?', [id]) : null
  if (!item) return res.status(404).json({ error: 'File not found.' })
  const filePath = path.join(UPLOAD_DIR, item.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  run('DELETE FROM media WHERE id = ?', [id])
  audit({
    user: req.user,
    action: 'delete',
    entity: 'media',
    entityId: id,
    detail: item.original_name,
    ip: req.ip,
  })
  res.json({ ok: true })
})

// ============================================================
//  Staff accounts (admin role only)
// ============================================================

router.get('/users', requireAdmin, (_req, res) => {
  const items = all(
    `SELECT id, name, email, role, disabled, must_change_password, last_login_at, created_at
       FROM users ORDER BY id ASC`,
  )
  res.json({ items: items.map((u) => ({ ...u, disabled: Boolean(u.disabled) })) })
})

router.post('/users', requireAdmin, (req, res) => {
  const name = need(v.str(req.body?.name, { required: true, max: 120, field: 'Name' }))
  const email = need(v.email(req.body?.email, { field: 'Email' }))
  const role = need(v.oneOf(req.body?.role, ['admin', 'editor'], { field: 'Role', fallback: 'editor' }))
  const password = String(req.body?.password || '')

  if (get('SELECT id FROM users WHERE lower(email) = ?', [email.toLowerCase()])) {
    return res.status(409).json({ error: 'An account with that email already exists.' })
  }
  const problems = passwordProblems(password)
  if (problems.length) {
    return res.status(400).json({ error: `Password needs ${problems.join(', ')}.` })
  }

  const info = run(
    `INSERT INTO users (name, email, password_hash, role, must_change_password)
     VALUES (?, ?, ?, ?, 1)`,
    [name, email, hashPassword(password), role],
  )
  audit({
    user: req.user,
    action: 'create',
    entity: 'users',
    entityId: info.lastInsertRowid,
    detail: `${email} (${role})`,
    ip: req.ip,
  })
  res.status(201).json({ ok: true, id: info.lastInsertRowid })
})

router.patch('/users/:id', requireAdmin, (req, res) => {
  const id = v.id(req.params.id)
  const existing = id ? get('SELECT * FROM users WHERE id = ?', [id]) : null
  if (!existing) return res.status(404).json({ error: 'Account not found.' })

  const patch = {}
  if ('name' in req.body) patch.name = need(v.str(req.body.name, { required: true, max: 120, field: 'Name' }))
  if ('role' in req.body) {
    const role = need(v.oneOf(req.body.role, ['admin', 'editor'], { field: 'Role' }))
    if (existing.role === 'admin' && role !== 'admin') {
      const admins = get("SELECT COUNT(*) n FROM users WHERE role = 'admin' AND disabled = 0").n
      if (admins <= 1) return res.status(400).json({ error: 'You cannot remove the last administrator.' })
    }
    patch.role = role
  }
  if ('disabled' in req.body) {
    const disabled = v.bool(req.body.disabled)
    if (existing.id === req.user.id && disabled) {
      return res.status(400).json({ error: 'You cannot disable your own account.' })
    }
    patch.disabled = disabled
  }
  if (req.body.password) {
    const problems = passwordProblems(String(req.body.password))
    if (problems.length) return res.status(400).json({ error: `Password needs ${problems.join(', ')}.` })
    patch.password_hash = hashPassword(String(req.body.password))
    patch.must_change_password = 1
  }

  const columns = Object.keys(patch)
  if (!columns.length) return res.json({ ok: true })
  run(
    `UPDATE users SET ${columns.map((c) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`,
    [...columns.map((c) => patch[c]), id],
  )
  audit({
    user: req.user,
    action: 'update',
    entity: 'users',
    entityId: id,
    detail: columns.join(', ').replace('password_hash', 'password reset'),
    ip: req.ip,
  })
  res.json({ ok: true })
})

router.delete('/users/:id', requireAdmin, (req, res) => {
  const id = v.id(req.params.id)
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' })
  const existing = id ? get('SELECT * FROM users WHERE id = ?', [id]) : null
  if (!existing) return res.status(404).json({ error: 'Account not found.' })
  if (existing.role === 'admin') {
    const admins = get("SELECT COUNT(*) n FROM users WHERE role = 'admin'").n
    if (admins <= 1) return res.status(400).json({ error: 'You cannot delete the last administrator.' })
  }
  run('DELETE FROM users WHERE id = ?', [id])
  audit({
    user: req.user,
    action: 'delete',
    entity: 'users',
    entityId: id,
    detail: existing.email,
    ip: req.ip,
  })
  res.json({ ok: true })
})

// ============================================================
//  Audit trail
// ============================================================

router.get('/audit', requireAdmin, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500)
  const items = all('SELECT * FROM audit_log ORDER BY created_at DESC, id DESC LIMIT ?', [limit])
  res.json({ items })
})

export default router
export { BadInput }
