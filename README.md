<div align="center">

# 余白 / Yohaku

_留白也是写作的一部分。_

[在线体验](https://innei.in) · [设计系统](https://yohaku.innei.dev) · [iOS 源码](https://github.com/Innei/Yohaku) · [获取 Web 访问权限](https://github.com/sponsors/Innei)

[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

</div>

![Yohaku 在 MacBook Pro 与 iPhone 上的跨端阅读体验](https://github.com/user-attachments/assets/50ae033c-0c88-4c5c-90ec-bcee7f84898a)

Yohaku 是一套面向个人写作的跨端出版产品。它以 [mx-core](https://github.com/mx-space/core) 为内容后端，在 Web 与 iOS 上统一呈现文章、手记、思考与时间线；界面退居其后，让文字、节奏与阅读本身成为主角。

完整 Web 产品由早期的开源前端 [Shiro](https://github.com/Innei/Shiro) 演进而来，目前以闭源方式持续开发。本仓库公开 iOS 客户端与 Yohaku 设计系统。

> [!IMPORTANT]
> 当前 Web 版本要求 **mx-core v12 或以上**。如需兼容 mx-core v11 及更早版本，请使用 [`721bb617`](https://github.com/Innei-dev/Yohaku/commit/721bb617db0dd1571751dbdf01cc6dfe74defedf)。

## 产品构成

| 层           | 职责                                                   | 开放状态                                                                          |
| ------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **Web**      | 响应式个人站、长文阅读与完整内容体验                   | 闭源维护于 [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku)，线上实例为 [innei.in](https://innei.in) |
| **iOS**      | 面向单一站点的原生阅读客户端，支持 iOS 18 或以上       | 本仓库 [`apps/mobile/`](./apps/mobile/)                                           |
| **设计系统** | 色彩、字体、间距、动效、模板与 AI Skill 的统一设计契约 | [MIT 开源](./design-system)                                                       |
| **内容服务** | 内容、评论、鉴权与实时数据                             | 基于 [mx-core](https://github.com/mx-space/core)，要求 v12 或以上                 |

## 阅读体验

| 原则           | 表现                                                                           |
| -------------- | ------------------------------------------------------------------------------ |
| **书写优先**   | 文章、手记、思考与时光拥有各自的叙事节奏，而不是被压进同一种信息卡片。         |
| **纸面感**     | 浅色模式接近纸张的暖白，深色模式沉入暖灰；衬线标题与低密度排版为正文保留空间。 |
| **克制交互**   | 单一强调色、三档中性层级与轻量反馈共同降低界面噪声。                           |
| **呼吸式动效** | 内容随阅读进程自然展开；首次进入建立节奏，重复访问不制造额外打扰。             |
| **跨端一致**   | Web 与 iOS 共用内容模型与富文本语义，并分别遵循浏览器与原生平台的交互方式。    |

## 仓库边界

```text
Yohaku
├── apps/mobile              iOS 客户端
├── design-system            设计系统
├── packages/rich-content    跨端富文本渲染
└── packages/dom-webview     Expo DOM WebView 适配
```

完整 Web 实现继续在 [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) 中维护。本仓库只公开 iOS 客户端、设计系统与跨端渲染包。

> [!NOTE]
> Yohaku 与上一代项目 [Shiroi](https://github.com/innei-dev/Shiroi) 已完全分离；两者的仓库访问权限与赞助关系相互独立。

## 本地运行

| 要求    | 版本      |
| ------- | --------- |
| Node.js | 22 或以上 |
| pnpm    | 11.20.0   |
| mx-core | 12 或以上 |
| Xcode   | 真机 / 模拟器编译 iOS 时需要 |

```bash
pnpm install
# 改 apps/mobile/src/site-config.ts 里的 publicSite
pnpm --filter @yohaku/mobile start
pnpm --filter @yohaku/mobile ios   # macOS + Xcode
```

默认 API 是空的，bundle id 是 `dev.yohaku.app`。`ios/` 编出来之后不要提交。更细的说明在 [`apps/mobile/README.md`](./apps/mobile/README.md)。

## 获取访问权限

完整 Web 实现继续在 [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) 中维护。通过 [GitHub Sponsors](https://github.com/sponsors/Innei) 完成对应赞助后，请在 [Innei/Yohaku Issues](https://github.com/Innei/Yohaku/issues) 中提交 GitHub 用户名，或通过邮件联系维护者，以便手动开通访问权限。

## 许可

Copyright © 2026 Innei.

- `apps/mobile/` 与 `packages/rich-content/` 采用 [MIT 许可证](./apps/mobile/LICENSE)，版权 Innei。
- `design-system/` 子目录下的代码（tokens、脚本、showcase、模板等）采用 [MIT 许可证](./design-system/LICENSE)。
- `packages/dom-webview/` 沿用上游 Expo MIT，改动说明见 [`VENDOR.md`](./packages/dom-webview/VENDOR.md)。
- 仓库其他部分（README、截图、对话归档等内容）仍然采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议。
