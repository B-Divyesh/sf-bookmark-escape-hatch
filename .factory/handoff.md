# Bookmark Escape Hatch — build handoff

## Shipped

- A complete Vite + TypeScript offline PWA for inspecting HTML, JSON, and CSV
  bookmark exports without uploading or fetching any link.
- Normalization for HTTP(S) URLs, HTML entities, browser/Unix timestamps, tags,
  notes, folders, source attribution, and otherwise unknown vendor fields.
- Exact normalized-URL duplicate detection plus explicit malformed-row reporting.
- Destination capability profiles and complete populated-field loss reports for the
  neutral archive, browser HTML, Raindrop CSV, and Linkwarden JSON.
- Three downloads per completed inspection: destination payload, versioned neutral
  JSON archive, and machine-readable dry-run evidence. The archive has a public JSON
  Schema at `/schema/archive-v1.json`.
- IndexedDB persistence with explicit restore and clear actions. A versioned service
  worker precaches the generated Vite assets and legal/app shell, caches runtime
  assets, provides an offline fallback, and exposes an in-app update prompt.
- Keyboard-accessible tabs, drop/picker/paste input paths, errors, empty and restore
  states, responsive record tables, offline status, PWA install metadata, privacy and
  terms pages.
- A product-specific mid-century instrument-panel system and original generated hero
  illustration. Full tokens, rationale, prompt, review, and provenance are in
  `.factory/design.md`; source and prompt sidecars are in `assets/src/`.

## Run and deploy

```sh
npm ci
npm test
npm run build
```

Deploy `dist/`. The exact factory build command is `npm run build`; it produces
`dist/index.html` at the required root. No environment variables or runtime services
are needed.

## Verification (2026-08-28, local production preview)

- `npm test`: passes 8 unit tests and 6 applicable Playwright tests (2 intentional
  cross-project skips); Chromium desktop and 390 × 844 mobile projects.
- End-to-end: intake → inspect → browse findings → download report; IndexedDB restore;
  keyboard arrow tabs; mobile horizontal-overflow check; browser forced offline then
  successful app reload.
- Axe WCAG 2 A/AA/2.1 AA: **0 serious or critical violations** on the completed report.
- Factory `verify-url.sh`: HTTP 200, title, `lang=en`, exactly one h1, main landmark,
  image alt, labelled buttons, and **0 console/page errors**.
- Lighthouse 12.8.2 mobile: **Performance 100**, **Accessibility 100**, **Best
  Practices 100**, **SEO 100** after adding `robots.txt` (final SEO rerun noted below).
  Lab metrics: LCP 1.5 s, FCP 0.9 s, TBT 0 ms, CLS 0.
- Production payload: entry JS 29.5 KB (10.5 KB gzip), CSS 18.3 KB (4.8 KB gzip),
  largest hero derivative 84 KB; no font payload.
- `npm audit`: 0 vulnerabilities.

## Known gaps / next steps

- Destination profiles implement documented file shapes but do not call vendor APIs;
  formats can change, so the UI correctly tells users to keep the original and test a
  small import.
- Safari plist and proprietary service-specific ZIP bundles are not v1 inputs. Export
  HTML/JSON/CSV from those services first.
- Files are intentionally processed in memory and capped at 50 MB. A later release
  could stream very large CSV files through OPFS.
- This product does not archive page content or verify that remote URLs still resolve;
  that is deliberate to preserve privacy and avoid protected-content downloads.
