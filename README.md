# Private Hospital Website + Patient Enquiry CMS

A sellable, production-ready product for **private hospitals**: a premium English marketing website,
a **SQLite database**, and a **staff panel** where the hospital enters its real content and works the
patient enquiries the site collects.

Nothing is hard-coded any more. Departments, consultants, FAQs, testimonials, insurers, photography,
contact details and SEO are all edited by the hospital's own staff — no developer, no publishing step.

> Demo brand: *Meridian Private Hospital*. Re-brand it in the panel (Settings) and you have a new
> client site.

---

## 1. Run it

```bash
npm install
npm run db:seed        # schema + demo content + admin account
npm run dev            # API on :4000, Vite dev server on :5173 (proxies /api)
```

Then open:

| URL | What |
| --- | --- |
| http://localhost:5173 | Public website (dev, hot reload) |
| http://localhost:5173/admin.html | Staff panel (dev) |
| http://localhost:4000 | Everything from the API server (production build) |
| http://localhost:4000/admin | Staff panel (production path) |

**Seeded admin account** (change it at first sign-in — the panel forces this):

```
email:    admin@meridianhospital.com
password: Meridian#2026
```

### Production

```bash
npm run build
NODE_ENV=production SESSION_SECRET="$(openssl rand -base64 48)" npm start   # → :4000
```

---

## 2. What the hospital can do without a developer

**Work patient enquiries** — every website request lands in the inbox with a reference number, the
patient's details, the department and consultant they asked for, and their funding route. Staff can
set status (New → Contacted → Booked → Completed / Cancelled / Spam), flag urgent, keep internal
notes, call/email/WhatsApp in one click, search and filter, and export CSV for reporting.

**Edit the whole website** — departments (with highlights, waiting-time promises and icons),
consultants (credentials, languages, availability, photo), FAQs, testimonials and insurers, each with
a Published/Draft switch and drag-free ↑↓ ordering.

**Upload photography** — drag images into the media library and assign them to the hero, "about" and
facilities slots in one click.

**Change the brand, contact details, homepage statistics, hero copy and SEO** in Settings.

**Manage staff** — separate editor and administrator roles, forced own-password on first sign-in,
disable or delete accounts, reset passwords.

**Prove who did what** — an append-only activity log of every sign-in, content change, export and
deletion, with user, time and IP.

---

## 3. Why this is a sellable product, not a demo

| Requirement a hospital will ask about | How this build answers it |
| --- | --- |
| "We must be able to update it ourselves" | Full staff panel, editor and admin roles |
| "Where does the patient data go?" | SQLite database on the hospital's own server, not a third party |
| "Can you prove who accessed it?" | Audit log: logins, edits, exports, deletions |
| "What about a data protection request?" | Permanent erasure per enquiry, recorded in the log, plus CSV export |
| "Is it secure?" | scrypt password hashing, httpOnly signed session cookies, CSRF origin guard, per-IP rate limits, parameterised SQL everywhere, server-side validation on every endpoint |
| "Does it break if the database is down?" | The public site falls back to bundled content instead of going blank |
| "How do you back it up?" | `npm run db:backup` — online backup API, safe while live |
| "Will it pass an audit?" | Retention setting, privacy-first defaults, no third-party tracking |
| "Can we test it?" | 40-check end-to-end API suite (`npm run test:api`) |

---

## 4. Architecture

```
index.html + src/            React 18 public website (Vite)
admin.html + src/admin/      React staff panel (own dense UI, same bundle pipeline)
src/context/SiteData.jsx     loads GET /api/site, falls back to bundled content on failure
server/                      Express 4 API + better-sqlite3
 ├─ schema.sql               portable SQL schema
 ├─ db.js                    connection, helpers, audit(), settings
 ├─ auth.js                  scrypt hashing, signed session cookies, CSRF, rate limits
 ├─ validate.js              server-side validation rules
 ├─ routes/public.js         /api/site, /api/appointments, /api/health
 ├─ routes/auth.js           login/logout/me/password
 ├─ routes/admin.js          content CRUD, enquiries, settings, media, users, audit, CSV
 └─ data/                    hospital.db + uploads/ (git-ignored: real patient data lives here)
scripts/dev.mjs              runs API + Vite together
scripts/smoke-test.mjs       40 end-to-end API checks
scripts/backup.mjs           online database + uploads backup
```

