# Deployment & operations

For the developer or IT partner taking this live for a hospital.

---

## 1. What you are deploying

One Node process serves three things on a single port:

| Path | What it is |
| --- | --- |
| `/` | Public marketing website (built React app) |
| `/admin` | Staff panel for content and patient enquiries |
| `/api/*` | JSON API used by both |
| `/uploads/*` | Hospital photography uploaded through the panel |

State lives in SQLite at `server/data/hospital.db`, with uploads in `server/data/uploads/`. Both are
git-ignored — **never commit them**, they contain patient data.

---

## 2. First deployment

```bash
git clone <repo> && cd hospital-website
cp .env.example .env
# set SESSION_SECRET (openssl rand -base64 48), ADMIN_EMAIL and ADMIN_PASSWORD
npm install
npm run db:seed          # creates the schema, the admin account and demo content
npm run build
npm start                # http://localhost:4000
```

Then:

1. Sign in at `/admin` with the seeded credentials and **change the password immediately** (the panel
   forces this).
2. Replace the demo departments, consultants, testimonials and insurers with the hospital's real
   content.
3. Delete the sample enquiries: `npm run db:reset` clears everything, or remove them one by one in the
   inbox. **Never leave fictional patient data in a production database.**
4. Set the brand, contact numbers and SEO fields in Settings.
5. Upload the hospital's own photography and assign the hero, about and facility images.

### Docker

```bash
cp .env.example .env
# Set SESSION_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD in .env before the first run.
docker compose up -d          # website + API on :4000, data in the hospital-data volume
docker compose logs -f
```

Compose intentionally refuses to start if the session secret or first-admin credentials are missing; it has no public demo defaults.

---

## 3. Putting it behind HTTPS

Terminate TLS with nginx, Caddy, Cloudflare or your load balancer — never expose the Node process
directly to the internet with HTTP.

```nginx
server {
    listen 443 ssl http2;
    server_name www.hospital.example;

    ssl_certificate     /etc/letsencrypt/live/hospital.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hospital.example/privkey.pem;

    client_max_body_size 8m;   # allow photo uploads

    location / {
        proxy_pass         http://127.0.0.1:4000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Set `TRUST_PROXY=1` in `.env` so rate limiting and the audit log see the real client IP.

**Cookie settings**

| Situation | `.env` |
| --- | --- |
| Normal hospital domain | `COOKIE_SAMESITE=lax` (default) |
| Embedded in an insurer portal or another site's iframe | `COOKIE_SAMESITE=none` **and** `ALLOWED_ORIGINS=.insurer.example` |
| Preview/demo links on a platform domain | `ALLOWED_ORIGINS=.e2b.app` (or your platform's domain) |

Anything not in `ALLOWED_ORIGINS` is rejected by the CSRF guard, so a third-party site cannot post
form submissions on your behalf.

---

## 4. Backups (non-negotiable)

```bash
npm run db:backup         # writes backups/<timestamp>/hospital.db + uploads/
```

Add it to cron — hourly is normal for a hospital:

```cron
0 * * * * cd /srv/hospital-website && npm run db:backup >> /var/log/hospital-backup.log 2>&1
```

The backup uses SQLite's online backup API, so it is safe while the site is live. **Copy the archive
off the server** (S3, Backblaze, hospital NAS) and test a restore at least once:

```bash
cp backups/2026-10-13T09-00-00/hospital.db server/data/hospital.db && npm start
```

---

## 5. Data protection checklist

Patient enquiries are personal data and may reveal health interests. The hospital will usually be the controller for its patient-intake processing, while the website vendor/host may be a processor depending on the actual roles and contract; confirm this per deployment under GDPR/UK GDPR and local law:

- [ ] Retention: decide the lawful period and process for enquiries. The Settings value is a policy
      note only; no automatic purge exists. Implement and test a scheduled purge plus WAL, backup,
      export and audit-log retention before handling real patient requests.
- [ ] Publish a privacy notice explaining what is collected, why, how long it is kept, and who to
      contact
- [ ] Add a cookie banner if you add analytics (this build sets no tracking cookies)
- [ ] Give every staff member their own account; disable accounts the day someone leaves
- [ ] Review the activity log monthly
- [ ] Encrypt the server disk (LUKS) or the database file, and restrict SSH access
- [ ] Sign a data processing agreement with your hosting provider
- [ ] For rights requests, follow the hospital's approved workflow. The UI's hard-delete removes a row
      from the active database only; decide how WAL files, backups, CSV exports, logs and downstream
      systems are handled before promising a complete erasure.
- [ ] Keep backups encrypted and off-site, and include their expiry/restore behaviour in the retention policy

---

## 6. Health checks & monitoring

- `GET /api/health` → `{"status":"ok","database":"connected"}` — point your uptime monitor here
- The Docker image includes a `HEALTHCHECK` using the same endpoint
- Application logs go to stdout (method, path, status, duration) — collect them with journald,
  Docker logs, or your log platform
- `npm run test:api` runs 44 end-to-end checks against a running instance. Run it after every deploy:

```bash
RATE_LIMIT_DISABLED=1 npm run dev:api &      # test flag: rate limits off
npm run test:api                              # then run the suite
```

---

## 7. Scaling and the PostgreSQL path

SQLite handles a single private hospital comfortably — thousands of enquiries per month, dozens of
concurrent readers. Move to PostgreSQL/MySQL when you need:

- more than one application server (load balanced),
- a managed database with point-in-time recovery,
- the hospital's existing DBA standards.

The schema in `server/schema.sql` is portable: `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL`, `TEXT`
→ `VARCHAR/TEXT`, JSON columns are already plain text. All queries are plain SQL executed through
`server/db.js` — swap `better-sqlite3` for `pg` and adjust the helper functions (`all`, `get`, `run`),
which is a contained change of roughly 60 lines.

---

## 8. Environment variables

See `.env.example` for the full list. The important ones:

| Variable | Purpose |
| --- | --- |
| `PORT`, `HOST` | Where the server listens (default `4000`, `0.0.0.0`) |
| `NODE_ENV` | `production` enables secure cookies and disables test flags |
| `SESSION_SECRET` | Signs session tokens. **Must** be set in production |
| `COOKIE_SAMESITE` | `lax` (own domain) or `none` (iframe installs) |
| `ALLOWED_ORIGINS` | Extra origins allowed to call the API |
| `TRUST_PROXY` | `1` behind nginx/load balancer |
| `DATA_DIR` / `DB_FILE` | Move the database onto a separate volume |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by `npm run db:seed` |

---

## 9. Before you hand over the keys

- [ ] Demo content replaced with the hospital's real departments, consultants and photographs
- [ ] Sample enquiries deleted
- [ ] Admin password changed, one account per staff member created
- [ ] Contact numbers, address and opening hours verified against the hospital switchboard
- [ ] Every clinical claim (ratings, waiting times, success rates) signed off by the medical director
- [ ] Privacy notice and cookie policy published
- [ ] HTTPS, `TRUST_PROXY=1` and a verified backup schedule in place
- [ ] Uptime monitoring pointed at `/api/health`
- [ ] Staff trained on the enquiries inbox (docs/ADMIN-GUIDE.md) — book 30 minutes with reception
