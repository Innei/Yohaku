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

> *余白も書くことの一部です。*

Yohaku は、自分のブログを読むための iOS アプリです。オープンソースになりました。記事・手記・思考。組版はサイトと同じ。`publicSite` を自分の [mx-core](https://github.com/mx-space/core) に向けてビルドしてください。サイトは一つだけ。iOS 18 以上。Android はありません。

<table>
  <tr>
    <td align="center"><img src="./assets/preview-ios-home.png" alt="記事" width="260"><br>記事</td>
    <td align="center"><img src="./assets/preview-ios-notes.png" alt="手記" width="260"><br>手記</td>
  </tr>
  <tr>
    <td align="center"><img src="./assets/preview-ios-post.png" alt="本文" width="260"><br>本文</td>
    <td align="center"><img src="./assets/preview-ios-thinking.png" alt="思考" width="260"><br>思考</td>
  </tr>
</table>

ソースは [`apps/mobile/`](./apps/mobile/)。

## 使い方

```bash
pnpm install
# apps/mobile/src/site-config.ts の publicSite を編集
pnpm --filter @yohaku/mobile start
pnpm --filter @yohaku/mobile ios   # macOS + Xcode
```

API の初期値は空、bundle id は `dev.yohaku.app`。生成された `ios/` はコミットしないでください。詳細は [`apps/mobile/README.en.md`](./apps/mobile/README.en.md)。

## デザインシステム

組版のほうもここにあります。アクセント一色、グレー三段階、あとは余白。[`design-system/README.md`](./design-system/README.md) · [yohaku.innei.dev](https://yohaku.innei.dev)

## ウェブサイト

Web 版はまだプライベートです。[Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku)。[Shiro](https://github.com/Innei/Shiro) から作り直したもの。スポンサーになると入れます。

[![Sponsor](https://img.shields.io/badge/Sponsor-Innei-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Innei)

[github.com/sponsors/Innei](https://github.com/sponsors/Innei) のあと、[Issue](https://github.com/Innei/Yohaku/issues) かメールで GitHub ユーザー名をください。手動で追加します。

## ライセンス

2026 Innei.

- `apps/mobile/` と `packages/rich-content/` は [MIT License](./apps/mobile/LICENSE)（Copyright Innei）です。
- `design-system/` 以下のコード（トークン、スクリプト、showcase、テンプレートなど）は [MIT License](./design-system/LICENSE) で公開しています。
- `packages/dom-webview/` は上流の Expo MIT を維持し、差分は [`VENDOR.md`](./packages/dom-webview/VENDOR.md) にあります。
- それ以外（README、スクリーンショット、対話アーカイブなど）は引き続き [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) です。
