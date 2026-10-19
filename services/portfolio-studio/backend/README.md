# Supabase cloud persistence

## Actual deployment

A new, dedicated Supabase project named **portfolio-studio**, ref `bgacqgzzqjdhubeqzeoq`, was created with the **free** plan request. The three pre-existing paused projects were not restored, modified or reused. Database, Auth and REST reported healthy after creation.

Applied migrations: `migrations/20261019_reject_null_versions.sql` (`reject_null_workspace_versions`, rejects SQL-NULL shape checks), following `migrations/20261019_portfolio_cloud.sql` (`portfolio_cloud_workspaces`).

This is **one PostgreSQL database with a shared JSONB snapshot table**, keyed by authenticated owner and one of ten application identifiers. It is not ten separate database servers or ten normalized production business schemas.

## Data and authorization model

- `portfolio_app_states`: `(owner_id, app_id)` primary key; owner references `auth.users`; deletion of an Auth user cascades their stored snapshots.
- Basic server-side validation: recognized app identifiers, versioned object containing rows/extras, at most 5,000 rows, at most 1 MiB serialized state. Domain-level constraints such as scheduling rules and invoice totals remain in the client; the server does **not** yet independently enforce those rules within JSON snapshots.
- RLS enabled and forced. Authenticated SELECT policy permits only `owner_id = auth.uid()`.
- No table access for anonymous visitors; no direct INSERT/UPDATE/DELETE for authenticated browser roles.
- `portfolio_save_state` is the only granted write RPC. It uses a fixed empty search path, fully qualified identifiers and `auth.uid()` (no caller-supplied owner). It is SECURITY DEFINER to support the narrow operation while direct table mutation is revoked.
- Revision-based compare-and-swap rejects stale writes with SQLSTATE `40001`. Reload is explicit and asks before discarding dirty edits.
- The browser only contains a **publishable** key. Database credentials and service-role/secret keys are not included.

## User workflow

1. Open any project and choose **Sign in / Create account**.
2. Create an account and confirm the email, or sign in with an existing confirmed account.
3. A separate, initially empty private cloud workspace opens. Guest/demo rows are never imported automatically.
4. Make changes and click **Save to cloud**. A loaded revision is shown after a confirmed save. Edits are **not automatically synchronized**.
5. On another device, sign in to load the saved state. Use **Reload cloud** to retrieve changes made elsewhere. There is no realtime subscription.
6. Sign out to return to the separate browser-local demo. Authenticated workspace data is held in memory, not copied into the guest localStorage namespace.

Auth session tokens use the official Supabase SDK's persisted-session mechanism in browser storage. That storage is not encrypted; use a trusted device and fictional portfolio data. Sign-out clears the current UI and switches back to guest data. Unsaved cloud edits only exist in page memory and can be lost if the browser closes, the session ends or the process crashes; a before-unload warning is best-effort, not a backup. Export before discarding conflicts.

## Auth and deployment configuration

Email confirmation remains **enabled**. Anonymous accounts are not enabled. Client-side signup asks for 12 characters; this is a UI rule, not a claim that the server's password policy was changed.

Configured redirect URLs on deployment:

- `https://3000-ixcjj59z57ym2caenx7mb.e2b.app/**` (temporary Arena preview)
- `https://abdoo606.github.io/hospital-website/**` (prepared for a future Pages site)
- `http://localhost:3000/**` (local development)

The Site URL currently points to the temporary preview. Update the Site URL and exact redirect allowlist when the host changes. The frontend runs independently of Supabase on static hosting; creating the database did not enable GitHub Pages.

**Email/SMTP is an outstanding deployment gate.** No SMTP credentials were configured, no real email was sent in these tests, and no real signup/login end-to-end success is claimed. Supabase's default mail service has delivery/recipient/rate restrictions; configure an approved SMTP service before public onboarding. Do not disable email verification merely to avoid delivery failures. The UI surfaces Auth errors and confirmation instructions.

Password recovery, account deletion UI, MFA onboarding, consent/legal policy pages, production abuse controls/CAPTCHA, backups/restoration testing and operational monitoring remain outside this increment. Free-tier quotas and future billing are controlled in the owner's Supabase dashboard; no paid upgrade was requested.

## Building and testing

The official SDK is bundled into `assets/cloud-client.js`, which is committed for static serving. Source and the intentional public connection configuration are in `assets/cloud-source.js` and `assets/cloud-config.js`.

```sh
npm ci
npm run build:cloud
npm test
npm run test:cloud-browser
```

The browser runner needs a local static server and a supported Chromium installation, as described in the collection README. It intercepts Supabase HTTP requests with fixtures, so it is a **contract/integration test**, not live Auth proof.

SQL tests were executed against the real dedicated Supabase database under isolated transactions. They create synthetic `example.invalid` identities, switch database roles and JWT claim settings, assert access rules and revision behavior, and roll everything back. These tests validate database authorization, not JWT cryptography or email delivery. Use the scripts only on a test database with administrative SQL privileges; they deliberately assume the tested identities have no existing records.

See `../VERIFICATION.md` for results. Production hardening is still required before storing sensitive customer information or relying on these prototypes for financial operations.
