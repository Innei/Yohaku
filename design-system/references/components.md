# Components · Catalog and Selection

When building React components for Yohaku, **reuse beats reinvent.** This catalog lists the existing primitives in `apps/web/src/components/ui/` and explains when each applies. Before writing a new component, scan this list and verify nothing fits.

## Inventory (as of 2026-04-25)

```
apps/web/src/components/ui/
├── auto-completion/         — typeahead with async suggestions
├── avatar/                  — user avatar with fallback
├── background/              — page-level decorated backgrounds (paper texture, gradients)
├── banner/                  — top-of-content banner strip
├── button/                  — button primitive (variants: primary, secondary, ghost, link)
├── checkbox/                — form checkbox
├── code-editor/             — monaco-style editor surface (admin-side mostly)
├── code-highlighter/        — read-only syntax highlighter for posts
├── collapse/                — accordion / disclosure
├── dialog/                  — confirm / alert dialog (smaller than modal)
├── divider/                 — horizontal / vertical rule
├── dropdown-menu/           — popover menu with items, checkboxes, radios
├── excalidraw/              — embedded sketch board
├── fab/                     — floating action button
├── float-panel/             — persistent floating side panel
├── float-popover/           — hover-anchored popover
├── form/                    — form layout primitives
├── gallery/                 — image gallery grid
├── image/                   — Next.js Image with placeholder + zoom
├── input/                   — text input, textarea
├── katex/                   — math rendering
├── label/                   — form label
├── language-selector/       — language toggle
├── link/                    — internal / external link with hover preview
├── link-card/               — rich URL preview card
├── list/                    — generic list with separators
├── loading/                 — spinner / placeholder
├── markdown/                — markdown renderer
├── markdown-editor/         — markdown editor (admin)
├── masonry/                 — masonry grid
├── media/                   — audio / video player
├── modal/                   — full-screen overlay (larger than dialog)
├── number-transition/       — animated number counter
├── pagination/              — page links
├── portal/                  — React portal wrapper
├── react-component-render/  — render arbitrary React component from string
├── relative-time/           — "3 days ago" formatter
├── rich-content/            — rich content (haklex) surface
├── rich-link/               — rich link block (haklex)
├── scroll-area/             — custom scroll area with thin scrollbar
├── select/                  — dropdown select
├── sheet/                   — bottom sheet / side sheet (mobile-leaning)
├── skeleton/                — loading skeleton
├── spinner/                 — inline spinner
├── switch/                  — toggle switch
├── tabs/                    — tab navigation
├── tag/                     — chip / tag pill
├── text/                    — typography primitive (eyebrow, title, body, etc.)
├── theme-switcher/          — light/dark toggle
├── toast/                   — transient notification
├── transition/              — react-transition wrapper
├── typography/              — heading, lead, etc.
├── user/                    — user identity row
└── viewport/                — responsive viewport helpers
```

Run `ls apps/web/src/components/ui/` to refresh this list before authoring a new component plan.

## Selection rules

### Modal vs Dialog vs Sheet

| Surface | Use |
|---|---|
| **Dialog** (`ui/dialog`) | Confirm / alert / quick prompt. ≤ 1 form field, focus-locked, dismissable. |
| **Modal** (`ui/modal`) | Multi-field form, content viewer, settings page. Larger, focus-locked. |
| **Sheet** (`ui/sheet`) | Mobile bottom sheet or right-edge sheet. Uses backdrop blur, swipeable. |
| **float-popover** | Hover or click-anchored content. Not focus-locked. Small content only. |
| **dropdown-menu** | Action list. Items, checkboxes, radios. Built on top of popover primitives. |

### Button vs Link vs Tag

| Need | Use |
|---|---|
| Action that mutates state | `ui/button` |
| Navigation that changes route | `ui/link` |
| Static label (category, state) | `ui/tag` |
| Action inside a menu | `ui/dropdown-menu` item, not a button |

### Text typography

`ui/text` and `ui/typography` are layered. Prefer the semantic component (`Text.Heading`, `Text.Lead`) over hand-rolled `<h1 className="...">`. The component carries the weight, line-height, color tokens.

## Adding a new ui/ entry

If, after consulting this catalog, no primitive fits:

1. **Confirm with the user before writing.** New ui/ entries are project-wide commitments.
2. Folder: `apps/web/src/components/ui/<kebab-name>/`.
3. Files:
   - `index.tsx` — the primary export
   - `index.css.ts` (or Tailwind className composition with `tailwind-variants`) — styles
4. Use only token classes documented in `CHEATSHEET.md`. Never reach for `text-neutral-50…950`.
5. Compose with existing primitives where possible (e.g., a new "Banner" should consume `ui/divider` rather than reinvent dividers).

## Imports inside `apps/web`

The `~` alias points to `apps/web/src`. Standard import shape:

```tsx
import { Button } from '~/components/ui/button'
import { Modal, ModalContent } from '~/components/ui/modal'
```

Never import from `@yohaku/design-system` in React code — the package only exports CSS tokens, not React. Components live in `apps/web/src/components/ui/`.
