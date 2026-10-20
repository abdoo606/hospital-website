# Full-Stack milestone — independent review build

A working TypeScript/React interface and Node API for an authentication + resource CRUD milestone. This is a proactive, independently built demonstration, **not a commissioned delivery, not a modification of a customer's private repository, and not a claim of client acceptance**. Tasks are the chosen example resource because no customer-specific entity or private code was supplied.

## Included

- Email/password registration and login; salted scrypt password hashes.
- Opaque, hashed server-side sessions with seven-day expiry, HttpOnly/SameSite cookies and logout revocation.
- Protected API routes and owner-scoped list/detail/create/update/delete operations.
- Initial idempotent PostgreSQL schema with foreign keys, constraints and indexes.
- Write-path validation, parameterized queries, origin checks, auth rate limiting and JSON size limits.
- Responsive React UI with task detail/edit form, loading/empty/error states, and disabled submission controls.
- Ten integration tests exercising real PostgreSQL-compatible PGlite queries rather than mocked database responses.

## Run locally without external services

Requires Node.js 22+.

```sh
cd services/fullstack-milestone
npm ci
npm test
npm run build
npm start
# http://localhost:3001
```

Default development storage is **PGlite**, a local PostgreSQL-compatible WASM engine, persisted under ignored `.data/postgres`. No cloud account, wallet, or payment required. Use synthetic test data and a unique test password, not real credentials.

## Run with a PostgreSQL server

```sh
DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/DATABASE' npm start
```

The `pg` driver uses your connection string; configure TLS according to your database provider. Never commit the connection string. The initial schema applies at startup; subsequent production migrations should be versioned and run by deployment tooling.

For an HTTPS deployment behind a reverse proxy:

```sh
NODE_ENV=production \
DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/DATABASE' \
APP_ORIGIN='https://your-application.example' \
PORT=3001 npm start
```

Production refuses to start without PostgreSQL and an explicit HTTPS origin; session cookies are Secure. Proxy `/api` and the UI through the **same public origin**. Do not expose database credentials to the browser. Development origin checks compare request host to browser origin host to support HTTPS preview proxies; production uses the exact configured origin. This server deliberately does not blindly trust proxy headers for client IPs. Configure trusted proxies and distributed rate limiting for an actual deployment.

For UI development, run the API on 3001 and `npm run dev` in another terminal. Vite proxies `/api` to the API; browser-facing code uses relative paths. An external Vite preview requires an explicitly configured `APP_ORIGIN` matching the public Vite URL.

## API

| Method | Route            | Body                           |
| ------ | ---------------- | ------------------------------ |
| POST   | /api/auth/signup | email, password (12–128 chars) |
| POST   | /api/auth/login  | email, password                |
| POST   | /api/auth/logout | {}                             |
| GET    | /api/me          | —                              |
| GET    | /api/tasks       | — (latest 200 only)            |
| POST   | /api/tasks       | title, description, status     |
| GET    | /api/tasks/:id   | —                              |
| PUT    | /api/tasks/:id   | title, description, status     |
| DELETE | /api/tasks/:id   | —                              |

Statuses: `todo`, `doing`, `done`. Title 1–160 characters; description up to 5000. Foreign-owned IDs return 404 on read/update/delete.

## Verification and limitations

Verified locally on 2026-10-20: **10 integration tests passed**, TypeScript check and Vite production build passed; npm audit reported zero known vulnerabilities at installation. Tests use an embedded PostgreSQL engine. **External PostgreSQL deployment, browser-driven end-to-end testing, load testing and security audit have not been performed.**

Not production-ready by assertion: missing email verification, password recovery, MFA, pagination beyond 200, centralized rate limiting, operational logging/monitoring, scheduled expired-session cleanup, backups and deployment-managed migrations. The test suite is not a substitute for those controls. Registration can reveal that an email is already present via its conflict response. Concurrent signup sessions and repeated login sessions are not globally limited.

Before adapting this to a real request, agree the business entity, acceptance criteria, deployment, pricing and any necessary access with the requester. No customer data or credentials are included.
