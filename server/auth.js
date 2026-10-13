import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { DATA_DIR, get, run, audit } from './db.js'

const SESSION_COOKIE = process.env.SESSION_COOKIE || 'hpms_sid'

/**
 * SameSite policy.
 *   'lax'  → correct for a hospital site served from its own domain (default)
 *   'none' → only for embedded/iframe deployments and preview environments;
 *            browsers require Secure, so it is forced on.
 */
const SAME_SITE = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase()
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours — hospital admin sessions
const SECRET_FILE = path.join(DATA_DIR, '.session-secret')

/** Session secret: from env in production, otherwise a generated file outside git. */
function loadSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET
  if (fs.existsSync(SECRET_FILE)) return fs.readFileSync(SECRET_FILE, 'utf8').trim()
  const secret = crypto.randomBytes(48).toString('base64url')
  fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 })
  return secret
}
const SECRET = loadSecret()

// ---------- Password hashing (scrypt, no native deps) ----------

export function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$16384$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, n, saltB64, hashB64] = String(stored).split('$')
    if (scheme !== 'scrypt') return false
    const salt = Buffer.from(saltB64, 'base64url')
    const expected = Buffer.from(hashB64, 'base64url')
    const actual = crypto.scryptSync(password, salt, expected.length, { N: Number(n), r: 8, p: 1 })
    return crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

export function passwordProblems(password) {
  const problems = []
  if (!password || password.length < 10) problems.push('at least 10 characters')
  if (!/[A-Z]/.test(password)) problems.push('one uppercase letter')
  if (!/[a-z]/.test(password)) problems.push('one lowercase letter')
  if (!/[0-9]/.test(password)) problems.push('one number')
  return problems
}

// ---------- Signed session tokens ----------

const sign = (payload) =>
  crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')

export function createSessionToken(user) {
  const body = Buffer.from(
    JSON.stringify({ uid: user.id, role: user.role, exp: Date.now() + SESSION_TTL_MS }),
  ).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifySessionToken(token) {
  if (!token || !token.includes('.')) return null
  const [body, signature] = token.split('.')
  const expected = sign(body)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!data.exp || data.exp < Date.now()) return null
    const user = get('SELECT id, name, email, role, must_change_password FROM users WHERE id = ?', [
      data.uid,
    ])
    if (!user) return null
    const disabled = get('SELECT disabled FROM users WHERE id = ?', [data.uid])?.disabled
    if (disabled) return null
    return user
  } catch {
    return null
  }
}

// ---------- Cookies ----------

export function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim().split('='))
      .filter((pair) => pair.length === 2)
      .map(([k, v]) => [k, decodeURIComponent(v)]),
  )
}

export function setSessionCookie(res, token) {
  const secure =
    SAME_SITE === 'none' || process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production'
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: SAME_SITE === 'none' ? 'none' : 'lax',
    secure,
    maxAge: SESSION_TTL_MS,
    path: '/',
  })
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    path: '/',
    httpOnly: true,
    sameSite: SAME_SITE === 'none' ? 'none' : 'lax',
    secure: SAME_SITE === 'none' || process.env.NODE_ENV === 'production',
  })
}

/**
 * CSRF protection for state-changing API calls.
 *
 * Browsers always send an Origin header on cross-site requests, so we require it to
 * match the host we are serving — unless the deployment explicitly allows another
 * origin (e.g. an embedded/iframe install). Non-browser clients (curl, server jobs)
 * send no Origin and are unaffected.
 */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export function csrfGuard(req, res, next) {
  const method = req.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next()

  const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '')
  if (!origin) return next()

  try {
    const parsed = new URL(origin)
    const allowed =
      parsed.host === req.headers.host ||
      ALLOWED_ORIGINS.some((rule) =>
        rule.startsWith('.') ? parsed.hostname.endsWith(rule) : parsed.host === rule || parsed.origin === rule,
      )
    if (allowed) return next()
  } catch {
    /* malformed origin falls through to the rejection below */
  }

  return res.status(403).json({ error: 'Request blocked: unexpected origin.' })
}

// ---------- Middleware ----------

export function attachUser(req, _res, next) {
  const token = (req.cookies && req.cookies[SESSION_COOKIE]) || parseCookies(req.headers.cookie)[SESSION_COOKIE]
  req.user = token ? verifySessionToken(token) : null
  next()
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' })
  if (req.user.must_change_password && !req.path.startsWith('/password')) {
    return res.status(403).json({ error: 'password_change_required' })
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator role required.' })
  next()
}

export function logoutAllFor(userId, ip) {
  run('UPDATE users SET updated_at = datetime(\'now\') WHERE id = ?', [userId])
  audit({ user: { id: userId }, action: 'logout_all', entity: 'users', entityId: userId, ip })
}

// ---------- Rate limiting (in-memory, per IP) ----------

const buckets = new Map()

// Local/staging escape hatch so automated tests can hammer the API.
// Never active in production, whatever the environment says.
const RATE_LIMIT_DISABLED =
  process.env.RATE_LIMIT_DISABLED === '1' && process.env.NODE_ENV !== 'production'

export function rateLimit({ key, limit, windowMs }) {
  return (req, res, next) => {
    if (RATE_LIMIT_DISABLED) return next()
    const id = `${key}:${req.ip}`
    const now = Date.now()
    const hits = (buckets.get(id) || []).filter((t) => now - t < windowMs)
    hits.push(now)
    buckets.set(id, hits)
    if (hits.length > limit) {
      const retry = Math.ceil((windowMs - (now - hits[0])) / 1000)
      res.setHeader('Retry-After', String(retry))
      return res
        .status(429)
        .json({ error: `Too many attempts. Please try again in ${retry} seconds.` })
    }
    next()
  }
}

// Housekeeping so the map cannot grow forever.
setInterval(() => {
  const now = Date.now()
  for (const [id, hits] of buckets) {
    const fresh = hits.filter((t) => now - t < 60 * 60 * 1000)
    if (fresh.length) buckets.set(id, fresh)
    else buckets.delete(id)
  }
}, 15 * 60 * 1000).unref()

// ---------- Login bookkeeping ----------

export function recordLogin(user, ip) {
  run(
    `UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    [user.id],
  )
  audit({ user, action: 'login', entity: 'users', entityId: user.id, ip })
}

export function recordFailedLogin(email, ip) {
  audit({ user: { email }, action: 'login_failed', entity: 'users', detail: email, ip })
}
