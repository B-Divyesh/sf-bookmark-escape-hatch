# Independent product verification — PASS

**Date:** 2026-08-28
**Candidate:** `701b718224cde8622b8be0f18375575702de31a3`
**Live URL:** <https://bookmark-escape-hatch.sociobot.in>
**Work order:** `bookmark-escape-hatch-verify-2`

## Decision

**PASS.** This candidate meets the researched local-first bookmark-portability
job and the factory acceptance contract. No release-blocking, major, minor, or
known defects were found in this independent run.

The candidate itself is a documentation/evidence commit after the functional
repair commit `b10bc0e`; a fresh production build of its working tree matched
the deployed product byte-for-byte for every 23 deployable artifact (the only
non-public build input, `staticwebapp.config.json`, correctly returns 404 when
requested as an asset).

## Mandatory first checks

### Claim gate — PASS

`.factory/claims.json` exists and contains eight unique IDs with one tagged
test each. From this clean checkout after `npm ci`, every exact command listed
in the manifest passed independently against the production-preview demo entry
point:

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS | One landing click opens `/demo`, a completed inspection, banner, reset/start-real controls, and an isolated demo IndexedDB namespace. |
| `local-processing` | PASS | Full demo plus download makes only same-origin requests; no fetch/XHR/websocket or bookmark-link request. |
| `offline-reload` | PASS | Completed `/demo` reloads after `context.setOffline(true)`. |
| `input-audit` | PASS | HTML, JSON, CSV, exact 50 MiB, over-limit rejection, duplicate, malformed, and field-loss paths asserted. |
| `export-files` | PASS | Neutral, browser HTML, Raindrop CSV, Linkwarden JSON, and dry-run downloads asserted. |
| `local-restore` | PASS | Real inspection restores after reload and remains cleared after explicit clear. |
| `neutral-roundtrip` | PASS | Repeated neutral export/import preserves full normalized record objects, source attribution, and vendor extras. |
| `free-use` | PASS | Full workbench is available without account, payment, or subscription control. |

The complete suite then passed: 12/12 Vitest tests, 17/17 applicable
Playwright tests in Chromium desktop and 390×844 mobile, with one intentional
mobile skip for the controlled service-worker-update test.

### Cold first read — PASS

Fresh, unauthenticated live visits at 1440×900 and 390×844 show all of this
without scrolling:

- **What it does:** “Inspect bookmarks before you move.”
- **Who it is for:** “For people with years of bookmarks…”
- **What to click first:** “Try it with sample data”; adjacent copy says one
  click opens a completed, isolated inspection.

Both viewports exposed the action, had no horizontal overflow, and showed the
three plain facts: stays on device, works offline, free to use.

## Clean build and product exercise

```text
npm ci             PASS — 78 packages installed; npm audit reported 0 vulnerabilities
npm run lint       PASS — tsc --noEmit
npm test           PASS — 12 unit/compliance; 17 Playwright passed, 1 intentional skip
npm run build      PASS — dist/ created
```

Independent live exercise confirmed:

- `/demo` immediately contains a completed realistic inspection, the persistent
  demo-isolation banner, **Reset demo**, and **Start for real**.
- A real representative HTML import reported 1 portable record, 1 exact
  duplicate, and 1 malformed `javascript:` URL. Malformed JSON produced the
  focused, actionable “incomplete or malformed” recovery state with no console
  or page errors.
- The shipped test covers the exact 50 MiB accept / 50 MiB + 1 byte reject
  boundary, all supported source formats, each destination export, a full
  neutral round trip, saved-inspection restoration, and clear/reload behavior.
- A live 390px `/demo` run completed the offline reload after service-worker
  readiness; it also completed keyboard skip-link operation and reduced-motion
  detection (`transition-duration: 0.00001s`).

This is an unauthenticated static PWA with no server-side product or unlock
endpoint, API, payment, sign-in, or package/CLI surface. Rate-limit bursting,
backend concurrency/health, Entra authority, and consumer-package checks do
not apply.

## Privacy, accessibility, PWA, and browser policy

- Live cold and demo flows requested only
  `https://bookmark-escape-hatch.sociobot.in`; no tracker, analytics, remote
  font/script, or bookmark URL request appeared. The local claim test also
  asserts this through the complete demo and download flow.
- Live Axe (`@axe-core/playwright`, WCAG 2 A/AA and 2.1 AA) found **0 serious
  or critical** issues on desktop and 390px mobile. The repository sweep also
  covers `/`, `/demo`, `/privacy/`, `/terms/`, and the 404. Keyboard skip-link,
  tab operation, visible focus, arrow-key tabs, labels, and no overflow passed.
- `/opt/fleet/lib/verify-url.sh` passed on the live landing page: HTTPS 200,
  title, `lang=en`, one h1, main landmark, zero missing image alts, zero
  unlabeled buttons, zero console errors; measured load was 822 ms. Evidence is
  in `.factory/evidence/verify-2/`.
- The service worker registered and a completed demo reloaded while offline.
  The suite’s controlled two-version test also verifies a waiting update applies
  and reloads the open page.
- Live routes `/`, `/demo`, `/privacy/`, and `/terms/` return 200; an unknown
  route returns the designed 404 with HTTP 404. CSP, Referrer-Policy,
  X-Content-Type-Options, Permissions-Policy, and HSTS are present. Hashed JS,
  CSS, and AVIF assets return one-year immutable caching; AVIF and manifest MIME
  types are `image/avif` and `application/manifest+json`.

## Performance and deployment identity

Fresh build payload:

```text
entry JavaScript  32.82 KB raw / 11.35 KB gzip
CSS               19.80 KB raw / 5.04 KB gzip
mobile hero AVIF  15.45 KB
web fonts         0 KB
```

All are within the static/PWA budgets. A fresh Lighthouse 12.8.2 mobile run on
the live URL scored **Performance 96, Accessibility 100, Best Practices 100,
SEO 100**: FCP 0.9 s, LCP 1.0 s, TBT 240 ms, interactive 1.3 s, CLS 0. Lab
Lighthouse does not provide a field INP measurement; no INP number is claimed.

After `npm run build`, SHA-256 comparison of every public `dist/` file against
the live custom domain found 23/23 identical. Representative digests:

```text
index.html                 685c86689f31e3664c6309752554d5c15db45030f424eac85f4a4b5c60cdadea
assets/index-DqRBzcB2.js  ac7b969de8c30ff45f0c9891cd9784a87c9b927ab01fa6ba6690c6e236004506
assets/index-DiSK43a-.css 3b124b57945078010ecc8ff02b56365a22db6d96f1454ac347ab26af595146f2
sw.js                      30d800122e4d453e72492b44344c6d6eac3233f436b2895ebe8dc98e7ab6a7f4
```

## Defects and next steps

**Release-blocking:** none.
**Major:** none.
**Minor:** none.

The previous report at `.factory/verification.md` applies to the pre-repair
candidate `d49e3fb`; its findings were rechecked here and are not present in
this candidate/deployment.
