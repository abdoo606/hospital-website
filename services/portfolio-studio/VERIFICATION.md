# Verification — 2026-10-19

## Original frontend baseline

- Node 22 domain tests: **43 passed, 0 failed** (`npm test`).
- Headless Chromium browser tests: **10 project routes loaded**, **15 workflows passed**, **0 page exceptions**.
- Viewports: 1440 × 1000 desktop and 390 × 844 mobile. All ten routes plus gallery checked for page-level horizontal overflow; none remained after the mobile header correction. Tables intentionally scroll inside their own containers.
- Screenshots: actual demo pages, captured before browser test mutations, included in `screenshots/`.
- Print rendering: generated an invoice PDF through Chromium's print CSS as a smoke check. User-facing Print / PDF invokes the browser print dialog.

## Browser workflows

Gallery category filter; invoice entry creation and persistence through reload; stock adjustment; task movement; appointment conflict rejection; habit check-in; form required/email validation and successful preview; sales region filtering; CSV download; reset cancellation; CRM contact creation; expense creation; ticket resolution; invoice PDF rendering; reset confirmation.

The portable browser test is `tests/browser-smoke.cjs`. Its source writes screenshots, PDF and machine-readable results to ignored `test-results/`. The local sandbox supplied Chromium's executable path, bundled shared libraries/fonts, and no-sandbox/single-process flags; those are test-environment settings, not application requirements.

## Limits

The original baseline had no cloud features. For the new Auth/cloud increment and its separate verification limits, see the section below. No actual payment or email delivery test was performed. No Safari/Firefox run, full accessibility audit, load test, penetration test or human user study. Browser smoke coverage is not exhaustive coverage of every control. Financial and analytics data are fictional. This report does not assert acceptance by a client.

## Supabase increment — 2026-10-19

- **57 unit tests passed**: previous 43 domain tests plus 14 sync-state tests (account switching, stale responses, dirty edits during saves, conflicts, retries and locking).
- Original ten-route / fifteen-workflow Chromium regression suite still passes.
- **11 additional browser contract flows passed**, with Supabase HTTP intercepted by test fixtures: sign-in, guest/cloud separation, explicit save, no guest cache contamination, session reload, conflict, confirmed reload, offline-load lock, retry, sign-out isolation, signup confirmation messaging. No actual emails are sent by these fixtures.
- **Actual Supabase database tests passed**: owner-scoped reads/writes, stale revision rejection, malformed states/unknown app rejection, anonymous denial, and storing all ten app IDs. Synthetic users and rows were rolled back; a subsequent query returned 0 persisted users and 0 workspaces.
- Actual schema inspection confirmed RLS enabled+forced, anonymous SELECT/RPC denied, authenticated direct INSERT denied, owner-policy SELECT and scoped RPC granted.
- Migration applied to new project `bgacqgzzqjdhubeqzeoq`; existing paused projects unchanged. Database/Auth/REST health reported healthy.
- **Not verified:** real browser-to-Supabase signup/login/email confirmation end-to-end, public SMTP delivery, production deployment durability, full security review. These are distinct from live database-role tests and mocked browser integration.

A follow-up deployed migration rejects SQL-NULL shape checks (including a JSON null version); the null-version regression and all-ten-app transactional test also passed.
