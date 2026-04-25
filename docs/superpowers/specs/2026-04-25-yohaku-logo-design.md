# Yohaku Logo · Design Decisions

Date: 2026-04-25
Status: Implemented (tokens, snippet, SVG assets, README headers)
Related explorations: `logo-explorations.html` (root)
Implementation:
- `design-system/src/tokens.css` — `--font-logo-cjk`, `--font-logo-latin`
- `design-system/templates/snippets/logo.html` — canonical wordmark + mark markup
- `assets/logo/{wordmark,wordmark-dark,mark}.svg` + `assets/favicon.svg`
- `README.md` / `README.en.md` / `README.ja.md` — `<picture>` header with light/dark switching

## Premise

Yohaku 的核心隐喻是「留白 = 内容」。设计系统这个品类的 logo 大多本就不是 symbol（shadcn、Geist、Linear 早期、Radix）——它们的识别由排版决定，而非图形。Yohaku 的特殊性在于：**「字之间的间距」本身就是命名所指**。所以最忠实的做法是让 wordmark 自己演这件事，而不是另画一个 mark。

## Decisions

### 1. Primary logo · wordmark (1C-b)

```
余白    yohaku
```

- **Composition**: 横排，CJK 在左、Latin 在右，**之间不加分隔线**——用空白本身表达 yohaku
- **CJK part**: `余白`，typeface = Noto Serif JP，weight = 500，letter-spacing = `0.18em`
- **Latin part**: `yohaku`（全小写），typeface = EB Garamond，weight = 400，letter-spacing = `0.04em`
- **Gap**: CJK 与 Latin 之间 `2.4em`（`em` 计算基于 CJK 字号，即 CJK 字号的 240%）
- **Color**:
  - light: `--color-neutral-9`（CJK）+ `--color-neutral-7`（Latin，略弱）
  - dark: 自动反相（同 token 在 dark 主题下已颠倒）
- **Sizes**:
  - Hero / docs landing: CJK 64px / Latin 28px
  - Section header: CJK 36px / Latin 16px
  - Navigation: CJK 18px / Latin 12px
- **Never use**: italic、bold、彩色（accent 只属于内容，不属于品牌识别）

### 2. Square mark · 反白「白」 (2B-d)

仅用于 **正方形小尺寸场景**：favicon、GitHub avatar、npm package avatar、social card 角标。

- **Composition**: `--color-neutral-9` 实心方块 + `--color-paper`「白」字阴文反白
- **Typeface**: Noto Serif JP，weight = 600（小尺寸需要更重）
- **Aspect ratio**: 1 : 1
- **Sizes**:
  - 512px master
  - 128px GitHub avatar
  - 32px / 16px favicon
- **Self-reference**: logo 是黑的、字是白的——mark 本身在演示自己的名字

### 3. Usage rules

| 场景 | 用什么 |
|------|--------|
| README header / docs hero / OG image | wordmark (1) |
| 导航栏 / 文档侧栏 logo 区 | wordmark (1) at nav size |
| 正文中提及品牌 | 文字「Yohaku」/「余白」即可，不嵌图 |
| favicon | mark (2) at 32 / 16 px |
| GitHub avatar / npm avatar | mark (2) at 128 / 256 px |
| social card 主图 | wordmark (1) 居中 + 一句 tagline |
| **从不**：wordmark + mark 同时出现 | — |

### 4. Typography contract

Logo 自己声明字体，不依赖 `--font-serif`（系统的 serif 是 Noto Serif CJK SC，更重、更书法味，不适合 logotype）：

```css
--logo-cjk: 'Noto Serif JP', 'Source Han Serif', serif;
--logo-latin: 'EB Garamond', 'GT Sectra', 'Tiempos', Georgia, serif;
```

写到 `design-system/src/tokens.css` 的 `@theme` block 里，作为 logo-only 字体合约。

## Open items for user review

1. **CJK 字体**：现选 Noto Serif JP 500。可选替代——Klee One（更书写感、更软）/ Source Han Serif（更接近系统现有 serif）。
2. **Latin 字体**：现选 EB Garamond。可选替代——Tiempos Headline（更现代、切角更利）/ GT Sectra（更编辑设计、最有作者性）。两者都是付费字体。
3. **Mark 是否要做 SVG 资产**：纯 CSS 渲染在 favicon 16px 时依赖系统字体，有渲染漂移风险——建议把 32px / 16px 的 mark 导出为 SVG / ICO 固化形状。
4. **Wordmark 有没有需要做成 SVG**：理论上排版即 logo，但放到没有 EB Garamond / Noto Serif JP 的环境（Twitter/X card 等）会 fallback。可能需要一份 SVG 化的 wordmark 兜底。

## Out of scope

- Animation（呼吸、入场动效）— 由设计系统的 motion token 统一管，logo 不单独定义
- 任何彩色版本（accent 浅葱 / 桃只属于内容色，不进入 logo）
- 印章朱印、washi 纹理、毛笔笔触等装饰处理（参考 `logo-explorations.html` 中已弃方案）
