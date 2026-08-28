# Bookmark Escape Hatch — independent verification handoff

## Result: FAIL

Candidate `d49e3fb9336a77af722b0c191af785f84898a007` was independently tested on
2026-08-28 against <https://bookmark-escape-hatch.sociobot.in>. The deployment is
live and byte-for-byte matches all 20 files from a fresh candidate build, so this is
not a deployment-only failure.

Release is blocked because `.factory/claims.json` is missing and the cold first
screen lacks both an explicit audience and a one-click, isolated “Try it with sample
data” demo. `/demo` and `/?demo=1` are ordinary app views, and the two-click sample
flow writes into the real IndexedDB namespace.

Major implementation findings are also open:

- Neutral archive re-import changes `source` and nests the original `extras`, so the
  advertised provenance/vendor-field round trip is not stable.
- The service worker activates an update before consent; “Apply update” neither
  reloads the app nor dismisses its toast.
- Live responses have no CSP, hashed assets cache for only 30 seconds, AVIF/manifest
  MIME types are generic, and unknown routes return the app with HTTP 200.

Minor findings: several mobile links are under 44 px high; required canonical/social/
Apple metadata, shared site-shell elements, build identity, and
`.factory/copy-audit.md` are absent.

## Verification that passed

- `npm ci`
- `npm test`: 8 unit tests plus 6 applicable Playwright tests passed; 2 intentional
  project skips
- `npm run build`: TypeScript and Vite production build passed; `dist/` exists
- `npm audit --audit-level=high`: 0 vulnerabilities
- Live HTML/JSON/CSV workflows, all four destination exports, malformed-input
  recovery, the exact 50 MiB boundary, saved-state restore/clear
- Same-origin-only network activity during the complete sample flow
- Offline reload and installable manifest
- Keyboard-only completion, 390 px reflow, reduced motion, no console/page errors,
  and 0 axe serious/critical findings on tested routes/states
- Live Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.1 s, TBT 60 ms, CLS 0
- Bundle: 10.50 KB gzip JS, 4.82 KB gzip CSS, 17.73 KB mobile hero AVIF

No lint command exists. Rate limiting, backend concurrency/health, Entra sign-in,
and library/CLI consumer installation do not apply to this static unauthenticated
PWA.

Full commands, exact evidence, severities, and remediation are in
`.factory/verification.md`. Product source was not modified.
