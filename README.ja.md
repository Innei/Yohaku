# 余白 / Yohaku

**[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)**

> *余白も書くことの一部です。*

**余白**——意図的に空けられた空間。埋められた部分より、空いた部分こそが重さを持つ。

これは**書くことのために設計された組版システム**です。アクセントは一色、ニュートラルは三段階、それ以外はすべて余白。ウェブ、長文、手紙、レポート——文字が宿る場所ならどこでも使えます。

- ライブ showcase: **[yohaku.innei.dev](https://yohaku.innei.dev)**
- デザイン契約（トークン、テンプレート、AI skill）は [`design-system/`](./design-system/) にあり、MIT ライセンスで公開しています。
- 下のスクリーンショットは、このシステムが [Yohaku 個人サイト](https://github.com/Innei-dev/Yohaku) 上で形になった姿です。

> 各プレビューは対角線で分割されています——左上がライト、右下がダーク。

![プレビュー - ホーム](./assets/preview-home.ja.png)

![プレビュー - 記事一覧](./assets/preview-posts.ja.png)

![プレビュー - ノート](./assets/preview-notes.ja.png)

![プレビュー - タイムライン](./assets/preview-timeline.ja.png)

![プレビュー - 思考](./assets/preview-thinking.ja.png)

---

## 原則

システム全体は**書くこと**を軸に組まれています。ページは手紙を開くように展開し、文字と余白がリズムを作る——情報グリッドに押し込まれることはありません。読むとき、目線が主役で、ページはただの背景です。

**色は抑制されています。** ライトモードは本物の紙のオフホワイトに近く、ダークモードはウォームグレーへと沈みます。アクセントカラーはコンテンツの中にだけ現れ、ボタン・ナビ・ボーダーは目立たないよう静かに後退します。

**アニメーションは息をするように。** 内容はスクロールと共に自然に浮かび上がり、新しいページをめくるように展開します。初回訪問はフルのエントランス、再訪問は省略——繰り返し邪魔しません。

**書体には質感があります。** 見出しはセリフで墨の重みを、注釈と日付はイタリック・セリフで余白の走り書きのように。基本サイズは小さめ、空間はコンテンツに返します。

**インタラクションは静かです。** 浮かぶ色ブロックも、跳ねるハイライトもありません。ホバーは色が少し深まるだけ——指で紙をそっと押すように。すべてのフィードバックが「気づいています」と語り、「こちらを見て」とは言いません。

---

## 使い方

```bash
cd design-system
pnpm install
pnpm showcase:dev    # ローカル showcase プレビュー
pnpm check           # token ドリフト + テンプレート lint
pnpm demo:pdf        # デモ長文 / 履歴書 / レポートを PDF 化
```

主な構成：

| パス | 用途 |
|------|------|
| `design-system/src/tokens.css` | 色 / 文字 / 余白 token（Tailwind v4 `@theme`） |
| `design-system/SKILL.md` | AI 用ルーティングルール（mockup / 新コンポーネント / mockup→React / token 監査） |
| `design-system/CHEATSHEET.md` | 一枚物の早見表：十の不変式 + 色 / 文字一覧 |
| `design-system/references/` | 完全仕様（tokens / components / anti-patterns / mockup-to-react） |
| `design-system/templates/` | HTML mockup スターター |
| `design-system/showcase/` | ライブ showcase ソース |

---

## 完全実装 · クローズドソースリポジトリ

Yohaku の完全なサイト実装は [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) でクローズドソースとして維持されており、[Shiro](https://github.com/Innei/Shiro) をベースに深く再構築されています。

**スポンサーになるとプライベートリポジトリへのアクセスが得られます。**

[![Sponsor](https://img.shields.io/badge/Sponsor-Innei-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Innei)

[github.com/sponsors/Innei](https://github.com/sponsors/Innei) でスポンサー登録後、[Issue](https://github.com/Innei/Yohaku/issues) またはメールで GitHub ユーザー名をお知らせください——手動でアクセス権を追加します。

---

## 仕様早見表

| トークン | ライト | ダーク |
|---------|--------|--------|
| アクセント | 浅葱 `#33A6B8` | 桃 `#F596AA` |
| 紙面 | `#fefefb`（紙白） | `rgb(28,28,30)`（暖かな夜） |
| ニュートラル | `1–10`（三段：面 / 罫線 / 文字） | 自動反転 |
| イージング | `cubic-bezier(0.22, 1, 0.36, 1)` | 同左 |
| 基本サイズ | 14px | 同左 |

詳細は [`design-system/CHEATSHEET.md`](./design-system/CHEATSHEET.md)。

---

## 開発時の対話アーカイブ

Yohaku を作っているうちに、最終的なコードより AI との対話の方が役に立つことが多いと感じたので、[archive/specstory-sessions](./archive/specstory-sessions/README.md) に年ごとにまとめて公開しています。

---

## 関連プロジェクト

- [Shiro](https://github.com/Innei/Shiro) — オープンソースの前身、Next.js 個人ブログシステム
- [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) — 完全なクローズドソース実装（スポンサーでアクセス可能）

---

## ライセンス

2026 Innei.

- `design-system/` 以下のコード（トークン、スクリプト、showcase、テンプレートなど）は [MIT License](./design-system/LICENSE) で公開しています。
- それ以外（README、スクリーンショット、対話アーカイブなど）は引き続き [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) です。
