<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/logo/wordmark-dark.svg">
    <img alt="余白 / Yohaku" src="./assets/logo/wordmark.svg" width="320">
  </picture>
</p>

**[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)**

> *留白也是写作的一部分。*

**Yohaku**（余白）取自日语「留白」——画面里那些有意空出的地方，往往比填满的部分更有分量。

这是一套**为书写而设计的排版系统**：一种主色，三档中性灰，剩下都是留白。网页、长文、信件、报告，凡是承载文字的地方都能用。

- 在线 showcase: **[yohaku.innei.dev](https://yohaku.innei.dev)**
- 设计契约（tokens、模板、AI skill）位于 [`design-system/`](./design-system/)，以 MIT 协议开源
- 下面的截图是这套系统在 [Yohaku 个人站](https://github.com/Innei-dev/Yohaku) 上的落地

> 预览以对角线切分，左上为浅色，右下为深色。

![设计预览 - 首页](./assets/preview-home.png)

![设计预览 - 文章列表](./assets/preview-posts.png)

![设计预览 - 手记](./assets/preview-notes.png)

![设计预览 - 时光](./assets/preview-timeline.png)

![设计预览 - 思考](./assets/preview-thinking.png)

---

## 设计原则

整套系统以**书写**为根本。页面像一封徐徐展开的信纸，文字与空白一起构成节奏，不被强塞进信息网格。阅读时视线是主角，页面只是背景。

**色是克制的。** 浅色底接近真实纸张的米白；深色沉入暖灰，像夜里开着一盏小灯读字。强调色只出现在内容本身，按钮、导航、边框都退到不被注意的位置。

**动效是呼吸式的。** 内容随滚动自然浮现，不是弹出来的——像翻开一页新纸。第一次进入时有完整入场，再次访问就直接呈现，不重复打扰。

**字是有质感的。** 标题用衬线，带一点笔墨重量；注释与日期用斜体衬线，像信纸角落随手写下的旁白。基础字号偏小，把空间还给内容。

**交互是低调的。** 没有跳跃的高亮，没有悬浮色块。悬停时颜色微微加深，像纸面被手指轻轻按过。所有反馈都在说「我注意到你了」，而不是「快看这里」。

---

## 文档样例

`pnpm demo:pdf` 会用同一套 token 把三种常见的书面格式打成 PDF——同样的纸面、同样的衬线、同样的留白节奏。

| 类型 | 说明 | 中文 | English |
|------|------|------|---------|
| **长文** | 衬线正文 / drop cap / 多页阅读 | [HTML](https://yohaku.innei.dev/demos/demo-post.html) · [PDF](https://yohaku.innei.dev/demos/demo-post.pdf) | [HTML](https://yohaku.innei.dev/demos/demo-post.en.html) · [PDF](https://yohaku.innei.dev/demos/demo-post.en.pdf) |
| **简历** | A4 单页 · 设计工程师 | [HTML](https://yohaku.innei.dev/demos/demo-resume.html) · [PDF](https://yohaku.innei.dev/demos/demo-resume.pdf) | [HTML](https://yohaku.innei.dev/demos/demo-resume.en.html) · [PDF](https://yohaku.innei.dev/demos/demo-resume.en.pdf) |
| **一页报告** | A4 单页 · 项目进度 | [HTML](https://yohaku.innei.dev/demos/demo-report.html) · [PDF](https://yohaku.innei.dev/demos/demo-report.pdf) | [HTML](https://yohaku.innei.dev/demos/demo-report.en.html) · [PDF](https://yohaku.innei.dev/demos/demo-report.en.pdf) |

也可以直接在 [yohaku.innei.dev](https://yohaku.innei.dev) 的 *Output samples* 区块翻一翻。

---

## 怎么用

### 作为 npm 包接入

```bash
pnpm add @yohaku/design-system
```

```css
/* 在 Tailwind v4 入口 CSS 里 */
@import "@yohaku/design-system/tokens.css";
```

只要这一行，颜色 / 字体 / 间距 token 就接入了——配合 [`design-system/CHEATSHEET.md`](./design-system/CHEATSHEET.md) 里的不变量使用即可。

### 本地预览

```bash
pnpm install
pnpm dev             # 本地起 showcase（http://localhost:5173）
pnpm build           # 打包 showcase 到 design-system/showcase/dist
pnpm check           # 校验 token 漂移 + 模板 lint
pnpm test            # 跑 check.ts 的单测
pnpm demo:pdf        # 把 demo 长文 / 简历 / 报告打成 PDF
```

主要内容：

| 路径 | 用途 |
|------|------|
| `design-system/src/tokens.css` | 颜色 / 字体 / 间距 token（Tailwind v4 `@theme`） |
| `design-system/SKILL.md` | AI 路由规则（mockup / 新组件 / mockup→React / token 审查） |
| `design-system/CHEATSHEET.md` | 一页速查：十条不变量 + 颜色 / 字号表 |
| `design-system/references/` | 完整规范（tokens / components / anti-patterns / mockup-to-react） |
| `design-system/templates/` | HTML mockup 起手式 |
| `design-system/showcase/` | 在线 showcase 源码 |

### 当作 AI Skill

[`design-system/SKILL.md`](./design-system/SKILL.md) 是写给 Claude Code / Codex 等 agent 的路由规则——当你说"做一个 Yohaku 风的 mockup"、"把这个 mockup 转成 React"或"检查 token 合规"时，它会把 `CHEATSHEET.md`、`references/`、`templates/` 里相应的上下文加载进来，让 agent 用同一套 token 产出页面。

最简单的接法是把 `design-system/` 整个目录拷到 agent 的 skill 路径下（例如 `~/.claude/skills/yohaku-design/`），然后在对话里直接说出触发词：

- 做一个 Yohaku 风的 mockup
- 把这个 mockup 转成 React
- 设计一个新的 Button 变体
- 检查这个文件的 token 合规

完整契约见 [`design-system/SKILL.md`](./design-system/SKILL.md) 与 [`design-system/CHEATSHEET.md`](./design-system/CHEATSHEET.md)。

---

## 完整应用 · 闭源仓库

Yohaku 的完整网站实现以闭源方式维护于 [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku)，基于 [Shiro](https://github.com/Innei/Shiro) 深度重构而来。

**赞助后可获得私有仓库的访问权限。**

[![Sponsor](https://img.shields.io/badge/Sponsor-Innei-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Innei)

赞助 [github.com/sponsors/Innei](https://github.com/sponsors/Innei) 后，请通过 [Issues](https://github.com/Innei/Yohaku/issues) 或邮件告知你的 GitHub 用户名，我会手动添加访问权限。

---

## 规范速览

| 维度 | 浅色 | 深色 |
|------|------|------|
| 强调色 | 浅葱 `#33A6B8` | 桃 `#F596AA` |
| 纸面 | `#fefefb`（纸白） | `rgb(28,28,30)`（暖灰夜） |
| 中性灰 | `1–10`（三档：表面 / 边框 / 文字） | 自动反转 |
| 缓动 | `cubic-bezier(0.22, 1, 0.36, 1)` | 同左 |
| 基础字号 | 14px | 同左 |

更多见 [`design-system/CHEATSHEET.md`](./design-system/CHEATSHEET.md)。

---

## 背景

Yohaku 不是从零设计的，它是从我自己的博客 [Shiro](https://github.com/Innei/Shiro) 一点点磨出来的。最初只是想换一种排版风格——把模板感的卡片网格换成更像信纸的版面，让长文读起来有节奏。改着改着，发现真正在工作的是几条很简单的不变量：一种主色、三档中性灰、一套呼吸式动效，剩下都是留白。

后来读到 [tw93/kami](https://github.com/tw93/kami)——同样是"约束语言、单一基调、为书写服务"，只是 kami 落在静态文档（PDF、幻灯片）上，Yohaku 落在网页与长文上。两边互为印证。把这些不变量从应用里抽出来，写成 token、模板和 AI skill，就成了现在的 design-system——一份可以交给 agent 也能交给人的设计契约。

---

## 开发对话归档

做 Yohaku 的过程中，和 AI 一起写的会话往往比最终代码更有用，所以把它们开源在 [archive/specstory-sessions](./archive/specstory-sessions/README.md) 里，按年份归档。

---

## 相关项目

- [Shiro](https://github.com/Innei/Shiro) — 开源前身，Next.js 个人博客系统
- [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) — 完整闭源实现（赞助可访问）

---

## 鸣谢

- design-system 的 HTML 设计语言受到 [tw93/kami](https://github.com/tw93/kami) 的启发——那种以书写为中心、克制留白的版面气质，是 Yohaku 排版思路的重要起点。

---

## 许可

2026 Innei.

- `design-system/` 子目录下的代码（tokens、脚本、showcase、模板等）采用 [MIT 许可证](./design-system/LICENSE)。
- 仓库其他部分（README、截图、对话归档等内容）仍然采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议。
