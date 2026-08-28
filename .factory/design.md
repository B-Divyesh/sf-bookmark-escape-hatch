# Bookmark Escape Hatch — visual thesis

## Direction: the portability test bench

The product is a **mid-century instrument panel**, not a nostalgic skin. Moving a
bookmark archive is an inspection job: a file enters at the left, passes through
calibrated checks, and leaves with a paper-trail report. The interface borrows the
legibility, physical grouping, honest materials, and reassuring status lamps of a
1960s electronics workbench. Decoration always explains the flow or a state.

The experience is intentionally single-mode. Its warm, explicitly painted workbench
background is part of the trust model: data stays on *this* desk, on *this* device.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `bench` | `#E6DDC8` | page background, aged drafting paper |
| `paper` | `#F8F2E5` | reports and primary work surfaces |
| `panel` | `#283734` | dark enamel instrument panels |
| `ink` | `#192321` | primary text |
| `muted` | `#5B635D` | secondary copy (≥4.5:1 on paper) |
| `line` | `#938C78` | rules and inactive hardware |
| `orange` | `#C84E2F` | primary action / warning lever |
| `orange-dark` | `#8F301D` | pressed/focus-adjacent orange |
| `lamp` | `#2E7366` | valid/success status |
| `lamp-dark` | `#164E44` | success text |
| `amber` | `#9A650E` | recoverable warning |
| `danger` | `#A52D2D` | malformed/error status |
| `white` | `#FFFDF7` | text on dark enamel |

Status never depends on hue: every lamp has an icon/label and every report row has
plain-language status text.

## Type and numerals

- Display and body: `Arial`, `Helvetica Neue`, sans-serif. Broad geometric labels
  evoke industrial manuals while remaining native, fast, and familiar.
- Readouts and data: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace with
  tabular figures. URLs, counts, dates, and destination limits look inspectable.
- Scale: 13px panel labels, 16px body, 20px subhead, 29px section title, and a
  responsive 44–68px h1. Body leading is 1.55; prose stays under 70 characters.
- No web fonts: the system pairing has zero network or font payload.

## Spacing and layout

An 8px base rhythm with 4px micro-adjustments. The desktop is a 12-column bench;
the import console occupies eight columns and the illustrated signal path four.
Reports use a dense but breathable tabular readout. At 760px, panels stack in job
order. At 390px, nonessential instrument tick marks and the hero illustration are
dropped so file selection and the audit result lead. Every target is at least 44px.

Corners are clipped or modest (2–12px), never pill-shaped by default. Double rules,
engraved uppercase labels, inset readout wells, numbered stages, and one physical
toggle vocabulary provide depth without a framework-card grid.

## Interaction grammar

1. **Load** — drop/select an HTML, JSON, or CSV export. The intake lever changes to
   a filename plate immediately.
2. **Calibrate** — choose a destination profile (Neutral archive, Browser HTML,
   Raindrop CSV, or Linkwarden JSON). Controls show exact field support.
3. **Inspect** — meters settle to counts for valid, duplicate, malformed, and lossy
   records. Tabs switch between Summary, Records, and Field loss without navigation.
4. **Release** — download a neutral JSON archive, cleaned HTML, CSV, and dry-run
   report. Downloads use the current inspected snapshot only.

Files can also be pasted for keyboard and mobile workflows. Parsing happens only in
the browser. The most recent completed inspection is stored in IndexedDB and can be
restored or explicitly cleared.

## Motion policy

Controls depress and lamps settle over 160–220ms; the report carriage enters once
with an 8px translate over 240ms. No looping animation, parallax, or blinking lamps.
With `prefers-reduced-motion: reduce`, transforms are removed and transitions become
instant opacity/state changes. Progress is textual and announced in a polite live
region.

## Original asset plan and provenance

- One generated hero illustration: an axonometric 1960s bookmark migration testing
  console with a paper archive entering, calibrated channels, and a verified report
  exiting. It clarifies the import → inspect → export mental model. A hand-authored
  SVG oscilloscope trace is used for small decorative dividers; icons are text/simple
  CSS geometry so the raster illustration is not forced into UI chrome.
- Prompt sheet: **Subject:** compact bookmark portability test bench processing
  abstract paper cards. **World:** 1960s electronics laboratory. **Materials:** cream
  enamel, charcoal Bakelite, brushed aluminum, paper, glass indicator lamps.
  **Light:** warm directional studio light with short soft shadows. **Lens:** elevated
  three-quarter/isometric product view. **Palette:** parchment cream, deep green-black,
  burnt safety orange, muted teal. **Negative list:** people, hands, brands, logos,
  readable text, watermark, gradients, neon, glossy modern screens, UI screenshot.
- Final generation prompt derives verbatim from that sheet. Generated with the
  factory Azure image deployment via `/opt/fleet/lib/gen-image.sh`, 2026-08-28.
  Generated output is original for this product. The shipped footer discloses it.
- Source PNG and prompt sidecar live in `assets/src/`; optimized WebP/AVIF versions
  live in `public/assets/`. Candidates are visually reviewed for text artifacts,
  seams, unintended logos/symbols, and palette fit before use.
- The 1200×630 social card is a deterministic crop of the same original console
  art with a hand-authored enamel overlay. `npm run assets` reproduces it; no new
  third-party material is introduced.

## Accessibility intent

One h1 and one main landmark. A skip link lands on the intake console. Focus uses a
3px teal-and-cream double outline that remains visible on both panel and paper.
Labels remain visible; placeholders only provide examples. Error summaries receive
focus, and status messages are announced. Tables become labelled record blocks on
narrow screens. The single-mode palette is contrast-checked and reduced motion is
first-class.
