# @yohaku/design-system

Yohaku 设计系统 · static design contract for the Yohaku monorepo.

## What lives here

- `src/tokens.css` — canonical color/typography/spacing tokens (Tailwind v4 `@theme`)
- `SKILL.md` — Claude Code routing rules
- `CHEATSHEET.md` — one-page quick reference
- `references/` — full specs (tokens, components, anti-patterns, mockup-to-react)
- `templates/` — HTML scaffold + section snippets for mockups

## Consumers

- `apps/web` imports `@yohaku/design-system/tokens.css` from its main Tailwind entry.
- AI agents read `SKILL.md` + `CHEATSHEET.md` + `references/` to produce mockups and React components.

## Verify

```bash
pnpm --filter @yohaku/design-system check
```

Lints token drift between `CHEATSHEET.md` and `src/tokens.css`, plus forbidden patterns in `templates/`.

## License

MIT — see `LICENSE`. The repository's prose, screenshots, and chat archives outside this directory remain under CC BY-NC-SA 4.0.
