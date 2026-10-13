import express from 'express'
import { get, run, getSettings } from '../db.js'
import {
  hashPassword,
  verifyPassword,
  passwordProblems,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  recordLogin,
  recordFailedLogin,
  rateLimit,
  requireAuth,
} from '../auth.js'

const router = express.Router()

router.post(
  '/login',
  rateLimit({ key: 'login', limit: 6, windowMs: 15 * 60 * 1000 }),
  (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' })

    const user = get(
      'SELECT id, name, email, role, password_hash, must_change_password, disabled FROM users WHERE lower(email) = ?',
      [email],
    )

    // Same message for unknown user and wrong password — no account enumeration.
    if (!user || user.disabled || !verifyPassword(password, user.password_hash)) {
      recordFailedLogin(email, req.ip || '')
      return res.status(401).json({ error: 'Those credentials do not match our records.' })
    }

    setSessionCookie(res, createSessionToken(user))
    recordLogin(user, req.ip || '')

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        must_change_password: Boolean(user.must_change_password),
      },
    })
  },
)

router.post('/logout', (req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in.' })
  res.json({
    user: { ...req.user, must_change_password: Boolean(req.user.must_change_password) },
    settings: {
      brand_name: getSettings().brand_name || '',
      brand_suffix: getSettings().brand_suffix || '',
    },
  })
})

/** Change your own password (also required on first login). */
router.post('/password', requireAuth, (req, res) => {
  const current = String(req.body?.current || '')
  const next = String(req.body?.next || '')

  const record = get('SELECT password_hash FROM users WHERE id = ?', [req.user.id])
  if (!record || !verifyPassword(current, record.password_hash)) {
    return res.status(401).json({ error: 'Your current password is incorrect.' })
  }

  const problems = passwordProblems(next)
  if (problems.length) {
    return res.status(400).json({ error: `New password needs ${problems.join(', ')}.` })
  }
  if (verifyPassword(next, record.password_hash)) {
    return res.status(400).json({ error: 'Please choose a password you have not used before.' })
  }

  run(
    `UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = datetime('now')
      WHERE id = ?`,
    [hashPassword(next), req.user.id],
  )
  res.json({ ok: true })
})

export default router
