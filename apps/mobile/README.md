# @yohaku/mobile

**[简体中文](./README.md) · [English](./README.en.md)**

给自己 [Mix Space](https://github.com/mx-space) 站用的 iOS 客户端。iOS 18 以上，没有 Android。

## 配置

改 [`src/site-config.ts`](./src/site-config.ts) 里的 `publicSite`。仓库里默认 API 是空的，bundle id 是 `dev.yohaku.app`。

| 字段 | |
|------|--|
| `apiUrl` | mx-core，比如 `https://api.example.com` |
| `siteUrl` | 站点地址 |
| `bundleId` | 默认 `dev.yohaku.app` |
| `scheme` | 默认 `yohaku` |

`src/site.ts` 不用动。

## 跑起来

仓库根目录：

```bash
pnpm install
pnpm --filter @yohaku/mobile start
```

有 Xcode 的话：

```bash
pnpm --filter @yohaku/mobile ios
```

会生成 `ios/`，这个目录是 gitignored 的。

## 许可

[MIT](./LICENSE)，版权 Innei。
