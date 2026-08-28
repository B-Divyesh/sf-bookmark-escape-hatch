# Independent product verification — FAIL

**Date:** 2026-08-28  
**Candidate:** `d49e3fb9336a77af722b0c191af785f84898a007`  
**Live URL:** <https://bookmark-escape-hatch.sociobot.in>  
**Work order:** `bookmark-escape-hatch-verify-1`

## Decision

**FAIL. Do not release this candidate.** The mandatory claims gate and the
mandatory first-read/demo gate both fail. Independent functional testing also found
that the neutral archive is not schema-stable across a round trip and that the PWA's
update action does not apply the update to the open page.

The deployed product is the candidate: a fresh `npm run build` produced 20 files,
and every deployed counterpart returned HTTP 200 with the same byte length and
SHA-256 digest. This is not a stale or failed deployment.

## Release-blocking findings

### RB-1 — Required claims manifest is absent

`.factory/claims.json` does not exist. This was the first check run from the clean
clone and exited 2 with `__MISSING_CLAIMS_JSON__`. Therefore there were no claim
commands to run through the required demo entry point. The claims contract makes a
missing manifest an automatic failure.

The landing page and README nevertheless make unlisted claims, including:

- “Stays on device,” “Works offline,” and “Open exports.”
- HTML, JSON, and CSV input support with a 50 MB maximum.
- No upload or bookmark-URL requests.
- Duplicate/malformed detection and complete field-loss reporting.
- Neutral, browser, Raindrop, Linkwarden, and dry-run downloads.
- IndexedDB restoration, no analytics/trackers, and offline capability.

None has the required one-to-one `@claim:<id>` test registration.

### RB-2 — Cold first screen does not meet the first-read contract

Cold read:

- **What it does:** the supporting sentence says it loads an export, normalizes
  links, detects damage/duplicates, and checks what another tool can carry.
- **Who it is for:** not stated. A visitor must infer migration intent from “before
  you move”; people with years of bookmarks are never named.
- **What to click first:** no primary action appears in the initial 1440×900 or
  390×844 viewport. The user must scroll into the workbench and choose among file,
  paste, sample, destination, and inspection controls.

The headline “Know what survives before you move” is not the job in direct words,
and the required adjacent primary action is absent.

### RB-3 — No one-click, isolated sample-data demo

- There is no “Try it with sample data” action on the first screen.
- Clicking “Load a 3-record sample” does not show the product in use. It only enables
  “Run inspection,” so useful output needs a second click.
- `/demo` and `/?demo=1` return the normal app with no seeded result, demo banner,
  “Reset demo,” or “Start for real.”
- Running the sample inspection writes `latest` into the production IndexedDB
  namespace. Reload then shows “Previous reading found.” Demo data is therefore not
  isolated from real data.
- `.factory/demo.md` is absent.

## Major defects

### M-1 — Neutral archive changes provenance and vendor metadata on re-import

An end-to-end JSON → neutral archive → re-import → neutral archive check preserved
the record count but changed the record shape:

- Before: `source` identified `representative.json`; `extras` was
  `{ "vendorFlag": true }`.
- After: `source` identified the downloaded temporary archive as a new JSON source;
  the original `source` and whole original `extras` object were nested under the new
  `extras`.

Repeated round trips continue nesting these objects. This contradicts the researched
requirement to preserve source attribution, the UI statement that the neutral archive
preserves every source detail, and the 99% neutral round-trip success measure. The
existing unit test checks record count/URL and the pre-import archive, so it does not
detect this structural loss.

### M-2 — “Apply update” does not update the open PWA

A controlled local server served the candidate service worker, then a second version.
The update toast appeared, but the worker had already entered `activating` because
`skipWaiting()` runs during every install. Clicking “Apply update” caused no
navigation/reload (`1` navigation before and after), the worker was already active,
and the toast remained visible. The page continues running the old application code
until a manual reload.

### M-3 — Required browser response/site policies are incomplete

- Live responses include HSTS, `Referrer-Policy`, and
  `X-Content-Type-Options`, but no Content Security Policy.
- `staticwebapp.config.json` is absent.
- A nonexistent route such as `/404-does-not-exist` returns HTTP 200 and the main
  app; there is no designed 404 route.
- Hashed JS/CSS and image assets are served with
  `Cache-Control: public, must-revalidate, max-age=30`, not long-lived immutable
  caching.
- AVIF and `manifest.webmanifest` responses use `application/octet-stream`.

## Minor defects

### m-1 — Some mobile targets are shorter than 44 CSS pixels

At 390 px, the wordmark link measured 42 px high and footer Privacy, Terms, and
Source links measured about 26.3 px high. The main controls meet the target size; the
visually hidden file input is covered by its large labelled drop zone and is not
counted as a failure.

### m-2 — Required metadata and site-shell details are missing

