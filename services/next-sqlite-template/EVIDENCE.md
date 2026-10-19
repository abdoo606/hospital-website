# Local verification — 2026-10-19

These are local test runs, not buyer acceptance or an actual Claude Code session.

## sqlite-tests.txt

```text

> next-sqlite-bounty-candidate@0.1.0 test
> node --test scripts/migrate.test.mjs

TAP version 13
# Subtest: initial migration and second run are idempotent
ok 1 - initial migration and second run are idempotent
  ---
  duration_ms: 108.805796
  type: 'test'
  ...
# Subtest: changed applied migration rejected
ok 2 - changed applied migration rejected
  ---
  duration_ms: 104.015186
  type: 'test'
  ...
# Subtest: failed migration rolls back schema and ledger
ok 3 - failed migration rolls back schema and ledger
  ---
  duration_ms: 51.14126
  type: 'test'
  ...
# Subtest: duplicate migration numbers rejected
ok 4 - duplicate migration numbers rejected
  ---
  duration_ms: 51.327638
  type: 'test'
  ...
# Subtest: out of order additions rejected
ok 5 - out of order additions rejected
  ---
  duration_ms: 104.54713
  type: 'test'
  ...
# Subtest: missing applied migration rejected
ok 6 - missing applied migration rejected
  ---
  duration_ms: 105.089401
  type: 'test'
  ...
1..6
# tests 6
# suites 0
# pass 6
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 598.909092
```

## next-build.txt

```text

> next-sqlite-bounty-candidate@0.1.0 build
> next build

   ▲ Next.js 15.5.28

   Creating an optimized production build ...
 ✓ Compiled successfully in 2.1s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/4) ...
   Generating static pages (1/4)
   Generating static pages (2/4)
   Generating static pages (3/4)
 ✓ Generating static pages (4/4)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                      127 B         103 kB
└ ○ /_not-found                            993 B         104 kB
+ First Load JS shared by all             103 kB
  ├ chunks/255-b1e2483a7e02feee.js       46.6 kB
  ├ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  └ other shared chunks (total)          1.88 kB


○  (Static)  prerendered as static content

```

## next-typecheck.txt

```text

> next-sqlite-bounty-candidate@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Route types generated successfully
```
