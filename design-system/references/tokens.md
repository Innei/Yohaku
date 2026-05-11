# Tokens · Full Spec

Companion to `CHEATSHEET.md`. Read this when building a new component or auditing color usage in depth. The cheatsheet is the day-to-day reference; this file is the rationale and edge cases.

## Three-tier neutral system

The neutral scale (`#f9f8f5` → `#141312`) carries a deliberate warm undertone in **light mode** (R > G > B, parchment-like), tuned to harmonize with the project page background `#fefefb`. Surface tiers (1–4) carry the most warmth (parchment feel), border/text tiers (5–7) carry mid warmth, body tiers (8–10) recede toward neutral charcoal. **Dark mode** does not invert the warm scale — instead it resets to pure neutral gray (`#141414` → `#f8f8f8`, R = G = B) because warmth at dark luminance reads as olive at low saturation. Dark-mode warmth is carried solely by `--color-paper`. Use the same `text-neutral-N` classes in both themes.

### Tier 1 · Surface (1–4)

| Var | Hex (light) | Hex (dark, inverted) | Use |
|---|---|---|---|
| n-1 | `#f9f8f5` | `#141414` | Lightest surface, page background |
| n-2 | `#f0efeb` | `#242424` | Card surface |
| n-3 | `#e3e1db` | `#404040` | Hover surface, subtle fill |
| n-4 | `#d0cec6` | `#5c5c5c` | Strong fill behind monochrome icons |

**Tier 1 must never carry text.** A text color this close to the page surface fails contrast even in light mode and inverts unreadably in dark mode.

### Tier 2 · Border / icon / secondary (5–7)

| Var | Hex (light) | Hex (dark, inverted) | Use |
|---|---|---|---|
| n-5 | `#a8a69f` | `#787878` | Border on solid surfaces. **Never text.** |
| n-6 | `#787670` | `#a8a8a8` | Icon stroke, small label (`<= text-xs`) only |
| n-7 | `#5c5a55` | `#d0d0d0` | Secondary text, caption, metadata |

n-5 reads as warm-gray-on-cream border but as warm-gray-on-gray text — invisible in both themes. Reach for n-7 (or n-6 only when constrained to `text-xs`).

### Tier 3 · Body / heading (8–10)

| Var | Hex (light) | Hex (dark, inverted) | Use |
|---|---|---|---|
| n-8 | `#403f3a` | `#e3e3e3` | Body alt, strong secondary text |
| n-9 | `#24231f` | `#f0f0f0` | **Default body color** |
| n-10 | `#141312` | `#f8f8f8` | Headings, max emphasis |

n-9 is what you reach for by default for any paragraph. n-10 is reserved for headings and the rare "this needs to win the hierarchy fight" moment.

### Banned: Tailwind `neutral-50…950`

The palette ships with Tailwind by default. We override `--color-neutral-N` for `N` in 1..10 and explicitly do **not** export the 50–950 scale. Any class using those values is a lint failure. The verify script blocks them.

## Accent

`--color-accent` is `#c56473` (梅 ume) in the light theme base, paired with `#e095a4` (lighter ume, close to 桃) in dark mode via `apps/web/src/styles/variables.css`. The runtime layer (`AccentColorStyleInjector` in `apps/web`) replaces it with an OKLCH-based dynamic value bound to `--a` so per-user theme accents work without touching tokens.

### Discipline

- **≤ 5% surface coverage.** Accent is for the eye to land on, not to fill in.
- Reserved roles: primary CTA fill, focus ring, brand mark, blockquote bar, link underline (sometimes), focus state on form fields.
- Avoid: accent text in body paragraphs, accent borders on regular cards, accent backgrounds on large surfaces.

### Pairing

| Background | Foreground | Use |
|---|---|---|
| Accent fill | white text | Primary CTA |
| Accent border (`ring-1 ring-accent`) | n-9 text | Focus state on input |
| Accent left bar (4px) | n-9 text | Blockquote, section emphasis |

## Semantic colors

| Var | Hex | Use |
|---|---|---|
| `--color-info` | `#3d6896` (縹 hanada) | Informational toast, info banner, link in admin contexts |
| `--color-success` | `#5e9f7e` (若竹 wakatake) | Success toast, confirmation chip |
| `--color-warning` | `#a87a3d` (朽葉 kuchiba) | Warning toast, draft state |
| `--color-error` | `#a64953` (蘇芳 suoh) | Error toast, destructive action label |

Drawn from the Japanese 和色 traditional palette to harmonize with the ume (`#c56473`) accent — restraint over saturation. `apps/web/src/styles/variables.css` lifts each one ~15% in dark mode for readability without breaking the muted character.

