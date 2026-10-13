import express from 'express'
import { all, get, run, getSettings, audit } from '../db.js'
import { rateLimit } from '../auth.js'
import * as v from '../validate.js'

const router = express.Router()

const parseHighlights = (json) => {
  try {
    const parsed = JSON.parse(json || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Everything the public website needs, in one request. */
function buildSitePayload() {
  const settings = getSettings()

  const departments = all(
    `SELECT id, slug, name, tagline, blurb, icon, highlights, wait_label
       FROM departments WHERE published = 1 ORDER BY sort_order ASC, id ASC`,
  ).map((d) => ({ ...d, highlights: parseHighlights(d.highlights), wait: d.wait_label }))

  const consultants = all(
    `SELECT c.id, c.name, c.title, c.credentials, c.years, c.rating, c.reviews,
            c.languages, c.availability, c.photo, c.bio,
            d.name AS department, d.id AS department_id
       FROM consultants c
       LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.published = 1
      ORDER BY c.sort_order ASC, c.id ASC`,
  ).map((c) => ({ ...c, dept: c.department || '' }))

  const faqs = all(
    'SELECT id, question, answer FROM faqs WHERE published = 1 ORDER BY sort_order ASC, id ASC',
  )

  const testimonials = all(
    'SELECT id, quote, name, detail, location FROM testimonials WHERE published = 1 ORDER BY sort_order ASC, id ASC',
  )

  const insurers = all(
    'SELECT id, name FROM insurers WHERE published = 1 ORDER BY sort_order ASC, id ASC',
  ).map((i) => i.name)

  const stats = [1, 2, 3, 4]
    .map((n) => ({
      value: Number(settings[`stat${n}_value`] || 0),
      suffix: settings[`stat${n}_suffix`] || '',
      label: settings[`stat${n}_label`] || '',
    }))
    .filter((s) => s.label)

  const publicSettings = {
    brand_name: settings.brand_name || '',
    brand_suffix: settings.brand_suffix || '',
    legal_name: settings.legal_name || '',
    tagline: settings.tagline || '',
    phone: settings.phone || '',
    emergency_phone: settings.emergency_phone || '',
    email: settings.email || '',
    address: settings.address || '',
    hours: settings.hours || '',
    accreditations: settings.accreditations || '',
    emergency_banner: settings.emergency_banner || '',
    seo_title: settings.seo_title || '',
    seo_description: settings.seo_description || '',
    hero_heading: settings.hero_heading || '',
    hero_highlight: settings.hero_highlight || '',
    hero_sub: settings.hero_sub || '',
    hero_image: settings.hero_image || '',
    about_image: settings.about_image || '',
    facility_image: settings.facility_image || '',
    booking_note: settings.booking_note || '',
    privacy_notice_url: settings.privacy_notice_url || '',
    terms_url: settings.terms_url || '',
    cookie_policy_url: settings.cookie_policy_url || '',
    accessibility_url: settings.accessibility_url || '',
  }

  return { settings: publicSettings, departments, consultants, faqs, testimonials, insurers, stats }
}

router.get('/site', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json(buildSitePayload())
})

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: get('SELECT COUNT(*) AS n FROM departments').n >= 0 ? 'connected' : 'error',
    time: new Date().toISOString(),
  })
})

/**
 * Public booking endpoint — the real thing.
 * Validated server-side, rate limited per IP, stored in the appointments table
 * where hospital staff pick it up in the admin inbox.
 */
router.post(
  '/appointments',
  rateLimit({ key: 'booking', limit: 8, windowMs: 60 * 60 * 1000 }),
  (req, res) => {
    const body = req.body || {}

    const checked = v.validate(body, {
      name: (val) => v.str(val, { required: true, max: 120, field: 'Full name' }),
      email: (val) => v.email(val),
      phone: (val) => v.phone(val),
      department: (val) => v.str(val, { max: 120 }),
      consultant: (val) => v.str(val, { max: 120 }),
      date: (val) => v.str(val, { max: 20 }),
      time: (val) => v.str(val, { max: 60 }),
      funder: (val) => v.str(val, { max: 80 }),
      message: (val) => v.str(val, { max: 4000 }),
    })

    if (checked.error) return res.status(400).json({ error: checked.error })

    if (body.consent !== true && body.consent !== 'true' && body.consent !== 1 && body.consent !== '1') {
      return res.status(400).json({ error: 'Consent is required to process your request.' })
    }

    // Honeypot: bots fill hidden fields, humans never see them.
    if (body.website) return res.status(202).json({ ok: true, reference: 'MER-000000' })

    const data = checked.value
    let reference = v.reference()
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (!get('SELECT id FROM appointments WHERE reference = ?', [reference])) break
      reference = v.reference()
    }

    const info = run(
      `INSERT INTO appointments
        (reference, patient_name, email, phone, department, consultant, preferred_date,
         preferred_time, funder, message, source, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reference,
        data.name,
        data.email,
        data.phone,
        data.department,
        data.consultant,
        data.date,
        data.time,
        data.funder,
        data.message,
        'website',
        req.ip || '',
        String(req.headers['user-agent'] || '').slice(0, 300),
      ],
    )

    audit({
      action: 'create',
      entity: 'appointments',
      entityId: info.lastInsertRowid,
      detail: `public enquiry ${reference} (${data.department || 'unassigned'})`,
      ip: req.ip || '',
    })

    res.status(201).json({
      ok: true,
      reference,
      message: 'Your request has been received. Our team will contact you shortly.',
    })
  },
)

export default router
