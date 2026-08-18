# @yohaku/mobile

**[简体中文](./README.md) · [English](./README.en.md)**

给个人 [Mix Space](https://github.com/mx-space) 站点用的 iOS 阅读客户端。开源。把 `publicSite` 指到你自己的 [mx-core](https://github.com/mx-space/core)，然后本机编译。

需要 **iOS 18+**。没有 Android。这是单站点个人客户端，不是多站点产品——没有「连接你的站点」的首次启动流程。

## 配置

公开默认写在 [`src/site-config.ts`](./src/site-config.ts) 的 `publicSite` 里：API 地址为空，bundle id 为 `dev.yohaku.app`。

编译前改这些字段：

| 字段 | 作用 |
|------|------|
| `apiUrl` | mx-core API 根地址，例如 `https://api.example.com` |
| `siteUrl` | 站点 URL，用于隐私政策等派生链接 |
| `bundleId` | 本机 / 上架用的 iOS bundle id，默认 `dev.yohaku.app` |
| `scheme` | URL scheme，默认 `yohaku` |

不要改 [`src/site.ts`](./src/site.ts)。那一层只负责合并可选的私有 overlay；公开树里 overlay 是空的。

## 跑起来

在仓库根目录：

```bash
pnpm install
pnpm --filter @yohaku/mobile start
```

本机有 macOS 和 Xcode 时：

```bash
pnpm --filter @yohaku/mobile ios
```

`expo run:ios` 会生成 `ios/` 目录。这个目录是 gitignored 的，不要提交。

## 许可

[MIT](./LICENSE)，版权 Innei。
