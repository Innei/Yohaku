---
name: yohaku-design
description: 'Build new Yohaku-style UI: HTML mockups, React components, or mockup→React handoff. Triggers on "make a Yohaku mockup / design a new component / add a hero / modal / sheet / convert mockup to React / audit token compliance / 做一个 Yohaku 风的 mockup / 设计一个新组件 / mockup 转 React / 检查 token 合规".'
---

# yohaku-design

The Yohaku design system: static tokens, component catalog, and section snippets for the Yohaku personal blog. Adapts the Kami constraint-system shape to a webapp context.

## Step 1 · Identify the task

| User says | Task tier | Read |
|---|---|---|
| "make a mockup for X" / "design a new hero / modal / sheet" / "做一个 mockup" | **New mockup** | `CHEATSHEET.md` + `references/tokens.md` + `references/anti-patterns.md` |
| "build component X" / "I need a new Button variant" / "新组件" | **New React component** | `CHEATSHEET.md` + `references/components.md` + `references/anti-patterns.md` |
| "convert this mockup to React" / "mockup 转 React" / "implement this design" | **Handoff** | `references/mockup-to-react.md` + `references/components.md` |
| "audit this file for token compliance" / "is this color right?" / "检查 token 合规" | **Token audit** | `references/anti-patterns.md` + `references/tokens.md` |
| "what size for this text?" / "字号" / "audit typography" / "migrate hardcoded text-[Npx]" | **Type audit** | `references/typography.md` + `CHEATSHEET.md` § Type scale |

If unsure, ask one short question instead of guessing.

## Step 2 · Produce

### New mockup
1. Copy `templates/scaffold.html` to `docs/superpowers/plans/<topic>-mockup.html` (or wherever the user wants).
2. Pick relevant pieces from `templates/snippets/` (hero, list-card, modal, sheet, form, code-block, stat-grid, comment-thread). Copy and adapt.
3. Use only token classes / vars listed in `CHEATSHEET.md`. No raw hex except inside `<style>` blocks where contract applies.
4. Open the file in a browser to verify before declaring done.

### New React component
1. **First** check `references/components.md` and `apps/web/src/components/ui/` to confirm the primitive does not already exist. Reuse beats reinvent.
2. If a new ui/ entry is needed, follow the patterns in `components.md` (file structure, exports, Tailwind variants).
3. Use only the tokens listed in `CHEATSHEET.md`. Never reach for `text-neutral-50…950`.
4. Run `pnpm --filter @yohaku/web lint` on changed files only (do not lint the whole project).

### Handoff
1. Open the mockup HTML and `references/mockup-to-react.md` side by side.
2. Walk the mapping table top-to-bottom: every HTML class / pattern has a target React component or Tailwind class.
3. Replace structure first, styling second. Do not introduce new tokens during handoff.
4. Run `pnpm --filter @yohaku/web lint` on the changed files.

### Token audit
1. Read `references/anti-patterns.md`.
2. Scan the target file for: `text-neutral-50/100/200/.../950`, raw hex literals, `n-5` used as text, hardcoded `font-family`, synthetic `font-weight: bold` on Chinese text.
3. Report a punch list with line numbers and proposed replacements.

## Step 3 · Verify

```bash
pnpm --filter @yohaku/design-system check
```

Lints token drift between the cheatsheet and `src/tokens.css`, plus forbidden patterns in `templates/`. Run before committing changes inside `packages/design-system/`.

## When NOT to use this skill

- Editing application logic, routes, queries, hooks — this skill is design-only.
- Producing PDF / slides / marketing pages — Yohaku is a webapp, use Kami for static documents.
- Restyling `@haklex/*` packages — those have their own `rich-style-token` system.
- Modifying `apps/web/src/styles/yohaku.css` runtime injection — that is application owned, not design contract.

## Languages

This skill, the cheatsheet, and references are English. The web app and its content are Chinese-first. Do not translate the contract docs.
