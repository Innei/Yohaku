# @yohaku/mobile

**[简体中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)**

给自己 [Mix Space](https://github.com/mx-space) 站用的 iOS 客户端。iOS 18 以上，没有 Android。

App Store 上的 Yohaku 就是这份代码编出来的。MIT 开源，你可以改成自己的站点，用自己的 Apple 开发者账号上架。

<div align="center">
  <img src="../../assets/preview-ios-home.png" width="23%" alt="Home" />
  <img src="../../assets/preview-ios-post.png" width="23%" alt="Post" />
  <img src="../../assets/preview-ios-notes.png" width="23%" alt="Notes" />
  <img src="../../assets/preview-ios-thinking.png" width="23%" alt="Thinking" />
</div>

## 配置

修改 [`src/site-config.ts`](./src/site-config.ts) 里的 `publicSite`。仓库内默认 API 为空：

```typescript
// src/site-config.ts
export const publicSite: SiteConfig = {
  apiUrl: 'https://api.example.com', // 你的 mx-core API 地址
  siteUrl: 'https://example.com',    // 你的站点前台地址
  siteHosts: ['example.com'],        // 允许的域名
  bundleId: 'dev.yohaku.app',        // Bundle ID
  scheme: 'yohaku',                  // URL Scheme
  privacyUrl: '',                    // 隐私政策（留空则默认 ${siteUrl}/privacy）
  bundledOwner: null,
}
```

`src/site.ts` 不用动。

## 跑起来

环境要求：macOS、Xcode 16+、iOS 18+（模拟器或真机）。

在仓库根目录下：

```bash
pnpm install
pnpm --filter @yohaku/mobile start
```

使用 Xcode 编译运行：

```bash
pnpm --filter @yohaku/mobile ios
```

会生成 `ios/` 原生工程目录（此目录已加入 `.gitignore`）。

## 上架

1. 换 bundle id 和 scheme：`src/site-config.ts` 和 [`app.config.ts`](./app.config.ts) 顶部的 `PUBLIC_BUNDLE_ID` / `PUBLIC_SCHEME` 保持一致。App 名字是 `app.config.ts` 的 `name`。
2. 换图标：`assets/images/icon.png` 与 `assets/expo.icon`。
3. 开发者后台给这个 App ID 开启 Push Notifications：entitlements 里包含 `aps-environment`，不打开会导致签名失败。
4. `pnpm --filter @yohaku/mobile ios` 生成 `ios/`，Xcode 打开里面的 `.xcworkspace`，Archive → Distribute App。

推送本身需要一套自建的 APNs 中转服务，不在本仓库中；不配置不影响其他功能正常使用。

## 许可

[MIT](./LICENSE)，版权 Innei。
