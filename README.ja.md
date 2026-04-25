<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/logo/wordmark-dark.svg">
    <img alt="余白 / Yohaku" src="./assets/logo/wordmark.svg" width="320">
  </picture>
</p>

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

## 文書サンプル

`pnpm demo:pdf` は同じ token を使って、三つのよくある書面フォーマットを PDF に焼きます——同じ紙面、同じセリフ、同じ呼吸のリズムで。

| 種類 | 内容 | 中文 | English |
|------|------|------|---------|
| **長文** | セリフ本文 / drop cap / 複数ページ | [HTML](https://yohaku.innei.dev/demos/demo-post.html) · [PDF](https://yohaku.innei.dev/demos/demo-post.pdf) | [HTML](https://yohaku.innei.dev/demos/demo-post.en.html) · [PDF](https://yohaku.innei.dev/demos/demo-post.en.pdf) |
| **履歴書** | A4 一枚 · デザインエンジニア | [HTML](https://yohaku.innei.dev/demos/demo-resume.html) · [PDF](https://yohaku.innei.dev/demos/demo-resume.pdf) | [HTML](https://yohaku.innei.dev/demos/demo-resume.en.html) · [PDF](https://yohaku.innei.dev/demos/demo-resume.en.pdf) |
| **一枚レポート** | A4 一枚 · プロジェクト進捗 | [HTML](https://yohaku.innei.dev/demos/demo-report.html) · [PDF](https://yohaku.innei.dev/demos/demo-report.pdf) | [HTML](https://yohaku.innei.dev/demos/demo-report.en.html) · [PDF](https://yohaku.innei.dev/demos/demo-report.en.pdf) |

[yohaku.innei.dev](https://yohaku.innei.dev) の *Output samples* セクションでも実物を確認できます。

> 注：日本語のデモ PDF は現在未提供です（中英のみ）。日本語の体裁は CJK ベストエフォートで、リリース前に目視 QA を行います。

---

## 使い方

### ローカルプレビュー

```bash
pnpm install
pnpm dev             # ローカル showcase プレビュー（http://localhost:5173）
pnpm build           # showcase を design-system/showcase/dist にビルド
pnpm check           # token ドリフト + テンプレート lint
pnpm test            # check.ts のユニットテスト
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

### AI Skill として使う

[`design-system/SKILL.md`](./design-system/SKILL.md) は Claude Code や Codex などのエージェント向けのルーティング契約です。「Yohaku 風の mockup を作って」「この mockup を React に変換して」「token 適合性を監査して」と話しかけると、`CHEATSHEET.md`・`references/`・`templates/` から必要な文脈だけを取り出し、同じ token で出力させます。

一番手っ取り早いのは、`design-system/` ディレクトリごとエージェントの skill パス（例：`~/.claude/skills/yohaku-design/`）にコピーする方法です。あとは普通のプロンプトで呼び出せます：

- Yohaku 風の mockup を作って
- この mockup を React に変換して
- 新しい Button バリアントを設計して
- このファイルの token 合規性をチェックして

完全な契約は [`design-system/SKILL.md`](./design-system/SKILL.md) と [`design-system/CHEATSHEET.md`](./design-system/CHEATSHEET.md) にあります。

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

## 背景

Yohaku はゼロから設計したものではなく、自分のブログ [Shiro](https://github.com/Innei/Shiro) の中で少しずつ削り出してきたものです。最初の動機はただの組版でした——テンプレート然としたカードグリッドを止めて、便箋に近い紙面で長文がきちんと呼吸するようにしたい、というだけ。手を入れているうちに、システムを動かしていたのはほんの数本の不変式だと気づきます——アクセント一色、ニュートラル三段、呼吸的なイージング、そして残りはすべて余白。

その後 [tw93/kami](https://github.com/tw93/kami) を読みました——同じ直感です。制約言語、単一のトーン、書くことへの偏り。kami は静的なドキュメント（PDF やスライド）に着地し、Yohaku はウェブと長文に着地する。互いがもう一方の検算になりました。これらの不変式をアプリケーションから引き剥がして、token・テンプレート・AI skill に書き戻したものが、今の design-system です——エージェントにも人にも渡せる、一通の設計契約として。

---

## 開発時の対話アーカイブ

Yohaku を作っているうちに、最終的なコードより AI との対話の方が役に立つことが多いと感じたので、[archive/specstory-sessions](./archive/specstory-sessions/README.md) に年ごとにまとめて公開しています。

---

## 関連プロジェクト

- [Shiro](https://github.com/Innei/Shiro) — オープンソースの前身、Next.js 個人ブログシステム
- [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) — 完全なクローズドソース実装（スポンサーでアクセス可能）

---

## 謝辞

- design-system の HTML デザイン言語は [tw93/kami](https://github.com/tw93/kami) から着想を得ています——書くことを中心に据えた、抑制された余白の佇まいが、Yohaku の組版思想の出発点になりました。

---

## ライセンス

2026 Innei.

- `design-system/` 以下のコード（トークン、スクリプト、showcase、テンプレートなど）は [MIT License](./design-system/LICENSE) で公開しています。
- それ以外（README、スクリーンショット、対話アーカイブなど）は引き続き [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) です。