No framework lock-in: plain CSS with design tokens, no state-management library, no ORM. A new
developer can read the whole backend in an afternoon.

### Public API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/site` | One payload with settings, departments, consultants, FAQs, testimonials, insurers, stats |
| POST | `/api/appointments` | The booking form. Validated, rate limited (8/hour/IP), honeypot-protected |
| GET | `/api/health` | Uptime monitoring and the Docker health check |

### Admin API (session required)

`/api/admin/overview` · `/api/admin/appointments` (+ `?status=&q=&from=&to=&limit=&offset=`,
`PATCH /:id`, `DELETE /:id[?hard=1]`, `GET /appointments/export.csv`) ·
`/api/admin/content/{departments|consultants|faqs|testimonials|insurers}` (list, create, patch, delete,
`POST /reorder`) · `/api/admin/settings` · `/api/admin/media` · `/api/admin/users` (admin only) ·
`/api/admin/audit` (admin only)

---

## 5. Security model

- **Passwords** — scrypt (N=16384) with per-user salt, timing-safe comparison, no plaintext anywhere
- **Sessions** — HMAC-SHA256 signed tokens in `httpOnly`, `SameSite`, `Secure` cookies; 12-hour expiry;
  no session data in `localStorage`
- **CSRF** — state-changing requests must come from the site's own host or an explicitly allowed
  origin (`.env` `ALLOWED_ORIGINS`)
- **Rate limiting** — 6 login attempts / 15 min, 8 bookings / hour, per IP (`RATE_LIMIT_DISABLED=1`
  is dev/staging only and ignored when `NODE_ENV=production`)
- **Authorisation** — editor vs administrator enforced on the server, not just hidden in the UI
- **SQL injection** — every query is parameterised; no string-built SQL from user input
- **Uploads** — MIME whitelist (no SVG), 6 MB limit, randomised filenames, served with
  `X-Content-Type-Options: nosniff`
- **Server-side validation** on every endpoint, mirroring the browser rules
- **No account enumeration** — identical error for unknown user and wrong password

---

## 6. Testing

```bash
RATE_LIMIT_DISABLED=1 npm run dev:api &     # start the API with test limits off
npm run test:api                            # 40 end-to-end checks, cleans up after itself
```

The suite creates a temporary admin, exercises login, sessions, every content endpoint, the enquiry
workflow, settings, uploads, staff accounts, the audit log and logout, then deletes everything it
created — safe to run against staging.

---

## 7. Documentation

| Document | Audience |
| --- | --- |
| [`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md) | Hospital staff — enquiries, content, media, staff accounts |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Your IT team — hosting, HTTPS, backups, GDPR checklist, scaling to PostgreSQL |
| [`.env.example`](.env.example) | Every configuration option |

---

## 8. What is deliberately left for the integration phase

Sell these as the next stages — they are also listed in the admin panel's "things that still need a
developer" table:

1. **Email/SMS notification** when an enquiry arrives (currently the inbox is the notification)
2. **Diary/calendar integration** — real slots instead of preferred times
3. **HIS/EMR connection** — push enquiries into the hospital's main system
4. **Payment or deposit collection** for self-funding packages
5. **Patient portal login** for records and imaging
6. **Multi-language / RTL** — Arabic and Russian first for GCC and medical-tourism markets
7. **Content marketing** — condition pages, health hub, `MedicalClinic`/`Physician`/`FAQPage`
   structured data (the server already injects `MedicalClinic` JSON-LD from the panel's settings)

---

## 9. Compliance warnings (read before going live)

- **Clinical claims are regulated.** Ratings, review counts, waiting times and outcome figures in the
  seed data are placeholders. Replace them with audited figures, ideally signed off by the medical
  director. Unverifiable claims breach CQC/ASA rules in the UK and equivalents elsewhere.
- **Patient data is personal data.** The database and its backups contain health-adjacent information.
  Follow the GDPR checklist in `docs/DEPLOYMENT.md`, publish a privacy notice, and train staff.
- **Testimonials need consent.** Get written consent before publishing a patient's words, and anonymise
  unless they agreed to be named.

---

## 10. Licence

Delivered as a client project. Replace the demo brand, imagery and placeholder clinical claims before
publishing, and keep patient data on infrastructure covered by your data processing agreement.
