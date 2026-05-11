# Yohaku Cheatsheet

One-page quick reference. Scan before filling a mockup or restyling a component. Full spec in `references/`.

## Invariants

1. Neutrals are three-tier: 1–4 surface/fill, 5–7 border/icon/secondary text, 8–10 body/heading.
2. n-5 must never be used for text. n-6 only for small text. n-7 for secondary text.
3. Tailwind's `neutral-50…950` palette is banned. Use `text-neutral-1…10` only.
4. Accent covers ≤ 5% of any surface. Reserved for CTA, focus ring, and brand mark.
5. Default body color is n-9 (dark mode auto-inverts).
6. Three font roles only: sans, serif, mono. CJK fallback is mandatory wherever Chinese or Japanese can render.
7. Type tokens are **role + px** (`caption-10`, `label-12`, `copy-13/14/15/16`, `title-20/24/28`, `display-36/48`, `icon-sm/md/lg`). Tailwind defaults `text-xs/sm/base/lg/xl/2xl/3xl/...` and hardcoded `text-[Npx]` are banned. Default body is `text-copy-14`.
8. Backdrop blur has four levels (thick, default, thin, ultrathin). Do not invent more.
9. Border radius follows Tailwind defaults; `rounded-2xl` is the cap for hero surfaces.
10. Depth comes from ring or whisper shadow. Hard drop shadows are forbidden.
11. Mockup HTML files must `@import` `@yohaku/design-system/tokens.css`. Raw hex outside the contract is a lint failure.

## Color

### Neutral (Pure scale)

| Var | Hex | Tier | Use |
|---|---|---|---|
| `--color-neutral-1` | `#f9f8f5` | 1 (surface) | Page background light, lightest fills |
| `--color-neutral-2` | `#f0efeb` | 1 (surface) | Card background |
| `--color-neutral-3` | `#e3e1db` | 1 (surface) | Subtle fill, hover surface |
| `--color-neutral-4` | `#d0cec6` | 1 (surface) | Strong fill, divider behind icons |
| `--color-neutral-5` | `#a8a69f` | 2 (border) | Border on solid surfaces. **Never text.** |
| `--color-neutral-6` | `#787670` | 2 (border/icon) | Icon, very small label only |
| `--color-neutral-7` | `#5c5a55` | 2 (secondary) | Secondary text, captions |
| `--color-neutral-8` | `#403f3a` | 3 (body) | Body text alt, strong secondary |
| `--color-neutral-9` | `#24231f` | 3 (body) | **Default body color** |
| `--color-neutral-10` | `#141312` | 3 (heading) | Headings, max emphasis |

In dark mode `apps/web/src/styles/variables.css` auto-inverts the scale. Use the same `text-neutral-N` classes in both themes.

### Accent and semantic

| Var | Hex | Use |
|---|---|---|
| `--color-accent` | `#c56473` (梅 ume, light theme base) | CTA, focus, brand mark, blockquote bar. ≤ 5% surface. |
| `--color-info` | `#3d6896` (縹 hanada) | Informational state |
| `--color-success` | `#5e9f7e` (若竹 wakatake) | Success state |
| `--color-warning` | `#a87a3d` (朽葉 kuchiba) | Warning state |
| `--color-error` | `#a64953` (蘇芳 suoh) | Error / destructive state |

The accent is also dynamically injected as `--a` (OKLCH) by `AccentColorStyleInjector` in `apps/web`. Per-page gradients via `PageColorGradient` use a content seed. These are runtime concerns and do not appear in mockups.

### Surface

| Var | Source | Use |
|---|---|---|
| `--color-paper` → `var(--surface-paper)` | runtime in `apps/web/src/styles/variables.css` | Page background (paper) |
| `--color-border` | runtime override per theme | Default border on cards, lists |

## Typography

```css
--font-sans:       Inter (var) → CJK fallback chain (PingFang SC, Microsoft YaHei, Noto Sans SC, Hiragino Sans GB, …)
--font-serif:      app-defined → Noto Serif CJK SC → Source Han Serif → SongTi SC → STSong → system serif
--font-mono:       Operator Mono → Cascadia Code PL → JetBrainsMono → Fira Code → Consolas → Monaco → CJK fallback
--font-logo-cjk:   Noto Serif JP → Source Han Serif → Noto Serif CJK SC → serif   /* logotype only */
--font-logo-latin: EB Garamond → GT Sectra → Tiempos Headline → Georgia → serif   /* logotype only */
```

`--font-logo-*` are reserved for the wordmark (`templates/snippets/logo.html`); never use them for body or UI text.

### Type scale (role + px)

