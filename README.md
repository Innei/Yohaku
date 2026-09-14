<div align="center">

# 余白 / Yohaku

_留白也是写作的一部分。_

[在线体验](https://innei.in) · [设计系统](https://yohaku.innei.dev) · [iOS 源码](https://github.com/Innei/Yohaku) · [获取 Web 访问权限](https://github.com/sponsors/Innei)

[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

</div>

![Yohaku 在 MacBook Pro 与 iPhone 上的跨端阅读体验](https://github.com/user-attachments/assets/27025fdd-800b-4d3c-8167-9e3dec32c2b7)

Yohaku 是一套面向个人写作的跨端出版产品。它以 [mx-core](https://github.com/mx-space/core) 为内容后端，在 Web 与 iOS 上统一呈现文章、手记、思考与时间线；界面退居其后，让文字、节奏与阅读本身成为主角。

完整 Web 产品由早期的开源前端 [Shiro](https://github.com/Innei/Shiro) 演进而来，目前以闭源方式持续开发。本仓库公开 iOS 客户端与 Yohaku 设计系统。

**这里就是 App Store 上那个 Yohaku iOS App 的完整源码**，以 MIT 开源。填上自己的 mx-core 地址、换掉 bundle id 与图标，你就能用自己的 Apple 开发者账号编译，并作为自己的 App 上架 App Store，不需要额外授权。

> [!IMPORTANT]
> 当前 Web 版本要求 **mx-core v12 或以上**。如需兼容 mx-core v11 及更早版本，请使用 [`721bb617`](https://github.com/Innei-dev/Yohaku/commit/721bb617db0dd1571751dbdf01cc6dfe74defedf)。

## 产品构成

| 层           | 职责                                                   | 开放状态                                                                          |
| ------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **Web**      | 响应式个人站、长文阅读与完整内容体验                   | 闭源维护于 [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku)，线上实例为 [innei.in](https://innei.in) |
| **iOS**      | 面向单一站点的原生阅读客户端，支持 iOS 18 或以上       | 本仓库 [`apps/mobile/`](./apps/mobile/)，[MIT 开源](./apps/mobile/LICENSE)，可自行编译上架 |
| **设计系统** | 色彩、字体、间距、动效、模板与面向 AI 助手的 [AI Skill 契约](./design-system/SKILL.md) | [MIT 开源](./design-system)                                                       |
| **内容服务** | 内容、评论、鉴权与实时数据                             | 基于 [mx-core](https://github.com/mx-space/core)，要求 v12 或以上                 |

## 阅读体验

| 原则           | 表现                                                                           |
| -------------- | ------------------------------------------------------------------------------ |
| **书写优先**   | 文章、手记、思考与时光拥有各自的叙事节奏，而不是被压进同一种信息卡片。         |
| **纸面感**     | 浅色模式接近纸张的暖白，深色模式沉入暖灰；衬线标题与低密度排版为正文保留空间。 |
| **克制交互**   | 单一强调色、三档中性层级与轻量反馈共同降低界面噪声。                           |
| **呼吸式动效** | 内容随阅读进程自然展开；首次进入建立节奏，重复访问不制造额外打扰。             |
| **跨端一致**   | Web 与 iOS 共用内容模型与富文本语义，并分别遵循浏览器与原生平台的交互方式。    |

<div align="center">
  <img src="./assets/preview-ios-home.png" width="23%" alt="Home" />
  <img src="./assets/preview-ios-post.png" width="23%" alt="Post" />
  <img src="./assets/preview-ios-notes.png" width="23%" alt="Notes" />
  <img src="./assets/preview-ios-thinking.png" width="23%" alt="Thinking" />
</div>

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
| Xcode   | 真机 / 模拟器编译 iOS 时需要（推荐 Xcode 16+） |

### 1. 设计系统 Showcase 与排版范例

```bash
pnpm install
pnpm dev             # 启动设计系统 Showcase (http://localhost:5173)
pnpm demo:pdf        # 生成长文、简历、单页报告 PDF 范例
pnpm check           # 校验 Token 漂移与模板规范
```

### 2. 运行 iOS 客户端

```bash
# 改 apps/mobile/src/site-config.ts 里的 publicSite
pnpm --filter @yohaku/mobile start
pnpm --filter @yohaku/mobile ios   # macOS + Xcode
```

默认 API 是空的，bundle id 是 `dev.yohaku.app`。`ios/` 编出来之后不要提交。更细的说明在 [`apps/mobile/README.md`](./apps/mobile/README.md)。

## 自己上架 App Store

`apps/mobile/` 是 MIT 的，允许你用自己的 Apple 开发者账号把它作为自己的 App 上架，不需要额外授权。要改的地方：

1. `apps/mobile/src/site-config.ts`：`apiUrl`、`siteUrl` 指向自己的 mx-core 与站点。
2. bundle id 与 scheme：`src/site-config.ts` 里的 `bundleId` / `scheme`，和 `app.config.ts` 顶部的 `PUBLIC_BUNDLE_ID` / `PUBLIC_SCHEME` 保持一致；App 名称是 `app.config.ts` 的 `name`。
3. 图标：`assets/images/icon.png` 与 `assets/expo.icon`。
4. 在开发者后台给这个 App ID 打开 Push Notifications：entitlements 里带 `aps-environment`，对不上会签名失败。
5. `pnpm --filter @yohaku/mobile ios` 生成 `ios/`，然后用 Xcode 打开里面的 `.xcworkspace`，Archive → Distribute App。

推送本身还需要一套自建的 APNs 中转服务，不在本仓库里；不配也不影响其余功能。

## 获取访问权限

完整 Web 实现继续在 [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku) 中维护。通过 [GitHub Sponsors](https://github.com/sponsors/Innei) 完成对应赞助后，请在 [Innei/Yohaku Issues](https://github.com/Innei/Yohaku/issues) 中提交 GitHub 用户名，或通过邮件联系维护者，以便手动开通访问权限。

## 许可

Copyright © 2026 Innei.

- `apps/mobile/` 与 `packages/rich-content/` 采用 [MIT 许可证](./apps/mobile/LICENSE)，版权 Innei。
- `design-system/` 子目录下的代码（tokens、脚本、showcase、模板等）采用 [MIT 许可证](./design-system/LICENSE)。
- `packages/dom-webview/` 沿用上游 Expo MIT，改动说明见 [`VENDOR.md`](./packages/dom-webview/VENDOR.md)。
- 仓库其他部分（README、截图、对话归档等内容）仍然采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议。


## 🌐 Web Resources & Aesthetic Symbols Index
- [SYM 1FAE4](https://aestheticsymbols.io/symbol/sym-1fae4/)
- [SYM 26ED](https://aestheticsymbols.io/symbol/sym-26ed/)
- [SYM 1F611](https://aestheticsymbols.io/symbol/sym-1f611/)
- [SYM 2635](https://aestheticsymbols.io/symbol/sym-2635/)
- [SYM 1D436](https://aestheticsymbols.io/symbol/sym-1d436/)
- [SYM 2663](https://aestheticsymbols.io/symbol/sym-2663/)
- [LEFT RIGHT EXCHANGE ARROWS](https://aestheticsymbols.io/symbol/left-right-exchange-arrows/)
- [SYM 1D43B](https://aestheticsymbols.io/symbol/sym-1d43b/)
- [SYM 1F979](https://aestheticsymbols.io/symbol/sym-1f979/)
- [SYM 1D48E](https://aestheticsymbols.io/symbol/sym-1d48e/)
- [SYM 2678](https://aestheticsymbols.io/symbol/sym-2678/)
- [SYM 1F604](https://aestheticsymbols.io/symbol/sym-1f604/)
- [SYM 1D408](https://aestheticsymbols.io/symbol/sym-1d408/)
- [SYM 2764 FE0F 200D 1FA79](https://aestheticsymbols.io/symbol/sym-2764-fe0f-200d-1fa79/)
- [SYM 1F974](https://aestheticsymbols.io/symbol/sym-1f974/)
- [SYM 1F48C](https://aestheticsymbols.io/symbol/sym-1f48c/)
- [HEAVY RIGHTWARD ARROW](https://aestheticsymbols.io/symbol/heavy-rightward-arrow/)
- [SYM 2725](https://aestheticsymbols.io/symbol/sym-2725/)
- [CHEERING FIGHTING FIST KAOMOJI](https://aestheticsymbols.io/symbol/cheering-fighting-fist-kaomoji/)
- [SYM 2636](https://aestheticsymbols.io/symbol/sym-2636/)
- [SYM 1F64A](https://aestheticsymbols.io/symbol/sym-1f64a/)
- [SYM 2639](https://aestheticsymbols.io/symbol/sym-2639/)
- [SYM 2741](https://aestheticsymbols.io/symbol/sym-2741/)
- [SYM 1F929](https://aestheticsymbols.io/symbol/sym-1f929/)
- [SYM 26BA](https://aestheticsymbols.io/symbol/sym-26ba/)
- [SYM 26D4](https://aestheticsymbols.io/symbol/sym-26d4/)
- [SYM 26B5](https://aestheticsymbols.io/symbol/sym-26b5/)
- [CLOCKWISE OPEN CIRCLE ARROW](https://aestheticsymbols.io/symbol/clockwise-open-circle-arrow/)
- [SYM 1D41E](https://aestheticsymbols.io/symbol/sym-1d41e/)
- [SYM 2742](https://aestheticsymbols.io/symbol/sym-2742/)
- [SYM 26A5](https://aestheticsymbols.io/symbol/sym-26a5/)
- [SYM 1F496](https://aestheticsymbols.io/symbol/sym-1f496/)
- [SYM 1F921](https://aestheticsymbols.io/symbol/sym-1f921/)
- [SYM 1D45D](https://aestheticsymbols.io/symbol/sym-1d45d/)
- [MUSIC FLAT SIGN](https://aestheticsymbols.io/symbol/music-flat-sign/)
- [SYM 1D44D](https://aestheticsymbols.io/symbol/sym-1d44d/)
- [SYM 1F605](https://aestheticsymbols.io/symbol/sym-1f605/)
- [LITTLE CAT PAWS KAOMOJI](https://aestheticsymbols.io/symbol/little-cat-paws-kaomoji/)
- [SYM 2621](https://aestheticsymbols.io/symbol/sym-2621/)
- [SYM 1D45E](https://aestheticsymbols.io/symbol/sym-1d45e/)
- [SYM 26B9](https://aestheticsymbols.io/symbol/sym-26b9/)
- [SYM 1F607](https://aestheticsymbols.io/symbol/sym-1f607/)
- [LEFT MATHEMATICAL WHITE SQUARE BRACKET](https://aestheticsymbols.io/symbol/left-mathematical-white-square-bracket/)
- [SINGLE EIGHTH MUSICAL NOTE](https://aestheticsymbols.io/symbol/single-eighth-musical-note/)
- [SYM 1F609](https://aestheticsymbols.io/symbol/sym-1f609/)
- [SYM 1D466](https://aestheticsymbols.io/symbol/sym-1d466/)
- [SYM 26FA](https://aestheticsymbols.io/symbol/sym-26fa/)
- [SYM 1F640](https://aestheticsymbols.io/symbol/sym-1f640/)
- [ANTICLOCKWISE OPEN CIRCLE ARROW](https://aestheticsymbols.io/symbol/anticlockwise-open-circle-arrow/)
- [SYM 1D46D](https://aestheticsymbols.io/symbol/sym-1d46d/)
- [HIGH VOLTAGE LIGHTNING](https://aestheticsymbols.io/symbol/high-voltage-lightning/)
- [SYM 2687](https://aestheticsymbols.io/symbol/sym-2687/)
- [SYM 2624](https://aestheticsymbols.io/symbol/sym-2624/)
- [SYM 26F1](https://aestheticsymbols.io/symbol/sym-26f1/)
- [ANGEL WINGS HEART](https://aestheticsymbols.io/symbol/angel-wings-heart/)
- [SYM 1D450](https://aestheticsymbols.io/symbol/sym-1d450/)
- [SYM 2639 FE0F](https://aestheticsymbols.io/symbol/sym-2639-fe0f/)
- [INSTAGRAM BIO](https://aestheticsymbols.io/ja/instagram-bio/)
- [STARS](https://aestheticsymbols.io/es/stars/)
- [SYM 26B0](https://aestheticsymbols.io/symbol/sym-26b0/)
- [ARROWS LINES](https://aestheticsymbols.io/es/arrows-lines/)
- [SYM 26AF](https://aestheticsymbols.io/symbol/sym-26af/)
- [SYM 2733](https://aestheticsymbols.io/symbol/sym-2733/)
- [SYM 273E](https://aestheticsymbols.io/symbol/sym-273e/)
- [LEFT BLACK LENTICULAR BRACKET](https://aestheticsymbols.io/symbol/left-black-lenticular-bracket/)
- [SYM 1D457](https://aestheticsymbols.io/symbol/sym-1d457/)
- [SYM 1F642](https://aestheticsymbols.io/symbol/sym-1f642/)
- [SYM 2647](https://aestheticsymbols.io/symbol/sym-2647/)
- [SYM 267A](https://aestheticsymbols.io/symbol/sym-267a/)
- [SYM 2744](https://aestheticsymbols.io/symbol/sym-2744/)
- [ES](https://aestheticsymbols.io/es/)
- [SYM 263F](https://aestheticsymbols.io/symbol/sym-263f/)
- [BLACK FOUR POINT STAR](https://aestheticsymbols.io/symbol/black-four-point-star/)
- [SYM 26A3](https://aestheticsymbols.io/symbol/sym-26a3/)
- [SYM 2680](https://aestheticsymbols.io/symbol/sym-2680/)
- [SYM 1F62E](https://aestheticsymbols.io/symbol/sym-1f62e/)
- [SYM 1D405](https://aestheticsymbols.io/symbol/sym-1d405/)
- [SYM 2684](https://aestheticsymbols.io/symbol/sym-2684/)
- [SYM 1D45A](https://aestheticsymbols.io/symbol/sym-1d45a/)
- [SYM 1F916](https://aestheticsymbols.io/symbol/sym-1f916/)
- [NATURE FLOWERS](https://aestheticsymbols.io/es/nature-flowers/)
- [SYM 1F920](https://aestheticsymbols.io/symbol/sym-1f920/)
- [RIGHT WHITE CORNER BRACKET](https://aestheticsymbols.io/symbol/right-white-corner-bracket/)
- [SYM 1D473](https://aestheticsymbols.io/symbol/sym-1d473/)
- [SYM 2634](https://aestheticsymbols.io/symbol/sym-2634/)
- [SYM 26A2](https://aestheticsymbols.io/symbol/sym-26a2/)
- [SYM 2749](https://aestheticsymbols.io/symbol/sym-2749/)
- [TRENDING](https://aestheticsymbols.io/trending/)
- [ROBLOX NAMES](https://aestheticsymbols.io/roblox-names/)
- [KAOMOJI](https://aestheticsymbols.io/es/kaomoji/)
- [SYM 263A](https://aestheticsymbols.io/symbol/sym-263a/)
- [SYM 1F628](https://aestheticsymbols.io/symbol/sym-1f628/)
- [SYM 1D448](https://aestheticsymbols.io/symbol/sym-1d448/)
- [ZODIAC CELESTIAL](https://aestheticsymbols.io/ru/zodiac-celestial/)
- [FOUR POINT STAR SPARKLE](https://aestheticsymbols.io/symbol/four-point-star-sparkle/)
- [LEFT POINTING DOUBLE ANGLE QUOTATION](https://aestheticsymbols.io/symbol/left-pointing-double-angle-quotation/)
- [SYM 1F49C](https://aestheticsymbols.io/symbol/sym-1f49c/)
- [FREEFIRE NAMES](https://aestheticsymbols.io/ru/freefire-names/)
- [SYM 265D](https://aestheticsymbols.io/symbol/sym-265d/)
- [SYM 1FA75](https://aestheticsymbols.io/symbol/sym-1fa75/)
- [SYM 262D](https://aestheticsymbols.io/symbol/sym-262d/)
- [SYM 26B7](https://aestheticsymbols.io/symbol/sym-26b7/)
- [SYM 1D46A](https://aestheticsymbols.io/symbol/sym-1d46a/)
- [SYM 1F600](https://aestheticsymbols.io/symbol/sym-1f600/)
- [SYM 26EA](https://aestheticsymbols.io/symbol/sym-26ea/)
- [SYM 1F641](https://aestheticsymbols.io/symbol/sym-1f641/)
- [SYM 1D44C](https://aestheticsymbols.io/symbol/sym-1d44c/)
- [SYM 1D471](https://aestheticsymbols.io/symbol/sym-1d471/)
- [STARS](https://aestheticsymbols.io/pt/stars/)
- [SYM 1F49E](https://aestheticsymbols.io/symbol/sym-1f49e/)
- [SYM 1D416](https://aestheticsymbols.io/symbol/sym-1d416/)
- [SYM 2666](https://aestheticsymbols.io/symbol/sym-2666/)
- [SYM 267B](https://aestheticsymbols.io/symbol/sym-267b/)
- [SIX POINTED BLACK STAR](https://aestheticsymbols.io/symbol/six-pointed-black-star/)
- [SYM 1F47A](https://aestheticsymbols.io/symbol/sym-1f47a/)
- [SYM 1D42B](https://aestheticsymbols.io/symbol/sym-1d42b/)
- [SYM 1D401](https://aestheticsymbols.io/symbol/sym-1d401/)
- [SYM 1D449](https://aestheticsymbols.io/symbol/sym-1d449/)
- [SYM 2683](https://aestheticsymbols.io/symbol/sym-2683/)
- [SYM 1D44F](https://aestheticsymbols.io/symbol/sym-1d44f/)
- [SYM 1D462](https://aestheticsymbols.io/symbol/sym-1d462/)
- [BOLD TIPPED ARROW](https://aestheticsymbols.io/symbol/bold-tipped-arrow/)
- [BLACK HEART](https://aestheticsymbols.io/symbol/black-heart/)
- [SYM 26BB](https://aestheticsymbols.io/symbol/sym-26bb/)
- [SYM 1D43D](https://aestheticsymbols.io/symbol/sym-1d43d/)
- [SYM 1F620](https://aestheticsymbols.io/symbol/sym-1f620/)
- [SYM 1F49D](https://aestheticsymbols.io/symbol/sym-1f49d/)
- [SYM 26BF](https://aestheticsymbols.io/symbol/sym-26bf/)
- [SYM 26E9](https://aestheticsymbols.io/symbol/sym-26e9/)
- [KAOMOJI](https://aestheticsymbols.io/vi/kaomoji/)
