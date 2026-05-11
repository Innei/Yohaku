# Typography · Full Spec

Companion to `CHEATSHEET.md`. Read this when authoring a new component, auditing type usage, or migrating legacy hardcoded sizes.

## Contract at a glance

- **Anchor**: `html { font-size: 14px }` (lives in `apps/web/src/styles/tailwindcss.css`).
- **Naming**: Geist-style **role + px** (`caption-10`, `label-12`, `copy-13/14/15/16`, `title-20/24/28`, `display-36/48`, `icon-sm/md/lg`).
- **Bundled `size` + `line-height`** per token; **weight** stays independent.
- **Tailwind defaults cleared.** `text-xs/sm/base/lg/xl/2xl/3xl/...` are nuked via `--text-*: initial`.
- **Hardcoded `text-[Npx]` banned.** Use the role+px scale.
- **CJK rule unchanged.** Headings cap at 500 (`font-medium`); `font-bold` is forbidden on Chinese text.

## Why role + px

Vercel Geist couples the role (`copy`, `label`, `title`, …) with the absolute size — both are part of the class name. Two upsides matter here:

1. **Intent surfaces in the class.** Reading `text-title-28` tells a reviewer *both* that this is a page heading *and* that it ships at 28px. The familiar tw alphabet (`xs/sm/...`) loses the role signal.
2. **No drift between alias and ramp.** The class name *is* the size, so a designer specifying "page H1 at 28px" maps to exactly one token, with no rounding through `text-3xl` (which is 26.25px at base 14, not 28).

The compromise: more tokens to remember, and renames now read as "copy-14" instead of "base". The migration accepts that trade in exchange for a stronger semantic contract.

## Scale

```
caption-10           — 10px / 1.4   (eyebrow uppercase + tracking only)
label-12             — 12px / 1.5
copy-13              — 13px / 1.54
copy-14   ★ base     — 14px / 1.57
copy-15              — 15px / 1.6   (.prose body)
copy-16              — 16px / 1.625
title-20             — 20px / 1.4
title-24             — 24px / 1.33
title-28             — 28px / 1.29  (page H1)
display-36           — 36px / 1.22
display-48           — 48px / 1.17

icon-sm / md / lg    — 14 / 16 / 18 px  (no bundled line-height)
```

### Role boundaries

| Role | What it means | Examples |
|---|---|---|
| `caption` | All-caps eyebrow / metadata-as-decoration. Always paired with `uppercase` + `tracking-*`. | Hero eyebrow, OG image tagline |
| `label` | Small inline text — metadata, footnotes, pagination, chip text. Lowercase OK. | Date, reading time, pagination indicator |
| `copy` | Continuous reading text. **`copy-14` is the default.** Bump to 15 for emphasised reading (`.prose`), 13 for compact card descriptions, 16 only when the layout demands. | Paragraphs, card content, dialog body |
| `title` | UI / page headings. Always paired with weight (`font-medium` or `font-normal`). | Page H1 / H2 / section heading |
| `display` | Hero / OG. Reserved for content that *displays* rather than *reads*. | Hero greeting, OG card title |
| `icon` | Sizes meant for `<i>` glyphs. Separate from copy/title to avoid accidental "icon-sized body text". | `i-mingcute-rss-fill`, FAB icons |

### Bundled line-height

Tailwind v4 lets each `--text-{name}` declare a matching `--text-{name}--line-height`. Both apply when the class is used:

```css
--text-copy-14: 14px;
--text-copy-14--line-height: 1.57;  /* 22px */
```

```tsx
<p className="text-copy-14">…</p>  // gets font-size: 14px AND line-height: 1.57
```

To override only the line-height locally, append a `leading-[N]` utility:

```tsx
<p className="text-copy-14 leading-[1.5]">…</p>
```

`icon-*` deliberately omits `--line-height` because icons run inside a parent's leading, not their own.

### Weight policy

Weight is **separate** from size:

- `font-normal` (400) for body.
- `font-medium` (500) for headings.
- `font-semibold` (600) acceptable for short English emphasis (badges, uppercase labels).
- `font-bold` (700) is **forbidden** on text that can render Chinese / Japanese; CJK fonts faux-bold unevenly.

### Default body anchor

`copy-14` is the body anchor. It equals `1rem` at the project's `html { font-size: 14px }` setting, so margin/padding utilities in rem (`mt-4` = 1rem = 14px) align naturally with the body grid.

`.prose` upgrades to `copy-15` for long-form reading comfort; this changes `.prose` line-height from the global `1.5` to the bundled `1.6`. The 0.4px size shift and looser leading are intended improvements.

## Migration mapping (legacy → token)

