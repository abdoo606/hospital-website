# Verification — 2026-10-19

## Actual runs
- Node 22 domain tests: **43 passed, 0 failed** (`npm test`).
- Headless Chromium browser tests: **10 project routes loaded**, **15 workflows passed**, **0 page exceptions**.
- Viewports: 1440 × 1000 desktop and 390 × 844 mobile. All ten routes plus gallery checked for page-level horizontal overflow; none remained after the mobile header correction. Tables intentionally scroll inside their own containers.
- Screenshots: actual demo pages, captured before browser test mutations, included in `screenshots/`.
- Print rendering: generated an invoice PDF through Chromium's print CSS as a smoke check. User-facing Print / PDF invokes the browser print dialog.

## Browser workflows
Gallery category filter; invoice entry creation and persistence through reload; stock adjustment; task movement; appointment conflict rejection; habit check-in; form required/email validation and successful preview; sales region filtering; CSV download; reset cancellation; CRM contact creation; expense creation; ticket resolution; invoice PDF rendering; reset confirmation.

The portable browser test is `tests/browser-smoke.cjs`. Its source writes screenshots, PDF and machine-readable results to ignored `test-results/`. The local sandbox supplied Chromium's executable path, bundled shared libraries/fonts, and no-sandbox/single-process flags; those are test-environment settings, not application requirements.

## Limits
No actual payments, email, cloud synchronization or authentication were tested or implemented. No Safari/Firefox run, full accessibility audit, load test, penetration test or human user study. Browser smoke coverage is not exhaustive coverage of every control. Financial and analytics data are fictional. This report does not assert acceptance by a client.
