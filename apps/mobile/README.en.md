# @yohaku/mobile

**[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)**

iOS client for a personal [Mix Space](https://github.com/mx-space) blog. iOS 18+, no Android.

Yohaku on the App Store is built from this source. It's MIT, so you can point it at your own site and ship it under your own Apple Developer account.

<div align="center">
  <img src="../../assets/preview-ios-home.png" width="23%" alt="Home" />
  <img src="../../assets/preview-ios-post.png" width="23%" alt="Post" />
  <img src="../../assets/preview-ios-notes.png" width="23%" alt="Notes" />
  <img src="../../assets/preview-ios-thinking.png" width="23%" alt="Thinking" />
</div>

## Config

Edit `publicSite` in [`src/site-config.ts`](./src/site-config.ts). The repository default has an empty API URL:

```typescript
// src/site-config.ts
export const publicSite: SiteConfig = {
  apiUrl: 'https://api.example.com', // your mx-core API URL
  siteUrl: 'https://example.com',    // your site URL
  siteHosts: ['example.com'],        // allowed site hostnames
  bundleId: 'dev.yohaku.app',        // your Bundle ID
  scheme: 'yohaku',                  // URL Scheme
  privacyUrl: '',                    // privacy policy (defaults to ${siteUrl}/privacy if empty)
  bundledOwner: null,
}
```

Leave [`src/site.ts`](./src/site.ts) alone.

## Run

Requirements: macOS, Xcode 16+, iOS 18+ (Simulator or physical device).

From the repo root:

```bash
pnpm install
pnpm --filter @yohaku/mobile start
```

With Xcode:

```bash
pnpm --filter @yohaku/mobile ios
```

This generates the native `ios/` project directory (gitignored).

## Ship it

1. Change the bundle id and scheme: `src/site-config.ts` and `PUBLIC_BUNDLE_ID` / `PUBLIC_SCHEME` at the top of [`app.config.ts`](./app.config.ts) have to match. The app name is `name` in `app.config.ts`.
2. Replace the icons: `assets/images/icon.png` and `assets/expo.icon`.
3. Enable Push Notifications for that App ID in the developer portal. The entitlements carry `aps-environment`, and signing fails without it.
4. Run `pnpm --filter @yohaku/mobile ios` to generate `ios/`, open the `.xcworkspace` in Xcode, then Archive → Distribute App.

Push also needs a self-hosted APNs relay, which isn't in this repo. Nothing else depends on it.

## License

[MIT](./LICENSE), copyright Innei.
