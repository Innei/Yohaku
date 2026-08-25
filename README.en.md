<div align="center">

# 余白 / Yohaku

_The blank space is part of the writing._

[Live site](https://innei.in) · [Design system](https://yohaku.innei.dev) · [iOS source](https://github.com/Innei/Yohaku) · [Request web access](https://github.com/sponsors/Innei)

[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

</div>

![Yohaku reading experience on a MacBook Pro and iPhone](https://github.com/user-attachments/assets/43b99d28-354a-483b-8572-5da7ef0dbbe7)

Yohaku is a cross-platform publishing product for personal writing. It uses [mx-core](https://github.com/mx-space/core) as the content backend, and presents posts, notes, thoughts, and a timeline as one experience on Web and iOS. The interface recedes so that text, rhythm, and reading itself stay in front.

The full web product evolved from the earlier open-source frontend [Shiro](https://github.com/Innei/Shiro), and is now developed as a closed-source project. This repository publishes the iOS client and the Yohaku design system.

**This is the complete source of the Yohaku iOS app that ships on the App Store**, released under MIT. Point it at your own mx-core, swap the bundle id and the icons, and you can build it with your own Apple Developer account and publish it to the App Store as your own app. No extra permission needed.

> [!IMPORTANT]
> The current web version requires **mx-core v12 or later**. For mx-core v11 and earlier, use [`721bb617`](https://github.com/Innei-dev/Yohaku/commit/721bb617db0dd1571751dbdf01cc6dfe74defedf).

## Product layers

| Layer | Role | Availability |
| ----- | ---- | ------------ |
| **Web** | Responsive personal site, long-form reading, and the full content experience | Closed source at [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku); live instance at [innei.in](https://innei.in) |
| **iOS** | Native reading client for a single site, iOS 18 or later | This repository, [`apps/mobile/`](./apps/mobile/) — [MIT](./apps/mobile/LICENSE), build and ship it yourself |
| **Design system** | Shared design contract for color, type, spacing, motion, templates, and the [AI Skill contract](./design-system/SKILL.md) for Claude Code / Cursor | [MIT, open source](./design-system) |
| **Content service** | Content, comments, auth, and realtime data | Built on [mx-core](https://github.com/mx-space/core), v12 or later |

## Reading experience

| Principle | What it looks like |
| --------- | ------------------ |
| **Writing first** | Posts, notes, thoughts, and timeline each keep their own narrative rhythm instead of being flattened into the same information card. |
| **Paper feel** | Light mode sits near the warm off-white of paper; dark mode settles into warm grey. Serif titles and low-density typesetting leave room for the body. |
| **Quiet interaction** | One accent, three neutral levels, and light feedback keep interface noise down. |
| **Breathing motion** | Content unfolds with the reading process. The first visit sets the rhythm; return visits do not add extra interruption. |
| **Cross-platform** | Web and iOS share the content model and rich-text semantics, while each follows the interaction of its platform — browser or native. |

<div align="center">
  <img src="./assets/preview-ios-home.png" width="23%" alt="Home" />
  <img src="./assets/preview-ios-post.png" width="23%" alt="Post" />
  <img src="./assets/preview-ios-notes.png" width="23%" alt="Notes" />
  <img src="./assets/preview-ios-thinking.png" width="23%" alt="Thinking" />
</div>

## Repository boundary

```text
Yohaku
├── apps/mobile              iOS client
├── design-system            Design system
├── packages/rich-content    Cross-platform rich text
└── packages/dom-webview     Expo DOM WebView adapter
```

The full web implementation continues in [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku). This repository only publishes the iOS client, the design system, and the cross-platform rendering packages.

> [!NOTE]
> Yohaku is fully separate from the previous-generation project [Shiroi](https://github.com/innei-dev/Shiroi). Repository access and sponsorship for the two are independent.

## Run locally

| Requirement | Version |
| ----------- | ------- |
| Node.js | 22 or later |
| pnpm | 11.20.0 |
| mx-core | 12 or later |
| Xcode | Required to build iOS for a device or simulator (Xcode 16+ recommended) |

### 1. Design system showcase and samples

```bash
pnpm install
pnpm dev             # start design system showcase (http://localhost:5173)
pnpm demo:pdf        # render demo essay, résumé, and report to PDF
pnpm check           # verify token drift and template lint
```

### 2. Run iOS client

```bash
# edit publicSite in apps/mobile/src/site-config.ts
pnpm --filter @yohaku/mobile start
pnpm --filter @yohaku/mobile ios   # macOS + Xcode
```

API URL starts empty; bundle id is `dev.yohaku.app`. Don't commit the generated `ios/` folder. More in [`apps/mobile/README.en.md`](./apps/mobile/README.en.md).

## Ship your own build to the App Store

`apps/mobile/` is MIT, so you may publish it to the App Store as your own app under your own Apple Developer account, with no extra permission. What to change:

1. `apps/mobile/src/site-config.ts`: point `apiUrl` and `siteUrl` at your own mx-core and site.
2. Bundle id and scheme: `bundleId` / `scheme` in `src/site-config.ts` must match `PUBLIC_BUNDLE_ID` / `PUBLIC_SCHEME` at the top of `app.config.ts`. The app name is `name` in `app.config.ts`.
3. Icons: `assets/images/icon.png` and `assets/expo.icon`.
4. Enable Push Notifications for that App ID in the developer portal — the entitlements include `aps-environment`, and signing fails if it isn't there.
5. Run `pnpm --filter @yohaku/mobile ios` to generate `ios/`, then open the `.xcworkspace` inside it and use Archive → Distribute App.

Push itself also needs a self-hosted APNs relay, which is not part of this repository. Skipping it leaves the rest of the app unaffected.

## Request access

The full web implementation continues in [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku). After the corresponding [GitHub Sponsors](https://github.com/sponsors/Innei) pledge, open an issue on [Innei/Yohaku Issues](https://github.com/Innei/Yohaku/issues) with your GitHub username, or email the maintainer, so access can be granted manually.

## License

Copyright © 2026 Innei.

- `apps/mobile/` and `packages/rich-content/` are [MIT](./apps/mobile/LICENSE), copyright Innei.
- Code under `design-system/` (tokens, scripts, showcase, templates) is released under the [MIT License](./design-system/LICENSE).
- `packages/dom-webview/` keeps the upstream Expo MIT license; see [`VENDOR.md`](./packages/dom-webview/VENDOR.md) for the local changes.
- The rest of the repository (README, screenshots, chat archives, etc.) remains under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
