# Bookmark Escape Hatch

Inspect bookmark exports and find migration damage before changing tools.

Bookmark Escape Hatch is for people with years of browser or service bookmarks.
It reads HTML, JSON, and CSV exports through 50 MB. It reports exact duplicates,
malformed links, and populated fields that a selected destination cannot carry.

Try the isolated sample at <https://bookmark-escape-hatch.sociobot.in/demo>.
One click opens a completed inspection. Demo records use a separate IndexedDB
database and never replace a real saved inspection.

## Output and privacy

The workbench downloads neutral JSON, browser HTML, Raindrop CSV, Linkwarden JSON,
and a machine-readable dry-run report. Neutral archive re-import preserves each
normalized record, its source attribution, and vendor details across round trips.

Bookmark contents stay on the device. The app never requests a bookmark URL and
has no analytics, trackers, remote scripts, or third-party fonts. A real completed
inspection can be restored after refresh and explicitly cleared. The completed demo
also reloads offline after its first visit.

The complete workbench is free to use without an account or payment. Read the
[privacy policy](https://bookmark-escape-hatch.sociobot.in/privacy/) and
[terms](https://bookmark-escape-hatch.sociobot.in/terms/).

## Run and verify

Node.js 20 or newer is required.

```sh
npm ci
npm run dev
```

Run all unit, integration, desktop, mobile, offline, and accessibility checks:

```sh
npm test
npm run lint
npm run build
```

`npm run build` creates the deployable static site in `dist/`. Playwright is pinned
to 1.58.2. Each product claim and its exact command are listed in
[.factory/claims.json](.factory/claims.json). Demo setup and isolation are recorded
in [.factory/demo.md](.factory/demo.md).

## Project map

- `src/parser.ts` parses, normalizes, and deduplicates exports.
- `src/audit.ts` checks destination field support.
- `src/exporters.ts` creates the five downloadable formats.
- `src/storage.ts` separates real and demo IndexedDB data.
- `public/sw.js` controls the offline shell and consent-based updates.
- `public/staticwebapp.config.json` defines routes, security headers, caching, MIME types, and 404 behavior.
- `.factory/design.md` records the visual system and original asset provenance.

This is an inspection and conversion tool, not a bookmark manager or content
archiver. Keep the original export and test a small destination import before
deleting source data.

MIT licensed. See [LICENSE](./LICENSE).
