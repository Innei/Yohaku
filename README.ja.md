<div align="center">

# 余白 / Yohaku

_余白も書くことの一部です。_

[公開サイト](https://innei.in) · [デザインシステム](https://yohaku.innei.dev) · [iOS ソース](https://github.com/Innei/Yohaku) · [Web アクセスを申請](https://github.com/sponsors/Innei)

[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

</div>

![MacBook Pro と iPhone 上の Yohaku クロスプラットフォーム読書体験](https://github.com/user-attachments/assets/41e668e2-cc06-443e-b2bc-a087bb5dd9f6)

Yohaku は、個人の執筆のためのクロスプラットフォーム出版プロダクトです。コンテンツのバックエンドに [mx-core](https://github.com/mx-space/core) を使い、Web と iOS で記事・手記・思考・タイムラインを同じかたちで見せます。インターフェースは後ろに下がり、文字とリズム、そして読むことそのものが主役になります。

完全な Web プロダクトは、初期のオープンソースフロントエンド [Shiro](https://github.com/Innei/Shiro) から発展し、いまはクローズドソースとして開発を続けています。このリポジトリでは iOS クライアントと Yohaku デザインシステムを公開しています。

> [!IMPORTANT]
> 現在の Web バージョンは **mx-core v12 以上** が必要です。mx-core v11 以前と互換にする場合は [`721bb617`](https://github.com/Innei-dev/Yohaku/commit/721bb617db0dd1571751dbdf01cc6dfe74defedf) を使ってください。

## プロダクト構成

| 層 | 役割 | 公開状態 |
| -- | ---- | -------- |
| **Web** | レスポンシブな個人サイト、長文の読書、完全なコンテンツ体験 | [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) でクローズドソースとして保守。公開インスタンスは [innei.in](https://innei.in) |
| **iOS** | 単一サイト向けのネイティブ読書クライアント。iOS 18 以上 | 本リポジトリ [`apps/mobile/`](./apps/mobile/) |
| **デザインシステム** | 色、書体、余白、モーション、テンプレート、AI Skill を束ねるデザイン契約 | [MIT オープンソース](./design-system) |
| **コンテンツサービス** | コンテンツ、コメント、認証、リアルタイムデータ | [mx-core](https://github.com/mx-space/core) ベース、v12 以上 |

## 読書体験

| 原則 | 現れ方 |
| ---- | ------ |
| **書くことを優先** | 記事、手記、思考、タイムラインはそれぞれ独自の物語のリズムを持ち、同じ情報カードに押し込められません。 |
| **紙面感** | ライトモードは紙に近い暖かなオフホワイト。ダークモードは暖かいグレーに沈みます。セリフの見出しと低密度の組版が本文に余白を残します。 |
| **抑制された操作** | アクセントは一色、ニュートラルは三段階。軽いフィードバックでインターフェースのノイズを下げます。 |
| **呼吸するモーション** | 内容は読書の進行とともに自然に展開します。初回訪問でリズムをつくり、再訪では余計な邪魔をしません。 |
| **クロスプラットフォーム** | Web と iOS はコンテンツモデルとリッチテキストのセマンティクスを共有しつつ、ブラウザとネイティブ、それぞれの操作に従います。 |

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
| Xcode | 実機 / シミュレータで iOS をビルドするときに必要 |

```bash
pnpm install
# apps/mobile/src/site-config.ts の publicSite を編集
pnpm --filter @yohaku/mobile start
pnpm --filter @yohaku/mobile ios   # macOS + Xcode
```

API の初期値は空、bundle id は `dev.yohaku.app`。生成された `ios/` はコミットしないでください。詳細は [`apps/mobile/README.en.md`](./apps/mobile/README.en.md)。

## アクセスを申請する

完全な Web 実装は引き続き [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) で保守されています。[GitHub Sponsors](https://github.com/sponsors/Innei) で該当するスポンサーを完了したあと、[Innei/Yohaku Issues](https://github.com/Innei/Yohaku/issues) に GitHub ユーザー名を書くか、メールでメンテナに連絡してください。手動でアクセス権を付与します。

## ライセンス

Copyright © 2026 Innei.

- `apps/mobile/` と `packages/rich-content/` は [MIT License](./apps/mobile/LICENSE)（Copyright Innei）です。
- `design-system/` 以下のコード（トークン、スクリプト、showcase、テンプレートなど）は [MIT License](./design-system/LICENSE) で公開しています。
- `packages/dom-webview/` は上流の Expo MIT を維持し、差分は [`VENDOR.md`](./packages/dom-webview/VENDOR.md) にあります。
- それ以外（README、スクリーンショット、対話アーカイブなど）は引き続き [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) です。
