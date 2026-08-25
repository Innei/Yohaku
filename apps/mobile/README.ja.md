# @yohaku/mobile

**[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)**

自分の [Mix Space](https://github.com/mx-space) サイト用 iOS クライアント。iOS 18 以上、Android はありません。

App Store で配信している Yohaku はこのコードからビルドされています。MIT なので、自分のサイトに設定を変更し、自分の Apple Developer アカウントで App Store に配信できます。

<div align="center">
  <img src="../../assets/preview-ios-home.png" width="23%" alt="Home" />
  <img src="../../assets/preview-ios-post.png" width="23%" alt="Post" />
  <img src="../../assets/preview-ios-notes.png" width="23%" alt="Notes" />
  <img src="../../assets/preview-ios-thinking.png" width="23%" alt="Thinking" />
</div>

## 設定

[`src/site-config.ts`](./src/site-config.ts) の `publicSite` を編集します。リポジトリ内の初期状態では API は空です：

```typescript
// src/site-config.ts
export const publicSite: SiteConfig = {
  apiUrl: 'https://api.example.com', // mx-core の API アドレス
  siteUrl: 'https://example.com',    // サイトの URL
  siteHosts: ['example.com'],        // 許可するホスト名
  bundleId: 'dev.yohaku.app',        // Bundle ID
  scheme: 'yohaku',                  // URL Scheme
  privacyUrl: '',                    // プライバシーポリシー（空の場合は ${siteUrl}/privacy）
  bundledOwner: null,
}
```

[`src/site.ts`](./src/site.ts) は変更不要です。

## 実行

環境要件：macOS、Xcode 16+、iOS 18+（シミュレータまたは実機）。

リポジトリのルートディレクトリから：

```bash
pnpm install
pnpm --filter @yohaku/mobile start
```

Xcode でビルド・実行：

```bash
pnpm --filter @yohaku/mobile ios
```

`ios/` ディレクトリが生成されます（このディレクトリは gitignore されています）。

## 自分で App Store に出す

1. bundle id と scheme の変更：`src/site-config.ts` と [`app.config.ts`](./app.config.ts) 冒頭の `PUBLIC_BUNDLE_ID` / `PUBLIC_SCHEME` を一致させます。アプリ名は `app.config.ts` の `name` です。
2. アイコンの差し替え：`assets/images/icon.png`、`assets/expo.icon`。
3. Apple Developer ポータルでこの App ID の Push Notifications を有効化：entitlements に `aps-environment` が含まれているため、有効化しないと署名に失敗します。
4. `pnpm --filter @yohaku/mobile ios` で `ios/` を生成し、Xcode で中の `.xcworkspace` を開いて Archive → Distribute App。

プッシュ通知機能には自前の APNs 中継サーバーが必要ですが、本リポジトリには含まれていません。設定しなくても他の機能に影響はありません。

## ライセンス

[MIT](./LICENSE)、Copyright Innei。