Reference for the apps/web sweep (phase 2). One-shot table:

### Hardcoded `text-[Npx]`

| Old | New | Note |
|---|---|---|
| `text-[10px]` uppercase | `text-caption-10` | Pair with `uppercase tracking-*` |
| `text-[10px]` icon | `text-icon-sm` | 10px icon is too small; bump to 14 |
| `text-[11px]` | `text-label-12` | 11px deprecated; bump to 12 |
| `text-[12px]` | `text-label-12` | — |
| `text-[13px]` | `text-copy-13` | — |
| `text-[14px]` body | `text-copy-14` | — |
| `text-[14px]` icon | `text-icon-sm` | — |
| `text-[14px]!` (CodeHighlighter) | `text-copy-14!` | Keep `!important` |
| `text-[15px]` | `text-copy-15` | — |
| `text-[16px]` body | `text-copy-16` | — |
| `text-[16px]` icon | `text-icon-md` | — |
| `text-[18px]` icon | `text-icon-lg` | Body text at 18px is not in the ramp |
| `text-[20px]` | `text-title-20` | — |
| `text-[28px]` | `text-title-28` | — |

### Tailwind defaults

| Old | New |
|---|---|
| `text-xs` | `text-label-12` |
| `text-sm` | `text-copy-13` |
| `text-base` | `text-copy-14` |
| `text-lg` | `text-copy-16` |
| `text-xl` | `text-title-20` |
| `text-2xl` | `text-title-24` |
| `text-3xl` | `text-title-28` |
| `text-4xl` | `text-display-36` |

`text-5xl` and above are not present in the codebase; if needed later, extend `display-{N}`.

### `.prose` and markdown CSS

- `.prose { font-size: 1.1rem }` → `@apply text-copy-15`.
- Markdown `h1` / `h2` / `h3` → `@apply text-title-28 / text-title-24 / text-title-20` with `font-medium`.
- Rich-content `font-size: Npx` rules in `markdown.css` / `markdown-variants.css` map per the table above.
- `font-size: 0.6em` / `font-size: 2.4em` and other relative `em` declarations stay as-is — `em` semantics (relative to parent) are intentional inside nested rich content.
- `font-size: inherit !important;` stays — it neutralises third-party `!important`.

### OG image routes (`og/route.tsx`, `home-og/route.tsx`)

The OG renderer doesn't resolve CSS variables, so values stay as inline `fontSize: 'Npx'` strings, but each value is folded into the ramp:

- `'10px' / '11px'` → bump to `'12px'`
- `'13px' / '14px' / '15px' / '16px' / '20px' / '24px' / '28px'` → keep
- `'36px' / '40px' / '48px'` → keep / fold to `'36px'` or `'48px'`
- `'56px' / '60px' / '72px'` → fold to `'48px'`

## Banned patterns

Caught by `apps/web` ESLint (`no-restricted-syntax`) and `packages/design-system/scripts/check.ts` template lint (phase 3):

- `text-\[\d+(\.\d+)?px\]` — hardcoded pixel sizes in `className`.
- `\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b` — Tailwind defaults.

No allowlist — the entire codebase migrates in phase 2.

## Edge cases & gotchas

- **Mobile input zoom lock.** `apps/web` keeps `input, textarea { font-size: 1rem }` above 1024px so mobile browsers don't zoom on focus. Don't apply `text-copy-*` to `<input>` unless you also raise the breakpoint behaviour intentionally.
- **Print.** `@media print { html { font-size: 12px } }` rescales the whole ramp by ratio. Token values are still nominally 10/12/13/… px but render `× 12/14`. This is intentional.
- **Inline `style={{ fontSize }}`.** OG routes and a handful of dynamic styles (e.g. user-configurable preview) use inline `style`. They are out of the ESLint ban (which only catches `className` literals) but should still pull from the ramp values.
- **`text-icon-*` on text.** Lint is initially soft on this (warn only). Don't put `text-icon-sm` on a `<span>` of body text — use `text-copy-13` instead.
- **`@haklex/rich-static-renderer`.** The third-party renderer applies its own `prose`-like classes; Yohaku's `.prose` override still wins because we use `@apply` inside Yohaku's global stylesheet.

## See also

- `CHEATSHEET.md` — one-page quick reference.
- `tokens.md` § Typography — same scale, brief form.
- `apps/web/src/styles/tailwindcss.css` — base anchor, print rule, mobile input lock, `.prose`.
- `apps/web/src/styles/layer.css`, `apps/web/src/components/ui/markdown/markdown.css`, `markdown-variants.css` — rich-content layers using `@apply`.
- `docs/superpowers/specs/2026-05-11-typography-scale-design.md` — design rationale and phasing.