The landing page has no canonical link, Open Graph metadata, Twitter card metadata,
or Apple touch icon link. Its header has no navigation. The footer omits “Built by
Param Factory” and a version/build identifier. Legal pages do not use the same site
header/footer skeleton. `.factory/copy-audit.md` is absent.

## Passing evidence

### Clean install, tests, types, and build

- `npm ci`: pass; 78 packages installed; 0 vulnerabilities.
- `npm test`: pass; 8/8 Vitest tests and 6/6 applicable Playwright tests passed;
  2 intentional cross-project skips.
- Type check: pass through `tsc --noEmit` in `npm run build`.
- No lint script exists in `package.json`.
- Exact production build: pass; `dist/index.html` created.
- `npm audit --audit-level=high`: pass; 0 vulnerabilities.

Build payload:

- Entry JS: 29.45 KB raw / 10.50 KB gzip (budget ≤200 KB).
- CSS: 18.29 KB raw / 4.82 KB gzip (budget ≤50 KB).
- Selected mobile hero AVIF: 17.73 KB (budget ≤300 KB).
- No web-font payload.

### Real workflow and edge cases

- Sample HTML inspection: 2 portable, 1 duplicate, 1 malformed; browser dry-run
  report contained all three outcomes and the source-attribution field loss.
- Representative nested JSON and quoted multiline CSV each produced one portable
  record with the expected title.
- Destination downloads all worked: neutral JSON (2 records), browser Netscape HTML
  (2 anchors), Raindrop CSV (header + 2 rows), and Linkwarden JSON (2 records with
  tag objects).
- Malformed JSON displayed an actionable focused error. Loading the sample afterward
  recovered and completed.
- A file of exactly 50 MiB was accepted; 50 MiB + 1 byte was rejected before parsing
  with the advertised recovery instruction.
- A saved inspection survived reload and restored; “Clear saved inspection” removed
  it and the restore prompt did not return.

### Privacy, accessibility, responsive behavior, and PWA basics

- The complete sample workflow made only same-origin requests; no request targeted a
  bookmark URL, analytics host, CDN, font host, or tracker.
- No console or uncaught page errors appeared during the tested live flows.
- Axe WCAG 2 A/AA/2.1 AA found 0 serious/critical violations on live desktop,
  390×844 mobile, Privacy, and Terms; the repository test also scanned the completed
  report state.
- The 390 px page had no horizontal overflow.
- Keyboard-only Tab/Enter completed the sample inspection. The skip link worked and
  tested focus states used a visible 3 px outline. Arrow-key report tabs pass the
  repository test.
- Reduced-motion emulation matched and reduced transitions/animations to 0.01 ms.
- The manifest parsed with no Chromium installability errors. The worker registered,
  precached the shell and hashed assets, and a forced offline reload rendered the app
  with “Offline mode” and no errors.

### Live performance

Lighthouse 12.8.2 mobile against the live URL:

- Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- FCP 0.9 s, LCP 1.1 s, TBT 60 ms, CLS 0.
- INP was not measured in the lab run; the budget cannot be claimed from this run.

### Deployment identity

All 20 files in the fresh `dist/` had byte-identical live counterparts. Examples:

- `index.html`: SHA-256
  `2c8c17a1fd885eee3c91d45fe8b0e4a8c0ad5983d485a275ee3a5244381e40a2`.
- `assets/index-BodH4PaU.js`: SHA-256
  `49f69f756b4f1dfe8c20689bb6f4681a5a77923a75a0dc669cc69ba48385c80c`.
- `assets/index-D48UI_v5.css`: SHA-256
  `d09b2aaab163995032ad78ea59ca8163b1b15eead7426317fcb34d754f499b0d`.
- `sw.js`: SHA-256
  `f3ff1269cf75841d0503ae4f5c21b0cc27604be3d5f9f4b95f83c45532429b9e`.

## Applicability notes

This is a static, local-first PWA. It has no server-side product or unlock endpoint,
no backend persistence, no authentication, and no CLI/library package. API rate
limiting, backend concurrency/health, Entra authority, and clean-consumer package
installation are therefore not applicable.

## Required next steps

1. Add `.factory/claims.json`; add exactly one tagged, demo-based observable test for
   every live/README claim and run every listed command.
2. Implement a first-screen “Try it with sample data” action that reaches a populated
   result in one click, plus `/demo`, the required banner/actions, a separate demo
   storage namespace, and `.factory/demo.md`.
3. Make neutral archives recognize their own schema and preserve `source` and
   `extras` without structural nesting; add a deep round-trip regression test.
4. Make service-worker updates wait for or correctly apply user consent, reload the
   open app, and dismiss the toast; add an update integration test.
5. Add the required CSP, immutable hashed-asset caching, correct MIME mappings, 404,
   metadata/site-shell elements, touch sizing, and copy audit.
