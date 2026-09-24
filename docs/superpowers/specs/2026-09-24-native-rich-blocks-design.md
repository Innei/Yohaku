# Native rich blocks: math, grid, footnotes, code snippet, dynamic, static print media

Date: 2026-09-24 · Branch: `feat/native-rich-body` · App: `apps/mobile` (iOS only)

## Goal

Every Lexical block the native reader meets renders natively instead of the
`UnsupportedBlock` card, and the native print/PDF pipeline draws map, stock and
album blocks as static images instead of text captions.

Success: the print-lab fixture renders with zero `UnsupportedBlock` cards on
screen, and its exported PDF shows the map, K-line and album as images.

## Decisions (agreed)

| Topic | Decision |
|---|---|
| Math engine | SwiftMath 1.7.3 (MIT, SPM-only), vendored as a podspec; covers `katex-block` and `katex-inline` |
| Math font | Only `latinmodern-math` shipped (~0.7 MB); other bundled fonts pruned |
| `dynamic` host | In-app host page in a WKWebView (`loadHTMLString`, base URL = site origin), mirrors the web mount protocol |
| Grid layout | Adaptive: media-only cells sit side by side; any text cell switches the grid to a numbered vertical stack |
| `dynamic` in print | Stays a caption |

## Node shapes (verified against @haklex 0.40)

- `katex-block`: `{ equation }`; `katex-inline`: `{ equation }`
- `grid-container`: `{ cols, gap?, cells: SerializedEditorState[] }` — no element children
- `footnote-section`: `{ definitions: Record<identifier, plainText> }`; inline `footnote`: `{ identifier }`; display number = order of first appearance of each identifier in the document, from 1
- `code-snippet`: `{ files: { code, filename, language?, highlightLines? }[] }`
- `dynamic`: `{ url, props, initialHeight = 320 }`; web does `import(url)` then `default.mount(container, { props, host: { theme } })` in an open shadow root, only for URLs listed by `GET {apiBase}/s/dynamic-widgets-catalog` (`{ components: [{ url }] }`)

## Screen rendering

### Math
- **Native view `YohakuMathView`** (yohaku module, `ios/Math/`): wraps `MTMathUILabel`; props `latex`, `fontSize`, `color`; emits `onContentSize` (width, height) and `onError`. Display mode, centered; wider than the column → horizontal scroll in RN.
- **`MathBlock`** (`src/rich/blocks/math-block.tsx`): registered for `katex-block`; parse error → raw TeX shown with the `CodeBlock` body style.
- **Inline**: `katex-inline` override emits `{ text: equation, math: true }`. `RichAttributedBuilder` turns a math run into one attachment character carrying `.richMath` (the parsed `MTMathListDisplay`) with bounds from the display's ascent/descent. `RichLayoutManager` draws `.richMath` ranges itself (vector) instead of an attachment image. Parse failure → the run renders as a code run, as today.

### Grid (`src/rich/blocks/grid-block.tsx`)
- Media-only test (pure, `grid.ts`): every cell's root children are `image`, `gallery` or `video` nodes (ignoring empty paragraphs).
- Media-only → one row, `cols` equal columns, 8pt gap, each cell `renderNested(cell)`.
- Otherwise → vertical list: left marker column with the cell number (secondary color, wide gutter per the block-indent breathing rule), hairline divider between cells.

### Footnotes
- `footnoteNumbers(value)` (pure, `src/rich/lexical/footnotes.ts`) walks the editor JSON and returns `Map<identifier, number>`; `RichDocument` computes it for the root document and passes it through context.
- Inline ref: the `footnote` override (static, no context access) emits `{ text: identifier, footnote: identifier, sup: true }`. `numberFootnotes(blocks, numbers)` (pure, same file) rewrites those runs to the display number (identifier if unmapped) and sets `href` = `yohaku-footnote:<identifier>`; `TextSegment` applies it before handing blocks to `RichTextView`, and print applies it in `printItems`. `ArticleBody.handleLinkPress` intercepts that scheme and scrolls to the `footnote-section` block.
- `FootnoteSectionBlock`: hairline, then numbered rows `n.  definition` ordered by display number (unmapped identifiers last, in key order).

