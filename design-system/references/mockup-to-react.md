# Mockup → React Handoff

A standalone HTML mockup uses Yohaku tokens but plain HTML markup. When the design lands and we move to production code, every mockup pattern has a target React component (or token-bearing Tailwind class).

This file is the translation table.

## General rules

1. **Replace structure first, styling second.** The mockup's class names already use tokens; if you keep the same Tailwind classes, visual fidelity is automatic.
2. **Never introduce new tokens during handoff.** If a token is missing, fix the mockup first to use an existing one.
3. **Reuse `apps/web/src/components/ui/*` aggressively.** Most mockup snippets map to one or two existing primitives.
4. Run `pnpm --filter @yohaku/web lint` on the changed files only — never on the whole project.

## Mapping table

| Mockup pattern | Target React |
|---|---|
| `<button class="bg-accent text-white rounded-md">` | `<Button variant="primary">` from `~/components/ui/button` |
| `<button class="bg-neutral-2 ring-1 ring-border">` | `<Button variant="secondary">` |
| `<button class="hover:bg-neutral-2">` (no fill) | `<Button variant="ghost">` |
| `<a class="text-accent underline">` | `<Link>` from `~/components/ui/link` (handles hover preview, internal/external) |
| `<span class="bg-neutral-2 text-neutral-7 text-xs px-2 py-0.5 rounded-md">` | `<Tag>` from `~/components/ui/tag` |
| `<h1 class="text-3xl font-medium text-neutral-10">` | `<Text.Heading level={1}>` from `~/components/ui/text` (or `<Heading>` from `ui/typography`) |
| `<p class="text-lg text-neutral-7">` (lead) | `<Text.Lead>` |
| `<p class="text-neutral-9">` (body) | plain `<p>`; default body color via `prose` or rely on inherited n-9 |
| `<div class="bg-neutral-2 ring-1 ring-border rounded-lg p-4">` (card) | compose with `<div>` + Tailwind, or use a content-specific primitive (e.g., `link-card` for URL previews) |
| `<dialog class="...">` (mockup confirm) | `<Dialog>` from `~/components/ui/dialog` |
| `<div class="modal-overlay ...">` (mockup full-screen) | `<Modal>` from `~/components/ui/modal` |
| `<div class="sheet ...">` (mockup bottom sheet) | `<Sheet>` from `~/components/ui/sheet` |
| `<details>` (mockup) | `<Collapse>` from `~/components/ui/collapse` |
| `<input>` (mockup form) | `<Input>` from `~/components/ui/input` |
| `<select>` (mockup) | `<Select>` from `~/components/ui/select` |
| `<input type="checkbox">` (mockup) | `<Checkbox>` from `~/components/ui/checkbox` |
| `<input type="radio">` | `<input class="radio">` (the `@utility radio` is defined in `apps/web/src/styles/tailwindcss.css`) |
| `<label>` | `<Label>` from `~/components/ui/label` |
| `<pre><code>...</code></pre>` (mockup) | `<CodeHighlighter>` from `~/components/ui/code-highlighter` for read-only; `<CodeEditor>` for editable |
| Avatar `<img class="rounded-full">` | `<Avatar>` from `~/components/ui/avatar` |
| Time `2 hours ago` static text | `<RelativeTime date={...}>` from `~/components/ui/relative-time` |
| Loading dots / spinner | `<Spinner>` or `<Loading>` |
| Toast / banner | `<Toast>` (transient) or `<Banner>` (persistent) |

## Handoff steps

1. Open the mockup HTML file and the target React file (or create the target file) side by side.
2. Walk the mockup top-to-bottom. For each block:
   - Identify the pattern in the mapping table.
   - Replace the markup with the React component invocation.
   - Carry over any class names that are not absorbed by the component (e.g., positioning, gap, layout).
3. Replace any inline `<style>` blocks. If the mockup carried component-level CSS, fold it into the React component or its sibling `.css.ts` file using existing tokens.
4. Hook up data: replace mockup placeholder text with props or content from the queries layer (`apps/web/src/queries/`).
5. Verify locally (`pnpm --filter @yohaku/web dev`), then run lint on changed files only.

## When the mapping table is silent

If a mockup pattern has no entry above, do **not** invent a new ui/ primitive on the spot. Ask:

1. Is this really new, or did I miss an existing primitive?
2. Is it a one-off composition (e.g., a special hero layout that should live in `apps/web/src/components/modules/` rather than `ui/`)?
3. If a new ui/ primitive is genuinely needed, escalate to the user before writing.

Most "new" patterns are compositions, not primitives.
