<div align="center">

# 余白 / Yohaku

_余白も書くことの一部です。_

[公開サイト](https://innei.in) · [デザインシステム](https://yohaku.innei.dev) · [iOS ソース](https://github.com/Innei/Yohaku) · [Web アクセスを申請](https://github.com/sponsors/Innei)

[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

</div>

![MacBook Pro と iPhone 上の Yohaku クロスプラットフォーム読書体験](https://github.com/user-attachments/assets/885c27d6-b869-4785-9e73-00b3f6809b4e)

Yohaku は、個人の執筆のためのクロスプラットフォーム出版プロダクトです。コンテンツのバックエンドに [mx-core](https://github.com/mx-space/core) を使い、Web と iOS で記事・手記・思考・タイムラインを同じかたちで見せます。インターフェースは後ろに下がり、文字とリズム、そして読むことそのものが主役になります。

完全な Web プロダクトは、初期のオープンソースフロントエンド [Shiro](https://github.com/Innei/Shiro) から発展し、いまはクローズドソースとして開発を続けています。このリポジトリでは iOS クライアントと Yohaku デザインシステムを公開しています。

**ここにあるのは App Store で配信している Yohaku iOS アプリそのもののソース**で、MIT で公開しています。自分の mx-core を指定し、bundle id とアイコンを差し替えれば、自分の Apple Developer アカウントでビルドして、自分のアプリとして App Store に出せます。追加の許諾は要りません。

> [!IMPORTANT]
> 現在の Web バージョンは **mx-core v12 以上** が必要です。mx-core v11 以前と互換にする場合は [`721bb617`](https://github.com/Innei-dev/Yohaku/commit/721bb617db0dd1571751dbdf01cc6dfe74defedf) を使ってください。

## プロダクト構成

| 層 | 役割 | 公開状態 |
| -- | ---- | -------- |
| **Web** | レスポンシブな個人サイト、長文の読書、完全なコンテンツ体験 | [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) でクローズドソースとして保守。公開インスタンスは [innei.in](https://innei.in) |
| **iOS** | 単一サイト向けのネイティブ読書クライアント。iOS 18 以上 | 本リポジトリ [`apps/mobile/`](./apps/mobile/)。[MIT](./apps/mobile/LICENSE) で、自分でビルドして配信できます |
| **デザインシステム** | 色、書体、余白、モーション、テンプレート、Claude Code / Cursor 向けの [AI Skill 契約](./design-system/SKILL.md) | [MIT オープンソース](./design-system) |
| **コンテンツサービス** | コンテンツ、コメント、認証、リアルタイムデータ | [mx-core](https://github.com/mx-space/core) ベース、v12 以上 |

## 読書体験

| 原則 | 現れ方 |
| ---- | ------ |
| **書くことを優先** | 記事、手記、思考、タイムラインはそれぞれ独自の物語のリズムを持ち、同じ情報カードに押し込められません。 |
| **紙面感** | ライトモードは紙に近い暖かなオフホワイト。ダークモードは暖かいグレーに沈みます。セリフの見出しと低密度の組版が本文に余白を残します。 |
| **抑制された操作** | アクセントは一色、ニュートラルは三段階。軽いフィードバックでインターフェースのノイズを下げます。 |
| **呼吸するモーション** | 内容は読書の進行とともに自然に展開します。初回訪問でリズムをつくり、再訪では余計な邪魔をしません。 |
| **クロスプラットフォーム** | Web と iOS はコンテンツモデルとリッチテキストのセマンティクスを共有しつつ、ブラウザとネイティブ、それぞれの操作に従います。 |

<div align="center">
  <img src="./assets/preview-ios-home.png" width="23%" alt="Home" />
  <img src="./assets/preview-ios-post.png" width="23%" alt="Post" />
  <img src="./assets/preview-ios-notes.png" width="23%" alt="Notes" />
  <img src="./assets/preview-ios-thinking.png" width="23%" alt="Thinking" />
</div>

## リポジトリの境界

```text
Yohaku
├── apps/mobile              iOS クライアント
├── design-system            デザインシステム
├── packages/rich-content    クロスプラットフォームのリッチテキスト
└── packages/dom-webview     Expo DOM WebView アダプタ
```

完全な Web 実装は引き続き [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) で保守されています。このリポジトリは iOS クライアント、デザインシステム、クロスプラットフォームのレンダリングパッケージだけを公開します。

> [!NOTE]
> Yohaku は前世代のプロジェクト [Shiroi](https://github.com/innei-dev/Shiroi) と完全に分離しています。両者のリポジトリアクセスとスポンサー関係は互いに独立です。

## ローカルで動かす

| 要件 | バージョン |
| ---- | ---------- |
| Node.js | 22 以上 |
| pnpm | 11.20.0 |
| mx-core | 12 以上 |
| Xcode | 実機 / シミュレータで iOS をビルドするときに必要（Xcode 16+ 推奨） |

### 1. デザインシステムの Showcase とサンプル

```bash
pnpm install
pnpm dev             # デザインシステムの Showcase を起動 (http://localhost:5173)
pnpm demo:pdf        # 長文、履歴書、ワンページレポートの PDF デモを生成
pnpm check           # トークンの不整合とテンプレートのリントを検証
```

### 2. iOS クライアントを起動

```bash
# apps/mobile/src/site-config.ts の publicSite を編集
pnpm --filter @yohaku/mobile start
pnpm --filter @yohaku/mobile ios   # macOS + Xcode
```

API の初期値は空、bundle id は `dev.yohaku.app`。生成された `ios/` はコミットしないでください。詳細は [`apps/mobile/README.ja.md`](./apps/mobile/README.ja.md)。

## 自分で App Store に出す

`apps/mobile/` は MIT なので、自分の Apple Developer アカウントで自分のアプリとして App Store に出せます。追加の許諾は不要です。変更するところ：

1. `apps/mobile/src/site-config.ts`：`apiUrl` と `siteUrl` を自分の mx-core とサイトに向ける。
2. bundle id と scheme：`src/site-config.ts` の `bundleId` / `scheme` と、`app.config.ts` 冒頭の `PUBLIC_BUNDLE_ID` / `PUBLIC_SCHEME` を揃える。アプリ名は `app.config.ts` の `name`。
3. アイコン：`assets/images/icon.png` と `assets/expo.icon`。
4. Developer ポータルでその App ID の Push Notifications を有効にする。entitlements に `aps-environment` があるため、揃っていないと署名に失敗します。
5. `pnpm --filter @yohaku/mobile ios` で `ios/` を生成し、その中の `.xcworkspace` を Xcode で開いて Archive → Distribute App。

プッシュ自体には自前の APNs 中継サービスが別途必要で、これはこのリポジトリには含まれません。設定しなくても他の機能には影響しません。

## アクセスを申請する

完全な Web 実装は引き続き [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) で保守されています。[GitHub Sponsors](https://github.com/sponsors/Innei) で該当するスポンサーを完了したあと、[Innei/Yohaku Issues](https://github.com/Innei/Yohaku/issues) に GitHub ユーザー名を書くか、メールでメンテナに連絡してください。手動でアクセス権を付与します。

## ライセンス

Copyright © 2026 Innei.

- `apps/mobile/` と `packages/rich-content/` は [MIT License](./apps/mobile/LICENSE)（Copyright Innei）です。
- `design-system/` 以下のコード（トークン、スクリプト、showcase、テンプレートなど）は [MIT License](./design-system/LICENSE) で公開しています。
- `packages/dom-webview/` は上流の Expo MIT を維持し、差分は [`VENDOR.md`](./packages/dom-webview/VENDOR.md) にあります。
- それ以外（README、スクリーンショット、対話アーカイブなど）は引き続き [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) です。
