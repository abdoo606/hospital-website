# Meridian Private Hospital — Website

A premium, production-ready marketing website for **private hospitals and private healthcare
groups**. English, conversion-focused, and built to be re-branded for a new client in under an hour.

> Demo brand: *Meridian Private Hospital* — edit one file (`src/data/site.js`) to turn it into your
> client's hospital.

---

## Why this converts

Private patients shop on three things: **speed, trust, and price clarity**. Every section is built
around them.

| Section | Job it does |
| --- | --- |
| Utility bar + sticky header | Emergency number and *Book* CTA always one tap away |
| Hero | Consultant-led positioning, accreditation chips, 48-hour access promise, social proof |
| Animated stats strip | Credibility numbers (specialties, consultants, satisfaction) |
| Departments *(searchable)* | 12 centres of excellence with wait-time badges and "Enquire" buttons |
| Consultants *(filterable)* | Choose your consultant by name, specialty, language and rating |
| Why Meridian | Long-form differentiation: consultation length, same-day diagnostics, fixed pricing |
| How it works | Three-step pathway that removes uncertainty before booking |
| Testimonials | Rotating patient quotes across services and countries |
| Patients & insurance | Insurer logos, international patient office, written-quotation promise, outcomes metrics |
| Booking form | Validated multi-field enquiry with reference number, **pre-filled by any Enquire/Book click** |
| FAQ | The six objections that block bookings, answered plainly |
| Closing CTA + footer | Hard CTA, emergency line, department and patient navigation |

The **"Enquire"** (departments) and **"Book"** (consultants) buttons scroll to the booking form and
pre-select the department and consultant — a small detail that measurably lifts enquiry completion.

---

## Tech stack

- **React 18** — component-driven, no jQuery-style DOM juggling
- **Vite 5** — instant dev server, ~1 s production builds
- **Plain CSS** with design tokens (no Tailwind/Bootstrap lock-in; easy for any client's in-house team to maintain)
- **Zero runtime dependencies beyond React** — nothing to licence, patch or pay for
- No backend required to demo; the booking form works standalone

Bundle size: ~60 kB gzipped JS, ~7 kB gzipped CSS, images lazy-optimised per asset.

---

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

Node 18+ required.

---

## Project structure

```
src/
├─ main.jsx                  # entry point
├─ App.jsx                   # section order + shared state (booking pre-selection)
├─ data/site.js              # ← ALL CONTENT: brand, stats, departments, doctors, FAQs…
├─ hooks/useScrollFx.js      # scroll-spy, reveal-on-scroll, count-up animations
├─ styles/global.css         # design system: tokens → components → responsive
├─ assets/                   # hero, consultation and facility imagery
└─ components/
   ├─ Header.jsx  Hero.jsx  Departments.jsx  Doctors.jsx
   ├─ WhyUs.jsx   Patients.jsx  Testimonials.jsx  Booking.jsx
   └─ Faq.jsx     CtaBand.jsx   Footer.jsx       Icon.jsx
```

---

## Re-branding for a new hospital (≈30 minutes)

1. **Content** — open `src/data/site.js` and replace the `hospital` object (name, phone, emergency
   line, email, address, opening hours).
2. **Departments & consultants** — same file. Each department has `name`, `tagline`, `blurb`,
   `highlights[]` and a `wait` promise; each consultant has title, credentials, years of experience,
   rating, review count, languages and `availability`. Add or remove entries freely — the grids and
   filters adapt automatically. Icons are chosen by name from `src/components/Icon.jsx`.
3. **Testimonials, insurers, FAQs** — same file. Swap the placeholder insurers for the ones your
   client is actually recognised by.
4. **Colours & typography** — `src/styles/global.css`, the `:root` block at the top. Change
   `--teal`, `--ink`, `--gold` and the two font variables; the whole site follows.
5. **Imagery** — replace `src/assets/hero-hospital.jpg`, `consultation.jpg` and `facility.jpg`
   (keep the file names and you don't have to touch code). Use the hospital's own photography for
   the best results — real buildings and real clinicians outperform stock every time.
6. **SEO** — update `<title>` and `<meta name="description">` in `index.html`, and swap
   `public/favicon.svg` for the client's mark.

---

## Deployment

Any static host works — the build output is plain HTML/CSS/JS.

```bash
npm run build
# then upload dist/ to Netlify, Vercel, Cloudflare Pages, S3+CloudFront or the client's own server
```

If the site will live in a sub-folder (e.g. `hospital.com/new-site/`), set `base: '/new-site/'` in
`vite.config.js` before building.

---

## What is demo-only (and what to say to the client)

- **The booking form does not send anywhere yet.** It validates input, shows a confirmation with a
  unique reference (e.g. `MER-482913`) and stores the request in the browser's `localStorage` so the
  flow can be demonstrated. To go live, POST the `record` object from `Booking.jsx` to an endpoint —
  a form service, the hospital's CRM/HIS, or a small serverless function — and send an
  acknowledgement email. This is the one integration item to quote for.
- Consultant ratings, review counts and outcome metrics are illustrative placeholders. Replace them
  with the hospital's audited figures before launch — healthcare advertising is regulated in most
  markets (CQC/ASA in the UK, and equivalent bodies elsewhere), and unverifiable claims are a
  compliance risk.
- No cookie banner or analytics are included; add these to match local privacy law (GDPR/PECR in
  the EU/UK).

---

## Accessibility & performance notes

- Semantic landmarks, skip link, visible focus rings, `aria-*` on menus, filters and the slider
- Form fields are properly labelled and announce their errors
- Respects `prefers-reduced-motion` (animations and count-ups are disabled, not just sped up)
- Sticky header height is accounted for in `scroll-padding-top`, so anchor links never land under it
- Fully responsive: 4-up grids on desktop, 2-up on tablet, single column with a slide-in menu on phones

---

## Typical upgrade path (upsells)

1. **Live booking integration** — CRM/HIS endpoint, email + SMS confirmations, calendar slots
2. **CMS** — Sanity/Contentful/Strapi so the marketing team edits `site.js` content without a developer
3. **Consultant directory pages** — individual profile pages with bios, procedures and video
4. **Multi-language / RTL** — Arabic and Russian are the highest-value additions for GCC and medical-tourism audiences
5. **Content marketing** — health-hub articles, condition pages, structured data (`MedicalClinic`, `Physician`, `FAQPage`) for search visibility
6. **Analytics & CRO** — event tracking on every *Book* click, plus A/B tests on the hero promise

---

## Licence

Delivered as a client project template. Replace the demo brand, imagery and placeholder clinical
claims before publishing.
