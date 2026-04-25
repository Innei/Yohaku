# Anti-Patterns · What Not to Do

The verify script blocks the worst of these mechanically. Treat this list as the reasoning behind those checks plus everything the script can't catch.

## Color

### `text-neutral-50…950` is banned

Tailwind ships a default neutral palette in addition to our own `neutral-1…10`. Using it bypasses the contract:

```html
<!-- Wrong -->
<p class="text-neutral-500">Body copy</p>

<!-- Right -->
<p class="text-neutral-9">Body copy</p>
```

The verify script rejects any token from the 50–950 range. There is no exception.

### n-5 is not a text color

n-5 (`#a8a8a8`) reads as a border on solid surfaces but disappears as text — and the dark-mode inversion makes it worse. Reach for n-7 minimum.

### Raw hex outside the contract

Mockup `<style>` blocks may declare new component-level vars, but they should source values from `var(--color-neutral-N)`, `var(--color-accent)`, etc. A literal hex like `#5c5c5c` should always be replaced by `var(--color-neutral-7)`.

```css
/* Wrong */
.my-card { background: #f0f0f0; }

/* Right */
.my-card { background: var(--color-neutral-2); }
```

### Accent overuse

The accent is a focal device. Once it shows up on more than ~5% of a surface, the eye stops landing anywhere. Audit any view where you find:

- More than one accent CTA per fold.
- Accent borders on multiple cards in a list.
- Accent text in body paragraphs.

## Typography

### Synthetic bold on Chinese text

```html
<!-- Wrong -->
<strong class="font-bold">重要内容</strong>

<!-- Right -->
<strong class="font-medium">重要内容</strong>
```

CJK fonts rarely ship a 700 weight cut. The browser fakes it by stroking the glyph, which produces uneven, blurry boldness. `font-medium` (500) is the cap for CJK.

### Hardcoded `font-family`

Any `font-family: ...` in mockup CSS that does not include the CJK fallback chain breaks rendering for Chinese and Japanese content. Always reach through `var(--font-sans)`, `var(--font-serif)`, or `var(--font-mono)`.

```css
/* Wrong */
h1 { font-family: 'Charter', Georgia, serif; }

/* Right */
h1 { font-family: var(--font-serif); }
```

### Tiny body text

Body should never go below `text-sm` (14px). Tertiary metadata can go to `text-xs` (12px) but only when paired with high-contrast color (n-9, never n-7).

## Layout

### Hard drop shadows

```css
/* Wrong */
.card { box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

/* Right */
.card { box-shadow: 0 4px 24px rgba(0,0,0,0.05); }   /* whisper */
/* or */
.card { @apply ring-1 ring-border; }                 /* ring */
```

Hard shadows make any surface look like a generic SaaS card. Yohaku uses ring-or-whisper.

### Borderless on borderless

Two surfaces in the same tier (e.g., n-1 page bg behind n-2 card) need a border or whisper shadow to separate. Stacking n-2 on n-2 with no division produces an invisible card.

### Maxing out radius

`rounded-3xl` (24px) and beyond reads as decorative. Hero surfaces cap at `rounded-2xl` (16px). Forms, cards, buttons rarely exceed `rounded-lg` (8px).

## Components

### Reinventing existing ui/ primitives

Always check `references/components.md` and `apps/web/src/components/ui/` before writing a new dropdown, modal, or toast. Most surface needs already exist.

### Mixing Modal and Sheet on desktop

Sheets are for mobile (bottom edge, swipeable). Modals are the desktop equivalent. A "modal that slides up from the bottom on desktop" is design fan-fiction; pick one.

### Inline `style={{}}` for tokens

```tsx
// Wrong
<div style={{ color: '#242424', backgroundColor: '#f0f0f0' }}>...</div>

// Right
<div className="text-neutral-9 bg-neutral-2">...</div>
```

Inline styles bypass the contract and make audits harder. The verify script does not currently scan TSX files; reviewers must catch this.

## Process

### Skipping the cheatsheet

If you find yourself reaching for a hex value, a font name, or a spacing tier that doesn't appear in `CHEATSHEET.md`, stop. Either:
1. The need maps to an existing token you missed → re-read the cheatsheet.
2. The need is genuinely new → bring it up before introducing it; design system additions are a deliberate choice, not a side effect.

### Editing tokens.css to "make a class work"

`packages/design-system/src/tokens.css` is the canonical contract. Adding or changing values touches every consumer. Such edits need a spec change, not a one-off PR.
