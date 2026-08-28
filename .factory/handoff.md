# Bookmark Escape Hatch repair handoff

## Independent verification update — PASS

**Verified candidate:** `701b718224cde8622b8be0f18375575702de31a3`
**Verified URL:** <https://bookmark-escape-hatch.sociobot.in>
**Date:** 2026-08-28

An independent clean-checkout QA run passed. All eight exact commands in
`.factory/claims.json`, `npm test` (12 unit/compliance and 17 applicable
Playwright tests), `npm run lint`, and `npm run build` passed. The live
deployment byte-matched 23/23 public production artifacts from the fresh build.

The cold first screen meets the plain-words/demo gate on desktop and 390px:
it states the job, names people with years of bookmarks, and presents one-click
“Try it with sample data.” Live testing confirmed demo isolation, supported
imports/exports, malformed-input recovery, offline demo reload, keyboard and
reduced motion behavior, only same-origin requests, response headers/caching,
and zero serious/critical live Axe findings. Lighthouse mobile: Performance 96,
Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.0 s, CLS 0.

No release-blocking, major, or minor defects remain. Full evidence is in
`.factory/verification-2.md` and `.factory/evidence/verify-2/`.

**Work order:** `bookmark-escape-hatch-repair-1`

**Verifier report:** `f197155fb690a349987f0f8407e92708e9ada1aa`

**Failed candidate:** `d49e3fb9336a77af722b0c191af785f84898a007`

**Date:** 2026-08-28

## Result

All findings in `.factory/verification.md` are repaired with exact regression
coverage. The researched scope, local-first architecture, destination profiles,
visual thesis, and previously passing workflows remain intact. The artifact remains
a static Vite TypeScript offline PWA with `dist/index.html` at its root.

## Finding-by-finding repair

- **RB-1 — claims:** added `.factory/claims.json` with eight listed claims. Each
  claim has exactly one `@claim:<id>` test and a fresh demo-oriented command. All
  eight commands pass independently. A compliance test rejects missing, duplicate,
  or untagged claim entries.
- **RB-2 — first read:** the h1 is “Inspect bookmarks before you move.” The audience
  is named in a 14-word supporting sentence. “Try it with sample data” and its
  one-click explanation are visible without scrolling at 1440×900 and 390×844.
- **RB-3 — isolated demo:** `/demo`, `/?demo=1`, and the landing action open a
  completed four-row inspection. The persistent banner provides “Reset demo” and
  “Start for real.” Demo state uses `demo:bookmark-escape-hatch`; a seeded real
  sentinel remains byte-for-byte unchanged through the demo flow. Demo operation is
  documented in `.factory/demo.md`.
- **M-1 — neutral stability:** the parser recognizes archive schema v1 and restores
  normalized records directly. Two repeated export/import cycles now preserve the
  complete record, including `id`, `source`, and nested `extras`, by deep equality.
- **M-2 — PWA update:** install no longer calls `skipWaiting()` unconditionally.
  Updates wait for consent; “Apply update” messages the waiting worker, disables the
  button, receives `controllerchange`, and reloads the open page. A controlled
  two-version HTTP integration test proves the navigation and toast dismissal.
- **M-3 — response policy:** `staticwebapp.config.json` adds CSP, Permissions Policy,
  MIME mappings, immutable `/assets/*` caching, explicit `/demo` rewriting, and a
  designed 404 with status 404. Azure SWA emulation returned CSP on app routes,
  `image/avif`, `application/manifest+json`, and
  `Cache-Control: public, max-age=31536000, immutable` on assets.
- **m-1 — target size:** the wordmark, footer links, legal mail links, navigation,
  and all controls measure at least 44×44 CSS px in the 390 px browser sweep.
- **m-2 — shell and metadata:** added canonical, Open Graph, Twitter, SVG favicon,
  Apple touch icon, original 1200×630 social art, header navigation, shared legal
  shell, “Built by Param Factory,” build `v1.0.1 · repair-1`, and
  `.factory/copy-audit.md`.

## Verification evidence

Clean release run from this tree:

