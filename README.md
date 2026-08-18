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

> *留白也是写作的一部分。*

Yohaku 是我自己博客的 iOS 客户端，现在开源了。博文、手记、思考，正文跟网站同一套。改 `publicSite` 指到你的 [mx-core](https://github.com/mx-space/core) 就能编。只绑一个站，iOS 18 以上，没有 Android。

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

源码在 [`apps/mobile/`](./apps/mobile/)。

## 怎么用

```bash
pnpm install
# 改 apps/mobile/src/site-config.ts 里的 publicSite
pnpm --filter @yohaku/mobile start
pnpm --filter @yohaku/mobile ios   # macOS + Xcode
```

默认 API 是空的，bundle id 是 `dev.yohaku.app`。`ios/` 编出来之后不要提交。更细的说明在 [`apps/mobile/README.md`](./apps/mobile/README.md)。

## 设计系统

排版那套也在这个仓库里：一种主色，三档中性灰，剩下都是留白。见 [`design-system/README.zh.md`](./design-system/README.zh.md)，showcase 在 [yohaku.innei.dev](https://yohaku.innei.dev)。

## 网站

网页版还在私有仓库 [Innei-dev/Yohaku](https://github.com/Innei-dev/Yohaku)，从 [Shiro](https://github.com/Innei/Shiro) 改过来的。赞助之后可以要权限。

[![Sponsor](https://img.shields.io/badge/Sponsor-Innei-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Innei)

赞助 [github.com/sponsors/Innei](https://github.com/sponsors/Innei) 之后，开个 [Issue](https://github.com/Innei/Yohaku/issues) 或发邮件，带上 GitHub 用户名，我手动加。

## 许可

2026 Innei.

- `apps/mobile/` 与 `packages/rich-content/` 采用 [MIT 许可证](./apps/mobile/LICENSE)，版权 Innei。
- `design-system/` 子目录下的代码（tokens、脚本、showcase、模板等）采用 [MIT 许可证](./design-system/LICENSE)。
- `packages/dom-webview/` 沿用上游 Expo MIT，改动说明见 [`VENDOR.md`](./packages/dom-webview/VENDOR.md)。
- 仓库其他部分（README、截图、对话归档等内容）仍然采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议。
