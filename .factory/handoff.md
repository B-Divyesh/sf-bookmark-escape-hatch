# Bookmark Escape Hatch repair handoff

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

Deployment and post-deploy byte/response checks are the final work-order step. Their
exact commit, live digests, status codes, and verify-url evidence will be appended
after Azure Static Web Apps accepts the committed repair.

## Known gaps and applicability

No release-blocking gap is known. Backend health, rate limits, authentication,
billing, package publishing, and clean-consumer installation do not apply to this
static, unauthenticated PWA. Destination formats can change; the product continues
to tell users to retain the original export and test a small import.