```text
npm ci                         PASS — 78 packages, 0 vulnerabilities
npm audit --audit-level=high   PASS — 0 vulnerabilities
npm run lint                   PASS — tsc --noEmit
npm test                       PASS — 12/12 unit/compliance;
                                      17/17 applicable Playwright, 1 project skip
npm run build                  PASS — dist/index.html produced
```

Browser coverage uses Playwright 1.58.2 on desktop Chromium and 390×844 mobile. It
exercises one-click demo entry, direct demo URLs, storage isolation, HTML/JSON/CSV,
the exact 50 MiB boundary and one-byte rejection, duplicates, malformed records,
field loss, every download, real restore/clear, same-origin-only privacy, offline
reload, keyboard completion, arrow-key tabs, reduced-motion CSS, update activation,
all routes, console/page errors, overflow, and 44 px targets.

The integrated Axe sweep found zero serious or critical WCAG 2 A/AA/2.1 AA issues
on `/`, `/demo`, `/privacy/`, `/terms/`, and the 404 in both browser projects.

Each command in `.factory/claims.json` was run separately and passed: demo sandbox,
local processing/privacy, offline reload, input audit, all exports, local restore,
neutral round trip, and free use.

Local Lighthouse 12.8.2 mobile-class run against the production build:

```text
Performance 100 · Accessibility 100 · Best Practices 100 · SEO 100
FCP 0.9 s · LCP 1.2 s · TBT 0 ms · CLS 0 · Speed Index 0.9 s
```

Production payload: entry JavaScript 32.82 KB raw / 11.42 KB gzip; CSS 19.80 KB
raw / 5.05 KB gzip; mobile hero AVIF 15.45 KB. There is no web-font payload.
INP is not emitted by a lab Lighthouse run; interaction regressions complete without
timeouts and no INP number is claimed in product copy.

## Deployment and live identity

Commit `b10bc0e6419d7350461fbef7495695e23ca0cbd5` was pushed to `origin/main` and
deployed through `/opt/fleet/lib/deploy-static.sh bookmark-escape-hatch dist`.
Azure Static Web Apps deployment `d319a310-9488-4aeb-a71b-3d66a4b3b5aa` succeeded
and the custom domain returned HTTPS 200.

Live files matched the committed `dist/` byte-for-byte. Selected SHA-256 digests:

```text
index.html                    685c86689f31e3664c6309752554d5c15db45030f424eac85f4a4b5c60cdadea
assets/index-DqRBzcB2.js     ac7b969de8c30ff45f0c9891cd9784a87c9b927ab01fa6ba6690c6e236004506
assets/index-DiSK43a-.css    3b124b57945078010ecc8ff02b56365a22db6d96f1454ac347ab26af595146f2
sw.js                         30d800122e4d453e72492b44344c6d6eac3233f436b2895ebe8dc98e7ab6a7f4
manifest.webmanifest          1589467453e11aa6041981b17eafdcc340e541fe3e8a535740f32d2be8d1f8de
404.html                      2319f43b29e4bb18be7e6991528eca32523f5e50af11952349a151e1dc897291
```

Live checks returned 200 for `/`, `/demo`, `/privacy/`, and `/terms/`; an unknown
route returned the designed page with status 404. Live JS and AVIF returned
one-year immutable caching; AVIF and the manifest returned `image/avif` and
`application/manifest+json`. CSP was present on every checked response.

`/opt/fleet/lib/verify-url.sh` reported an 839 ms load, zero console errors, one h1,
one main landmark, zero missing alt attributes, and zero unlabeled buttons. Its HTML,
JSON, desktop screenshot, and 390 px screenshot are in
`.factory/evidence/repair-1/`.

A separate live mobile run completed `/demo`, found no horizontal overflow or
console errors, and reloaded the populated inspection offline. Live Axe checks on
demo, privacy, and terms found zero serious/critical issues. Live Lighthouse 12.8.2
scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO, with
FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0, and Speed Index 0.9 s.

## Known gaps and applicability

No release-blocking gap is known. Backend health, rate limits, authentication,
billing, package publishing, and clean-consumer installation do not apply to this
static, unauthenticated PWA. Destination formats can change; the product continues
to tell users to retain the original export and test a small import.
