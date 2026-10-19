# Abdulrhman — Portfolio Studio

Ten interactive frontend portfolio projects, presented through a single cohesive gallery. Built with vanilla JavaScript modules, semantic HTML and responsive CSS. **AI-assisted, independent concept work**, not paid client delivery or complete production SaaS.

## Run locally

Requires Python 3 to serve files; Node 22+ for tests.

```sh
cd services/portfolio-studio
npm run serve
```

Open `http://localhost:3000`. ES modules require HTTP serving; do not open index.html directly as a file. Application runtime has **no third-party dependencies, external fonts, analytics or API calls**. The dev server binds all interfaces for container previews; restrict network access on an untrusted network.

## The collection

| Project | Working interactions | Readme / screenshot |
|---|---|---|
| Ledger | Editable invoice items, percentage tax, fixed discount, print/PDF, CSV | [Scope](projects/ledger) · [Image](screenshots/ledger.png) |
| Stockroom | Unique SKUs, add/edit/remove, stock adjustments, reorder thresholds, history | [Scope](projects/stockroom) · [Image](screenshots/stockroom.png) |
| Momentum | Three-stage board, priority, due dates, move/edit/remove tasks | [Scope](projects/momentum) · [Image](screenshots/momentum.png) |
| Daylight | Daily agenda, add/edit/cancel bookings, overlap & office-hours checks | [Scope](projects/daylight) · [Image](screenshots/daylight.png) |
| Gather | Contacts, five deal stages, value, follow-up dates, search | [Scope](projects/gather) · [Image](screenshots/gather.png) |
| Balance | Income/expenses, monthly filtering, category breakdown, CSV | [Scope](projects/balance) · [Image](screenshots/balance.png) |
| Resolve | Priorities, assignment, status changes, local ticket resolution | [Scope](projects/resolve) · [Image](screenshots/resolve.png) |
| Ritual | Rolling seven-day check-ins, streak through today, weekly progress | [Scope](projects/ritual) · [Image](screenshots/ritual.png) |
| Fieldwork | Field types, required/optional, reorder, validation preview, schema export | [Scope](projects/fieldwork) · [Image](screenshots/fieldwork.png) |
| Northstar | Order CRUD, regional filters, monthly revenue, averages, CSV | [Scope](projects/northstar) · [Image](screenshots/northstar.png) |

## Architecture

Each `projects/<id>/` folder has its own entry page and scope documentation. The projects deliberately **share a design system and application engine**; they are ten domain-focused demos in one monorepo, not ten independent full-stack repositories. Domain configuration and sample data live in `assets/catalog.js`, pure calculations and validation in `assets/model.js`, rendering/events in `assets/app.js`, and styling in `assets/style.css`.

Data is isolated under `studio:v1:<project>` in localStorage. Reset affects only that project and asks for confirmation. Storage failures are reported; invalid saved state falls back to demo data. Displayed user text is HTML-escaped; CSV cells are quoted and spreadsheet formula prefixes neutralized. These measures are not a comprehensive security audit.

## Verification

```sh
npm test
npm ci
npm run format:check
# On a machine with Playwright's system dependencies:
npx playwright-core install chromium
# Start npm run serve in another terminal, then:
npm run test:browser
```

Browser runner options: `BASE_URL`, optional `CHROMIUM_EXECUTABLE_PATH`, optional JSON array `CHROMIUM_ARGS`. Browser artifacts are written into ignored `test-results/`. In the development sandbox Chromium came from @sparticuz/chromium, using its bundled NSS libraries and fonts; no TLS verification was disabled. See [VERIFICATION.md](VERIFICATION.md) for actual run results and limits.

## Deployment

The whole `services/portfolio-studio` directory can be served by any static host. Keep `assets/`, `projects/` and `screenshots/` together. No build step or environment secrets are required. Routes use relative links and work under a repository subpath. The repository root index redirects to this directory for optional branch-root static hosting. GitHub source publication and a live preview do not imply that GitHub Pages has been enabled; see the session's reported deployment status.

## Scope and safety

- Fictional data only; localStorage is not encrypted. Do not enter personal, financial or confidential customer data.
- No login, authorization, server database, multi-user synchronization, payment processing, email or external integrations.
- Invoice taxes are a simplified flat percentage, not jurisdiction-specific tax advice. Print/PDF uses the browser's print dialog; no PDF service runs.
- Daylight represents one shared resource, 09:00–17:00, on local calendar dates; no timezone conversion or calendar sync.
- Analytics are derived from fictional editable orders, not real business results. Form preview discards answers and only counts successful validation attempts.
- No production performance, Safari/Firefox, assistive-technology or comprehensive security audit is claimed.
- Fictitious company names and example.com email addresses are sample data, not endorsements or clients.

MIT license. Screenshots show the actual locally running applications.