These are state colors; do not use them for general decoration. Reach for accent or neutrals first.

## Typography

Full spec in `references/typography.md`. This section summarises the contract.

### Three font roles only

```
sans:  app default → CJK fallback chain
serif: app default → CJK serif fallback chain
mono:  developer-tier mono → CJK fallback for missing glyph boxes
```

### CJK fallback is mandatory

Any `font-family` used to render Chinese or Japanese must include `Noto Serif CJK SC` (or sans equivalent) in its fallback. Even mono needs a CJK family or you get tofu boxes for missing glyphs.

### Type scale — role + px (Geist-style)

`tokens.css` clears Tailwind's default `--text-*` namespace (`--text-*: initial`) and declares role+px tokens with bundled `line-height`. Anchored on `html { font-size: 14px }` in `apps/web`.

| Role | Sizes (px) | Use |
|---|---|---|
| `caption` | 10 | Eyebrow uppercase + tracking only. **Use sparingly.** |
| `label` | 12 | Meta, small label, pagination, footnote |
| `copy` | 13, 14, 15, 16 | Body family. **`copy-14` is the default body anchor.** |
| `title` | 20, 24, 28 | Section heading → page H1 |
| `display` | 36, 48 | Hero, OG renderer |
| `icon` | sm (14), md (16), lg (18) | `<i>` / icon elements only. No bundled line-height. |

**Bundled `line-height`** ships per token (e.g. `--text-copy-14--line-height: 1.57`). Override with an explicit `leading-[N]` utility when needed. Suggested ranges: caption/label `1.4–1.5`, copy `1.55–1.63`, title `1.29–1.4`, display `1.17–1.22`.

**Tailwind defaults banned.** `text-xs/sm/base/lg/xl/2xl/3xl/4xl/5xl/6xl/7xl/8xl/9xl` are nuked via `--text-*: initial`. Hardcoded `text-[Npx]` is equally banned. Enforcement: apps/web ESLint (`no-restricted-syntax`) + design-system `scripts/check.ts` template lint (added in phase 3).

**Runtime overrides** (live in `apps/web/src/styles/tailwindcss.css`, not in this package):
- `html { font-size: 14px }` — base anchor.
- `@media print { html { font-size: 12px } }` — print density.
- `@media (min-width: 1024px) { input, textarea { font-size: 1rem } }` — mobile-input zoom lock.

### Weight

Weight is **not** bundled into type tokens. Apply independently:

- Body: 400 (`font-normal`).
- Heading: 500 (`font-medium`). **Never synthetic bold (`<b>`, `font-bold`) on Chinese text** — it produces uneven faux-bold glyphs in most CJK fonts.
- English emphasis: 600 acceptable in narrow contexts (badges, label uppercase).

### Letter-spacing

`html { letter-spacing: 0.01em; }` is global. Tracking adjustments should be local and intentional (e.g., 0.04em uppercase eyebrow labels paired with `text-caption-10`).

## Spacing & radius

We follow Tailwind v4 defaults:

```
Spacing tier base: 4px
Radius scale: 4px → 6px → 8px → 12px → 16px → 24px (rounded-3xl)
```

Hero surfaces cap at `rounded-2xl` (16px). Anything more rounds away into "playful" territory the brand does not target.

## Backdrop blur (glassmorphism)

Four levels, no improvisation:

| Level | Class | Pixel | Use |
|---|---|---|---|
| Thick | `backdrop-blur-2xl` | 40px | Modal scrim, full-screen sheet |
| Default | `backdrop-blur-xl` | 24px | Floating panel, popover |
| Thin | `backdrop-blur-md` | 12px | Subtle frosted card on hero background |
| Ultrathin | `backdrop-blur-sm` | 4px | Sticky header on scroll |

Pair every blur with a transparent surface that lets the underlying gradient or noise show through.

## Shadow

Two flavors, both subtle:

```css
/* ring (outline) */
ring-1 ring-border

/* whisper shadow */
shadow-[0_4px_24px_rgba(0,0,0,0.05)]
```

Hard drop shadows (`shadow-lg`, `shadow-xl`, `shadow-2xl`) are forbidden in product surfaces. They make Yohaku look like a generic SaaS tool.

## Motion

Motion belongs to `apps/web` (Motion / Framer Motion lazy-loaded). Mockup HTML can use plain CSS transitions:

```css
transition: transform 0.2s ease, opacity 0.2s ease;
```

Easing default is ease (`cubic-bezier(0.25, 0.1, 0.25, 1)`). Spring physics live in React only.
