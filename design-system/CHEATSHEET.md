# Yohaku Cheatsheet

One-page quick reference. Scan before filling a mockup or restyling a component. Full spec in `references/`.

## Ten invariants

1. Neutrals are three-tier: 1–4 surface/fill, 5–7 border/icon/secondary text, 8–10 body/heading.
2. n-5 must never be used for text. n-6 only for small text. n-7 for secondary text.
3. Tailwind's `neutral-50…950` palette is banned. Use `text-neutral-1…10` only.
4. Accent covers ≤ 5% of any surface. Reserved for CTA, focus ring, and brand mark.
5. Default body color is n-9 (dark mode auto-inverts).
6. Three font roles only: sans, serif, mono. CJK fallback is mandatory wherever Chinese or Japanese can render.
7. Backdrop blur has four levels (thick, default, thin, ultrathin). Do not invent more.
8. Border radius follows Tailwind defaults; `rounded-2xl` is the cap for hero surfaces.
9. Depth comes from ring or whisper shadow. Hard drop shadows are forbidden.
10. Mockup HTML files must `@import` `@yohaku/design-system/tokens.css`. Raw hex outside the contract is a lint failure.

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
--font-sans:  Inter (var) → CJK fallback chain (PingFang SC, Microsoft YaHei, Noto Sans SC, Hiragino Sans GB, …)
--font-serif: app-defined → Noto Serif CJK SC → Source Han Serif → SongTi SC → STSong → system serif
--font-mono:  Operator Mono → Cascadia Code PL → JetBrainsMono → Fira Code → Consolas → Monaco → CJK fallback
```

| Tailwind class | Size | Use |
|---|---|---|
| `text-xs` | 0.75rem | Tiny labels |
| `text-sm` | 0.875rem | Captions, secondary UI text |
| `text-base` | 1rem | UI default |
| `text-lg` | 1.125rem | Lead paragraph |
| `text-xl` | 1.25rem | Section title |
| `text-2xl` | 1.5rem | H2 |
| `text-3xl` | 1.875rem | H1 on content pages |
| `text-4xl` | 2.25rem | Hero title |

Body line-height `1.5`. Heading `1.1–1.3`. Letter-spacing on `html` is `0.01em`.

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
| Body paragraph | `text-neutral-9` |
| Secondary text | `text-neutral-7` |
| Small caption | `text-neutral-6 text-sm` |
| Heading | `text-neutral-10 font-medium` (headings stay 500, never synthetic bold for CJK) |
| Card | `bg-neutral-2 dark:bg-neutral-2 rounded-lg p-4 ring-1 ring-border` |
| Primary CTA | accent fill, white text — see `templates/snippets/hero.html` |
| Secondary button | `bg-neutral-2 hover:bg-neutral-3 text-neutral-9 ring-1 ring-border` |
| Tag / chip | `bg-neutral-2 text-neutral-7 text-xs px-2 py-0.5 rounded-md` |
| Code block | `bg-neutral-1 ring-1 ring-border rounded-md font-mono text-sm` |
| Blockquote | left border accent (`var(--color-accent)`), `text-neutral-7` |
| Section divider | `1px solid var(--color-border)` or `bg-neutral-3 h-px` |

When in doubt: **n-9 carries body, accent carries focus, n-2 carries surface, ring-border carries division.**

## Verification

```bash
pnpm --filter @yohaku/design-system check
```

Validates:
1. Every hex listed in this cheatsheet matches `src/tokens.css`.
2. No `template/**/*.html` file uses `text-neutral-50…950`, raw hex (outside the token contract), or hardcoded `font-family`.
3. Every snippet imports `@yohaku/design-system/tokens.css` (or extends `scaffold.html`).
