# Next.js 15 + local SQLite: project contract

## Stack & versions
- Use Node 22, npm and the committed lockfile (`npm ci`), because reproducible native SQLite builds matter more than swapping package managers.
- Keep Next.js 15.5.28 App Router, React 19.3.1, TypeScript 5.9.3 strict mode and better-sqlite3 12.11.1, because this is a Node-hosted local-SQLite starter, not an Edge or Turso application. Exact dependency versions live in package.json; review upgrades deliberately.
- Retain the PostCSS 8.5.31 override until the parent dependency resolves the relevant advisories, because the default transitive version had audit findings. Re-run audit and build when changing it.
- Use one persistent Node deployment with a local persistent volume for SQLite, because ephemeral/serverless filesystems and replicas cannot safely share this local database design.

## Folder structure & naming
- Put routes, layouts and route handlers in `app/`, because this project uses App Router only; do not add `pages/`.
- Put reusable views in `components/`, domain validation/services in `lib/`, versioned SQL in `migrations/`, and operational scripts in `scripts/`, because route files should remain thin adapters.
- Use kebab-case module filenames, PascalCase React exports and camelCase TypeScript values, because predictable naming reduces ambiguous imports. Next.js reserved names such as page.tsx remain unchanged.
- Use lower_snake_case SQL tables/columns, plural table names, TEXT UUID identifiers from `crypto.randomUUID()`, and UTC timestamps, because SQLite has no native UUID type and explicit conventions simplify migrations.
- Keep `data/`, `.env*`, `.next/` and dependencies out of Git, because runtime data, secrets and generated files are not source artifacts.

## Commands
- Bootstrap with `npm ci && npm run db:migrate`, because the schema must exist before database-backed features run. Native builds need a supported prebuilt binary or local C++/Python build tools and matching Node headers.
- Use `npm run dev` for development, because the starter binds 0.0.0.0 for container previews; firewall it and do not expose a development server publicly.
- Run `npm test`, `npm run typecheck` and `npm run build` before delivery, because migration tests, static checks and the production build cover different failure classes. Typecheck generates Next route types first.
- Start the production artifact with `npm start` after the build, because the development server is not a deployment runtime.
- Set DATABASE_PATH to an absolute persistent path in deployment; otherwise use `data/app.sqlite`, because cwd-dependent production paths are easy to misconfigure. Do not print secrets from environment files.

## SQL / migration conventions
- Access SQLite only through server-side modules importing `server-only`; route handlers using the database must use Node runtime, because native better-sqlite3 cannot run in the browser or Edge.
- Obtain connections through `getDb()` in `lib/db.ts`, because a development hot reload should not create unlimited connections. It requires an existing database; missing setup must not silently initialize production data.
- Bind every value with prepared-statement parameters; allowlist dynamic identifiers explicitly, because SQL identifiers cannot be safely parameterized as values.
- Enable foreign keys on every connection and keep the busy timeout, because SQLite does not enforce these application expectations by default. WAL is enabled during migration; keep the WAL and database on the same local filesystem.
- Use sequential `NNNN_description.sql` files and forward-only changes; never edit or remove applied files, because the migration ledger validates SHA-256 checksums. The runner rejects duplicate numbers, missing history and out-of-order additions.
- Let the runner own transactions; do not put BEGIN/COMMIT, VACUUM, connection PRAGMAs or other nontransactional operations inside migration files, because each ordinary migration and ledger update must commit atomically.
- Run migrations as a single release step, never in request handlers or concurrently across instances, because schema changes need exclusive operational ownership. Review large table rebuilds and back up first.
- Roll back a failed statement through the transaction; repair an already-applied release with a new migration, because reverting production data is not equivalent to reverting code. Test backup restoration using SQLite's online backup tools rather than copying only the live main file in WAL mode.
- Keep migrations free of credentials and customer data, because schema history is committed publicly; use separate authorized import operations when needed.

## Components, mutations & tenancy
- Default to Server Components and add 'use client' only for browser state/events, because database code and unnecessary JavaScript must stay off the client.
- Validate all untrusted input server-side before database writes and use transactions for related writes, because browser checks and multi-statement partial success are not reliable integrity controls.
- Before any customer-data route or mutation, implement authentication and explicit workspace membership authorization; derive workspace scope from the authenticated principal, because a caller-supplied workspace id is not authorization. Repeat checks in each entry point rather than trusting middleware alone.
- Do not expose the starter's workspace table through a public endpoint yet, because this scaffold intentionally has no authentication, billing or tenant authorization implementation.
- Return minimal user-facing errors and log sanitized operational context server-side, because raw database errors, tokens and personal data do not belong in browser responses or telemetry.
- Add regression tests with temporary databases for each persistence change, because tests must never mutate the development or production database. Extend the existing migration tests rather than substituting mocks for transaction behavior.

## What we do not do — and why
- No Prisma, Drizzle, Tailwind, Docker, Redis or external SaaS dependencies by default, because an unrequested parallel stack obscures this small baseline. Add a dependency only for an explicit requirement and document its purpose.
- No automatic destructive schema synchronization or force-reset commands, because production schema changes must be reviewed and recoverable.
- No storing payment-card data or inventing authentication/billing requirements, because those are security and product decisions outside this starter. Use a suitable provider only after the requirements are supplied.
- No assertion that a successful build proves production readiness, because backups, TLS, authorization, load behavior and deployment review are separate gates.

## Working defaults
Use the choices above without asking which router, database driver, migration tool or naming convention to use; those are already decided. Ask only when a requested feature lacks business/security requirements that cannot safely be inferred, because guessing tenant access or payment behavior creates risk. State exactly what ran and what remains untested; do not imply a Claude Code context test occurred unless it actually did.
