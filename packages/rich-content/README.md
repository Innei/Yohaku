# @yohaku/rich-content

Shared Lexical rich-content rendering layer used across Yohaku Web and iOS apps.

## Architecture

`@yohaku/rich-content` owns the layout, semantic styling, and rendering logic for Lexical editor state. It is strictly platform-agnostic with zero `next/*`, `expo-*`, or `react-native*` dependencies.

Platform-specific behaviors (image viewers, link navigation, data fetching, interactive block overrides) are injected from the host application via `HostCapabilities`:

```tsx
import { HostProvider, createYohakuLexicalRenderer } from '@yohaku/rich-content'

const Renderer = createYohakuLexicalRenderer()

export function ArticleBody({ state, capabilities }) {
  return (
    <HostProvider value={capabilities}>
      <Renderer state={state} />
    </HostProvider>
  )
}
```

### Key Features

- **Platform-agnostic Host Contract**: Host injects link navigation, media viewers, and fetch mechanisms via `./host`.
- **Block-level Error Boundaries**: Rich business blocks (charts, maps, polls, embeds, etc.) are isolated individually so an error in one block does not degrade the entire document.
- **Shared Typography & Design Tokens**: Uses `@yohaku/design-system` for paper-like typography, theme-aware palette, and spacing.

## Exports

| Export | Description |
| ------ | ----------- |
| `@yohaku/rich-content/host` | `HostCapabilities` interface, `HostProvider`, and `useHost` hook |
| `@yohaku/rich-content/lexical` | `createYohakuLexicalRenderer` factory function |
| `@yohaku/rich-content/block-styles.css` | Yohaku semantic block styles |
| `@yohaku/rich-content/rich.css` | Compiled Tailwind CSS utility bundle (`dist/rich.css`) |

## Development

```bash
# Build Tailwind CSS bundle
pnpm build:css

# Run tests
pnpm test
```

## License

[MIT](./LICENSE), copyright Innei.
