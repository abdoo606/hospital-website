import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import multer from 'multer'

import { migrate, getSettings, UPLOAD_DIR } from './db.js'
import { attachUser, csrfGuard, parseCookies } from './auth.js'
import publicRoutes from './routes/public.js'
import authRoutes from './routes/auth.js'
import adminRoutes, { BadInput } from './routes/admin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DIST = path.join(ROOT, 'dist')

const PORT = Number(process.env.PORT || 4000)
const HOST = process.env.HOST || '0.0.0.0'

migrate()

const app = express()
app.disable('x-powered-by')
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1)

// ---------- request logging (kept dependency-free) ----------
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const started = Date.now()
    res.on('finish', () => {
      if (req.originalUrl.startsWith('/api') || res.statusCode >= 400) {
        console.log(
          `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`,
        )
      }
    })
    next()
  })
}

// ---------- parsing & hardening ----------
app.use(express.json({ limit: '256kb' }))
app.use(express.urlencoded({ extended: false, limit: '256kb' }))

app.use((req, res, next) => {
  req.cookies = parseCookies(req.headers.cookie)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  // NOTE: no X-Frame-Options / frame-ancestors on purpose — hospital sites are
  // often embedded in insurer portals and preview panes. Add them if you don't need that.
  next()
})

app.use(attachUser)

// ---------- API ----------
app.use('/api', csrfGuard)
app.use('/api', publicRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API endpoint.' }))

// ---------- uploaded media ----------
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    maxAge: '30d',
    index: false,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  }),
)

// ---------- built front-end (single-port deployment) ----------
let indexCache = { html: '', builtAt: 0 }

/**
 * Injects the hospital's real brand, SEO metadata and MedicalClinic structured data
 * into the built index.html, so search engines and social previews see the client's
 * details instead of the template defaults.
 */
function renderIndexHtml() {
  const file = path.join(DIST, 'index.html')
  if (!fs.existsSync(file)) return null
  if (indexCache.html && Date.now() - indexCache.builtAt < 30_000) return indexCache.html

  let html = fs.readFileSync(file, 'utf8')
  const s = getSettings()
  const name = `${s.brand_name || ''} ${s.brand_suffix || ''}`.trim()
  const escape = (text) =>
    String(text || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])

  if (name && s.seo_title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(s.seo_title)}</title>`)
  }
  if (s.seo_description) {
    html = html.replace(
      /<meta\s+name="description"[^>]*>/,
      `<meta name="description" content="${escape(s.seo_description)}" />`,
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name,
    legalName: s.legal_name || name,
    description: s.seo_description || '',
    telephone: s.phone || '',
    email: s.email || '',
    address: { '@type': 'PostalAddress', streetAddress: s.address || '' },
    openingHours: s.hours || '',
    image: s.hero_image || '',
  }
  html = html.replace(
    '</head>',
    `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`,
  )

  indexCache = { html, builtAt: Date.now() }
  return html
}

if (fs.existsSync(DIST)) {
  app.use(
    express.static(DIST, {
      index: false,
      setHeaders: (res, filePath) => {
        if (/\.(js|css|woff2?|jpg|png|webp|avif)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    }),
  )

  app.get(['/', '/index.html'], (_req, res) => {
    const html = renderIndexHtml()
    if (!html) return res.status(404).send('Run `npm run build` first.')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.send(html)
  })

  app.get(['/admin', '/admin/*'], (_req, res) => {
    res.sendFile(path.join(DIST, 'admin.html'))
  })

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
    const html = renderIndexHtml()
    if (!html) return next()
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  })
} else {
  app.get('/', (_req, res) =>
    res
      .status(200)
      .send(
        'API is running. Build the front-end with `npm run build`, or use `npm run dev` for the dev servers.',
      ),
  )
}

// ---------- errors ----------
app.use((err, _req, res, _next) => {
  if (err instanceof BadInput || err?.name === 'BadInput') {
    return res.status(400).json({ error: err.message })
  }
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'That image is larger than 6 MB. Please compress it first.' })
  }
  if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected upload field.' })
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' })
  }
  if (err?.status === 400 && err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' })
  }
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Something went wrong on our side.' })
})

const server = app.listen(PORT, HOST, () => {
  console.log(`\n  Private Hospital CMS — API ready`)
  console.log(`  → http://localhost:${PORT}/api/health`)
  console.log(`  → admin: ${process.env.ADMIN_URL || `http://localhost:${PORT}/admin`}\n`)
})

const shutdown = (signal) => () => {
  console.log(`\n${signal} received — closing database and server.`)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 3000).unref()
}
process.on('SIGINT', shutdown('SIGINT'))
process.on('SIGTERM', shutdown('SIGTERM'))
