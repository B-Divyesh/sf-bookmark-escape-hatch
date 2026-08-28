# Bookmark Escape Hatch

Bookmark Escape Hatch is a private, offline-capable migration workbench for people
with years of browser or bookmark-service data. It reads an export, normalizes the
records, separates exact duplicates and malformed links, and reports every populated
field the chosen destination cannot represent before producing import-ready files.

Live product: <https://bookmark-escape-hatch.sociobot.in>

## What it supports

- Netscape Bookmark HTML from major browsers, including folders, tags, notes, and
  saved dates.
- JSON arrays and common nested `bookmarks`, `links`, `items`, `children`, `data`,
  `results`, and `records` shapes. Unknown vendor fields are preserved in `extras`.
- Quoted CSV with URL/link, title/name, tags, notes, folder/collection, and date
  header aliases.
- Destination dry runs for neutral JSON, browser HTML, Raindrop CSV, and Linkwarden
  JSON.
- Downloads for the destination payload, the versioned neutral archive, and a
  machine-readable dry-run report.

Exact URL duplicates are listed and excluded from generated payloads. Malformed or
non-HTTP(S) records are held back with a reason. The original file is never changed.

## Privacy and local storage

Parsing and export generation happen entirely in the browser. The app does not fetch
bookmark URLs and has no analytics, trackers, remote scripts, or third-party fonts.
The latest completed inspection is stored in IndexedDB for explicit restore after a
refresh; “Clear saved inspection” removes it. See the in-product [privacy
policy](https://bookmark-escape-hatch.sociobot.in/privacy/).

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Vite prints the local development URL. To test the production output:

```sh
npm run build
npm run preview
```

The exact deploy command is `npm run build`. It writes the static application to
`dist/`, with `dist/index.html` at the root.

## Test and verify

```sh
npm test              # unit + Chromium desktop/mobile/offline/axe tests
npm run test:unit     # parser, audit, and round-trip coverage
npm run test:e2e      # Playwright flows and accessibility scan
npm run assets        # regenerate optimized AVIF/WebP and PWA icon derivatives
```

Playwright is pinned to 1.58.2. The end-to-end suite starts a production preview,
checks the complete migration path, exercises the 390 px layout and keyboard tabs,
and reloads the app with its browser context offline.

## Project map

- `src/parser.ts` — format detection, parsing, normalization, deduplication
- `src/audit.ts` — destination capability profiles and field-loss accounting
- `src/exporters.ts` — neutral archive, browser, Raindrop, Linkwarden, and report files
- `src/storage.ts` — minimal IndexedDB persistence
- `public/sw.js` — versioned app-shell and runtime asset cache
- `.factory/design.md` — visual thesis, tokens, interaction grammar, asset provenance
- `public/schema/archive-v1.json` — the neutral archive JSON Schema

## Scope and safety

This is an inspection and conversion tool, not a bookmark manager or content
archiver. It deliberately does not download linked pages or protected article
content. Destination services may change their formats; keep the original export and
test a small import before deleting source data.

MIT licensed. See [LICENSE](./LICENSE).
