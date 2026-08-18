<p align="center">
  <img alt="Yohaku app icon" src="./apps/mobile/assets/brand/app-icon.svg" width="96">
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/logo/wordmark-dark.svg">
    <img alt="余白 / Yohaku" src="./assets/logo/wordmark.svg" width="240">
  </picture>
</p>

**[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)**

> *The blank space is part of the writing.*

Yohaku is the iOS app I use to read my own blog. It's open source now. Posts, notes, thoughts. Same typesetting as the site. Point `publicSite` at your [mx-core](https://github.com/mx-space/core) and build. One site. iOS 18+, no Android.

<table>
  <tr>
    <td align="center"><img src="./assets/preview-ios-home.png" alt="Posts" width="260"><br>Posts</td>
    <td align="center"><img src="./assets/preview-ios-notes.png" alt="Notes" width="260"><br>Notes</td>
  </tr>
  <tr>
    <td align="center"><img src="./assets/preview-ios-post.png" alt="Article" width="260"><br>Article</td>
    <td align="center"><img src="./assets/preview-ios-thinking.png" alt="Thoughts" width="260"><br>Thoughts</td>
  </tr>
</table>

Code is in [`apps/mobile/`](./apps/mobile/).

## Setup

```bash
pnpm install
# edit publicSite in apps/mobile/src/site-config.ts
pnpm --filter @yohaku/mobile start
pnpm --filter @yohaku/mobile ios   # macOS + Xcode
```

API URL starts empty; bundle id is `dev.yohaku.app`. Don't commit the generated `ios/` folder. More in [`apps/mobile/README.en.md`](./apps/mobile/README.en.md).

## Design system

The type system lives here too: one accent, three greys, the rest is leftover space. [`design-system/README.md`](./design-system/README.md) · [yohaku.innei.dev](https://yohaku.innei.dev)

## The website

The web app is still private: [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku), rebuilt from [Shiro](https://github.com/Innei/Shiro). Sponsor and I'll add you.

[![Sponsor](https://img.shields.io/badge/Sponsor-Innei-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Innei)

After [github.com/sponsors/Innei](https://github.com/sponsors/Innei), open an [Issue](https://github.com/Innei/Yohaku/issues) or email me your GitHub username.

## License

2026 Innei.

- `apps/mobile/` and `packages/rich-content/` are [MIT](./apps/mobile/LICENSE), copyright Innei.
- Code under `design-system/` (tokens, scripts, showcase, templates) is released under the [MIT License](./design-system/LICENSE).
- `packages/dom-webview/` keeps the upstream Expo MIT license; see [`VENDOR.md`](./packages/dom-webview/VENDOR.md) for the local changes.
- The rest of the repository (README, screenshots, chat archives, etc.) remains under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
