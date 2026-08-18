<p align="center">
  <img alt="Yohaku app icon" src="./apps/mobile/assets/brand/app-icon.svg" width="96">
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/logo/wordmark-dark.svg">
    <img alt="余白 / Yohaku" src="./assets/logo/wordmark.svg" width="240">
  </picture>
</p>

<p align="center">
  <strong>iOS 18+</strong> · Expo · MIT · Android なし
</p>

**[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)**

> *余白も書くことの一部です。*

自分の [Mix Space](https://github.com/mx-space) サイト向けの **iOS リーダー**です。タブは四つ：記事、手記、思考、マイページ。本文の組版はウェブサイトと同じ契約です。オープンソース。[mx-core](https://github.com/mx-space/core) を指して、ローカルでコンパイルしてください。

マルチサイト製品ではありません。初回起動の「サイトを接続」フローはありません。

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

---

## クライアント

ソースは [`apps/mobile/`](./apps/mobile/)。動かし方は [README](./apps/mobile/README.en.md)。

| Tab | 中身 |
|-----|------|
| **記事** | 記事一覧、ピン留め、シリーズ |
| **手記** | 手記タイムライン、シリーズのアーカイブ |
| **思考** | 短い思考のタイムライン |
| **マイページ** | ログイン、いいね、読書履歴、コメント、言語、プッシュ |

ほかに、アプリ内コメントといいね、サイトと同じ Lexical 本文、ローカル SQLite 同期、読み上げ、要約と関連読書。iOS 26 で Liquid Glass が使えるときはシステム Tab、それ以外は紙面の Tab バーです。

---

## 動かす

```bash
pnpm install
# apps/mobile/src/site-config.ts の publicSite を自分の mx-core に向ける
pnpm --filter @yohaku/mobile start
pnpm --filter @yohaku/mobile ios   # macOS + Xcode
```

公開デフォルトは空の API URL と bundle id `dev.yohaku.app` です。`expo run:ios` は gitignored の `ios/` を生成します。詳細は [`apps/mobile/README.en.md`](./apps/mobile/README.en.md)。

---

## デザインシステム

クライアントが使っている組版契約もこのリポジトリにあります。アクセントは一色、ニュートラルは三段階、それ以外はすべて余白。ウェブプレビュー、トークン、テンプレート、AI skill は [`design-system/README.md`](./design-system/README.md)。ライブ showcase は [yohaku.innei.dev](https://yohaku.innei.dev)。

---

## 完全実装 · クローズドソースリポジトリ

ウェブサイト本体は引き続き [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) でクローズドソースとして維持されており、[Shiro](https://github.com/Innei/Shiro) をベースに深く再構築されています。スポンサーモデルは変わりません。

**スポンサーになるとプライベートリポジトリへのアクセスが得られます。**

[![Sponsor](https://img.shields.io/badge/Sponsor-Innei-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Innei)

[github.com/sponsors/Innei](https://github.com/sponsors/Innei) でスポンサー登録後、[Issue](https://github.com/Innei/Yohaku/issues) またはメールで GitHub ユーザー名をお知らせください——手動でアクセス権を追加します。

---

## 関連プロジェクト

- [mx-space/core](https://github.com/mx-space/core) — クライアントが接続するバックエンド API
- [Shiro](https://github.com/Innei/Shiro) — オープンソースの前身、Next.js 個人ブログシステム
- [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) — 完全なクローズドソース実装（スポンサーでアクセス可能）

---

## ライセンス

2026 Innei.

- `apps/mobile/` と `packages/rich-content/` は [MIT License](./apps/mobile/LICENSE)（Copyright Innei）です。
- `design-system/` 以下のコード（トークン、スクリプト、showcase、テンプレートなど）は [MIT License](./design-system/LICENSE) で公開しています。
- `packages/dom-webview/` は上流の Expo MIT を維持し、差分は [`VENDOR.md`](./packages/dom-webview/VENDOR.md) にあります。
- それ以外（README、スクリーンショット、対話アーカイブなど）は引き続き [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) です。
