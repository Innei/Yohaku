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
  <strong>iOS 18+</strong> · Expo · MIT · 没有 Android
</p>

**[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)**

> *留白也是写作的一部分。*

给自己 [Mix Space](https://github.com/mx-space) 站点用的 **iOS 阅读客户端**。四个 Tab：博文、手记、思考、我。正文和网站共用同一套排版。开源。把 API 指到你的 [mx-core](https://github.com/mx-space/core)，本机编译即可。

这不是多站点产品，没有「连接你的站点」的首次启动流程。

<table>
  <tr>
    <td align="center"><img src="./assets/preview-ios-home.png" alt="博文" width="260"><br>博文</td>
    <td align="center"><img src="./assets/preview-ios-notes.png" alt="手记" width="260"><br>手记</td>
  </tr>
  <tr>
    <td align="center"><img src="./assets/preview-ios-post.png" alt="文章" width="260"><br>文章</td>
    <td align="center"><img src="./assets/preview-ios-thinking.png" alt="思考" width="260"><br>思考</td>
  </tr>
</table>

---

## 客户端

源码在 [`apps/mobile/`](./apps/mobile/)，跑法见 [README](./apps/mobile/README.md)。

| Tab | 内容 |
|-----|------|
| **博文** | 文章列表、置顶、专栏 |
| **手记** | 手记时间线、专栏归档 |
| **思考** | 短想法时间线 |
| **我** | 登录、点赞、阅读记录、评论、语言、推送 |

另外还包括：应用内评论与点赞、和网站同一套 Lexical 正文、本地 SQLite 同步、文章朗读、摘要与相关阅读。iOS 26 上有 Liquid Glass 时走系统 Tab，否则用自绘纸面 Tab。

---

## 跑起来

```bash
pnpm install
# 编辑 apps/mobile/src/site-config.ts 里的 publicSite，填入你的 mx-core
pnpm --filter @yohaku/mobile start
pnpm --filter @yohaku/mobile ios   # 需要 macOS + Xcode
```

公开默认是空的 API 地址，bundle id 为 `dev.yohaku.app`。`expo run:ios` 会生成 gitignored 的 `ios/` 目录。完整说明见 [`apps/mobile/README.md`](./apps/mobile/README.md)。

---

## 设计系统

客户端用的排版契约也在这个仓库：一种主色，三档中性灰，剩下都是留白。网页预览、token、模板和 AI skill 见 [`design-system/README.zh.md`](./design-system/README.zh.md)，在线 showcase 在 [yohaku.innei.dev](https://yohaku.innei.dev)。

---

## 完整应用 · 闭源仓库

网站本体仍以闭源方式维护于 [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku)，基于 [Shiro](https://github.com/Innei/Shiro) 深度重构而来。赞助模型不变。

**赞助后可获得私有仓库的访问权限。**

[![Sponsor](https://img.shields.io/badge/Sponsor-Innei-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Innei)

赞助 [github.com/sponsors/Innei](https://github.com/sponsors/Innei) 后，请通过 [Issues](https://github.com/Innei/Yohaku/issues) 或邮件告知你的 GitHub 用户名，我会手动添加访问权限。

---

## 相关项目

- [mx-space/core](https://github.com/mx-space/core) — 后端 API（客户端要连的就是它）
- [Shiro](https://github.com/Innei/Shiro) — 开源前身，Next.js 个人博客系统
- [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) — 完整闭源实现（赞助可访问）

---

## 许可

2026 Innei.

- `apps/mobile/` 与 `packages/rich-content/` 采用 [MIT 许可证](./apps/mobile/LICENSE)，版权 Innei。
- `design-system/` 子目录下的代码（tokens、脚本、showcase、模板等）采用 [MIT 许可证](./design-system/LICENSE)。
- `packages/dom-webview/` 沿用上游 Expo MIT，改动说明见 [`VENDOR.md`](./packages/dom-webview/VENDOR.md)。
- 仓库其他部分（README、截图、对话归档等内容）仍然采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议。