### Code snippet (`src/rich/blocks/code-snippet-block.tsx`)
- Filename tab row (hidden for a single file) above the existing `CodeBlock` body; the code block body is extracted so both share it. Copy copies the active file.
- `highlightLines` ignored (`ponytail:` comment).

### Dynamic (`src/rich/blocks/dynamic-block.tsx` + native `YohakuWebEmbedView`)
- RN: react-query fetches the catalog once (`['dynamic-catalog']`); URL not allowed or catalog unreachable → existing fallback card (“在网页中查看”).
- Native view (`ios/WebEmbed/`): WKWebView, transparent, scroll disabled, `loadHTMLString(hostHtml, baseURL: siteOrigin)`. Props: `url`, `props` (JSON), `theme`, `initialHeight`. Host HTML: open shadow root → `import(url)` → `mount(root, { props, host: { theme } })`; a ResizeObserver posts height → `onContentHeight`. Theme prop change re-mounts. Navigation to other URLs is cancelled and emitted as `onLinkPress` → `openExternalUrl`. Mount error → `onError` → fallback card.

## Print

JS (`src/rich/print/print-items.ts`) gains fetch-backed items; each fetch is wrapped in an 8 s timeout and falls back to the caption on failure. `PrintContext` gets the fetchers injected (testable).

| Block | Print item | Native rendering (`RichPrint.swift`) |
|---|---|---|
| map | `{ kind: 'map', polylines: [lat, lon][][] , caption }` from the same track fetch + `map-track.ts` parse | `MKMapSnapshotter` (muted standard map, region fit to track, print width, scale 2) + casing/accent polyline and start/end dots drawn on the snapshot |
| stock | `{ kind: 'kline', bars, ema, caption }` from `api.stockBars` + client EMA (same helpers as `stock-block`) | The chart SwiftUI view from `YohakuKlineView` rendered with `ImageRenderer` at print width |
| afilmory | `{ kind: 'imageGrid', srcs, columns: 3 }` from `afilmory.ts` resolution (thumbnail URLs, capped by `limit`, default 9) | Thumbnails loaded like images, composed into one grid image |
| gallery | `{ kind: 'imageGrid', srcs, columns: 3 }` | same |
| katex-block | `{ kind: 'math', latex }` | Math attachment drawn vector, as on screen |
| grid-container | cells flattened in order via `probe(cell)` | — |
| footnote-section | text blocks `n. definition`; inline refs already carry numbers | — |
| code-snippet | per file: caption `filename`, then code | — |
| dynamic | caption (unchanged) | — |

Fixes the current bug where grid and footnote sections print nothing (they were read from non-existent `children`).

## Infrastructure

- `modules/yohaku/ios/Vendor/SwiftMath.podspec`: git tag 1.7.3, `prepare_command` writes a `Bundle.module` shim (`Bundle(for:)` of a token class) and deletes every math font except `latinmodern-math.{otf,plist}`; `resources` ships `mathFonts.bundle`. Added to `YohakuKit.podspec` dependencies and to `plugins/with-ios-mermaid-pods.cjs`.
- Fixture `packages/rich-content/src/lexical/__fixtures__/print-lab.json`: `footnote-section.definitions`, inline footnote refs, `dynamic.props`/`initialHeight`, two-file `code-snippet`, block and inline math, one text grid and one media grid.

## Testing

- vitest: `footnoteNumbers`, grid media detection, print items for map/stock/afilmory/gallery/grid/footnotes/code-snippet with fake fetchers (success and timeout fallback).
- Simulator: rich-document lab and print lab screenshots per block (light and dark), exported PDF rendered page by page; dynamic widget checked against a catalog-listed URL.

## Out of scope

Syntax highlighting for code blocks, `highlightLines`, printing live `dynamic` widgets, footnote back-links (↩).