Tailwind defaults `text-xs/sm/base/lg/xl/2xl/3xl/4xl/...` are **cleared** in `tokens.css` (`--text-*: initial`). Use only the role+px tokens below. Hardcoded `text-[Npx]` is banned.

| Token | px | line-height | Use |
|---|---|---|---|
| `text-caption-10` | 10 | 1.4 (14px) | Eyebrow uppercase + tracking only — use sparingly |
| `text-label-12` | 12 | 1.5 (18px) | Meta, small label, pagination, footnote |
| `text-copy-13` | 13 | 1.54 (20px) | Card description, compact body |
| `text-copy-14` | 14 | 1.57 (22px) | **Default body** (1rem at base 14) |
| `text-copy-15` | 15 | 1.6 (24px) | Dialog title, search input, `.prose` body, emphasised body |
| `text-copy-16` | 16 | 1.625 (26px) | Large body |
| `text-title-20` | 20 | 1.4 (28px) | Section heading, subhead |
| `text-title-24` | 24 | 1.33 (32px) | Sub-H1 |
| `text-title-28` | 28 | 1.29 (36px) | Page H1 |
| `text-display-36` | 36 | 1.22 (44px) | Hero, large display |
| `text-display-48` | 48 | 1.17 (56px) | OG display title |
| `text-icon-sm` | 14 | — | Small icon (`<i>`) |
| `text-icon-md` | 16 | — | Default icon |
| `text-icon-lg` | 18 | — | Large icon (rss, emoji) |

`text-icon-*` carries size only (no bundled line-height); use it on `<i>` / icon elements, never on body text.

`html { font-size: 14px }` and `letter-spacing: 0.01em` live in `apps/web/src/styles/tailwindcss.css`; mobile inputs lock to 16px above 1024px there; print drops to 12px. Weight is applied independently (`font-medium` for headings, `font-normal` for body) — **never** `font-bold` on Chinese text.

## Spacing & radius

Tailwind defaults. Common conventions:

| Tier | Use |
|---|---|
| `gap-1` (4px) | inline icon ↔ text |
| `gap-2` (8px) | tight stacks |
| `gap-3` (12px) | card content |
| `gap-4` (16px) | section content |
| `gap-6` (24px) | between cards in a grid |
| `gap-8` (32px) | major section breaks |

Radius: `rounded` (4px) for chips, `rounded-md` (6px) default, `rounded-lg` (8px) cards, `rounded-xl` (12px) modals, `rounded-2xl` (16px) hero cap.

## Backdrop blur

| Level | Class | Use |
|---|---|---|
| Thick | `backdrop-blur-2xl` | Modal scrim, full-screen sheet |
| Default | `backdrop-blur-xl` | Floating panel, popover |
| Thin | `backdrop-blur-md` | Subtle frosted card on hero |
| Ultrathin | `backdrop-blur-sm` | Sticky header on scroll |

Always pair with semi-transparent surface (`bg-paper/80`, `bg-neutral-1/70` etc.).

## Quick decisions

| Need | Use |
|---|---|
| Body paragraph | `text-copy-14 text-neutral-9` |
| Secondary text | `text-copy-13 text-neutral-7` |
| Small caption | `text-label-12 text-neutral-7` |
| Page H1 | `text-title-28 font-medium text-neutral-10` (CJK: never `font-bold`) |
| Section H | `text-title-20 font-medium text-neutral-9` |
| Eyebrow label | `text-caption-10 uppercase tracking-[1.5px] text-neutral-5` |
| Card | `bg-neutral-2 dark:bg-neutral-2 rounded-lg p-4 ring-1 ring-border` |
| Primary CTA | accent fill, white text — see `templates/snippets/hero.html` |
| Secondary button | `bg-neutral-2 hover:bg-neutral-3 text-neutral-9 ring-1 ring-border` |
| Tag / chip | `bg-neutral-2 text-neutral-7 text-label-12 px-2 py-0.5 rounded-md` |
| Code block | `bg-neutral-1 ring-1 ring-border rounded-md font-mono text-copy-13` |
| Blockquote | left border accent (`var(--color-accent)`), `text-neutral-7` |
| Section divider | `1px solid var(--color-border)` or `bg-neutral-3 h-px` |
| Icon next to text | `text-icon-sm` (14) or `text-icon-md` (16) — never `text-copy-*` for icons |

When in doubt: **n-9 carries body, accent carries focus, n-2 carries surface, ring-border carries division.**

## Verification

```bash
pnpm --filter @yohaku/design-system check
```

Validates:
1. Every hex listed in this cheatsheet matches `src/tokens.css`.
2. No `template/**/*.html` file uses `text-neutral-50…950`, raw hex (outside the token contract), or hardcoded `font-family`.
3. Every snippet imports `@yohaku/design-system/tokens.css` (or extends `scaffold.html`).
