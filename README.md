# 余白 / Yohaku

> *The blank space is part of the writing.*

**Yohaku**（余白）取自日文，意为**留白**——画面中那些有意空出的地方，往往比填满的部分更有分量。

这是一套个人博客的设计语言与视觉体系，建立在「書写·信纸·光影」的隐喻之上。它不是一个功能清单，而是一种关于「如何让阅读发生」的回答。

![Image](https://github.com/user-attachments/assets/bb55b700-5ed6-4af4-964d-a78d5c3a4d1b)

---

## 设计哲学

整站以**个人书写**为隐喻。页面像一封徐徐展开的信纸，文字与空白共同构成节奏，内容如手帐般自然散落，而非整齐划一的信息网格。阅读时，你的视线是主角，页面只是背景。

**颜色是克制的。** 浅色模式下，底色接近真实纸张的米白，不刺眼；深色模式沉入暖灰，像夜里开着一盏小灯读信。强调色只在内容本身出现，界面的按钮、导航、边框，都刻意退到不被注意的位置。

**动画是呼吸式的。** 页面随滚动缓缓展开，元素不是弹出来的，而是自然浮现——就像翻开一页新纸。桌面端的某些元素还有轻微的闲置呼吸感，像是静止的东西仍然活着。第一次进入时有完整的入场动效；再次访问则直接呈现，不重复打扰。

**字体是有质感的。** 标题用衬线字体，带一点笔墨的重量；注释与日期以斜体呈现，像信纸角落随手写下的旁白。整体字号偏小，阅读密度低，留给内容足够的呼吸空间。

**交互是低调的。** 没有悬浮的色块，没有跳跃的高亮，悬停时只是颜色微微加深，像纸面被手指轻轻压过。所有的反馈都在说：「我注意到你了」，而不是「快看这里」。

---

## 获取完整实现

Yohaku 的完整代码以闭源方式维护于私有仓库 [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku)，基于 [Shiro](https://github.com/Innei/Shiro) 深度重构而来。

**赞助后可获得私有仓库的访问权限。**

[![Sponsor](https://img.shields.io/badge/Sponsor-Innei-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Innei)

赞助 [github.com/sponsors/Innei](https://github.com/sponsors/Innei) 后，请通过 [Issues](https://github.com/Innei/Yohaku/issues) 或邮件告知你的 GitHub 用户名，我会手动添加仓库访问权限。

本仓库作为设计语言的公开存档，记录视觉规范与设计决策。

---

## 设计规范速览

| 维度 | 浅色 | 深色 |
|------|------|------|
| 强调色 | 浅葱 `#33A6B8` | 桃 `#F596AA` |
| 背景底色 | `#fefefb`（纸张本白） | `rgb(28,28,30)`（暖灰夜色） |
| 动效缓动 | `cubic-bezier(0.22, 1, 0.36, 1)` | 同左 |
| 基础字号 | 14px | 同左 |

---

## 相关项目

- [Shiro](https://github.com/Innei/Shiro) — 开源前身，Next.js 个人博客系统
- [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) — 完整闭源实现（赞助可访问）

---

## 许可

2026 Innei. 本仓库内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议。
