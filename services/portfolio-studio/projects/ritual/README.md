# Ritual — HABIT JOURNAL

A gentle weekly habit tracker for building a little more consistency into your day.

![Ritual screenshot](../../screenshots/ritual.png)

## Try it

From the portfolio-studio root, run `npm run serve` and open `/projects/ritual/`. No build step is needed. This entry page depends on shared `../../assets/`; deploy the entire portfolio directory.

## Implemented scope

- Seven-day check-ins
- Current streaks
- Weekly progress
- Add, edit and remove local entries, with validation.
- Guest browser-local persistence, optional private Supabase cloud snapshots and a confirmed project-only reset.

## Portfolio description

Ritual is an independent, AI-assisted frontend prototype demonstrating seven-day check-ins, current streaks, weekly progress. It uses fictional sample data and either guest browser storage or an authenticated Supabase cloud workspace, not a claim of paid client work.

## Verification and boundaries

Shared domain and browser tests are documented in [VERIFICATION](../../VERIFICATION.md). This is not a production service: Supabase authentication and owner-scoped cloud saving are available, but there is no realtime collaboration, live payment or business notification service. Email confirmation delivery still needs deployment verification. See [cloud architecture](../../backend/README.md). See the [collection README](../../README.md) for domain-specific limits.

Source implementation: [configuration](../../assets/catalog.js), [domain logic](../../assets/model.js), [interface and events](../../assets/app.js).
