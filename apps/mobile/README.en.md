# @yohaku/mobile

**[简体中文](./README.md) · [English](./README.en.md)**

iOS client for a personal [Mix Space](https://github.com/mx-space) blog. iOS 18+, no Android.

## Config

Edit `publicSite` in [`src/site-config.ts`](./src/site-config.ts). API URL starts empty; bundle id is `dev.yohaku.app`.

| Field | |
|-------|--|
| `apiUrl` | mx-core, e.g. `https://api.example.com` |
| `siteUrl` | site URL |
| `bundleId` | default `dev.yohaku.app` |
| `scheme` | default `yohaku` |

Leave [`src/site.ts`](./src/site.ts) alone.

## Run

From the repo root:

```bash
pnpm install
pnpm --filter @yohaku/mobile start
```

With Xcode:

```bash
pnpm --filter @yohaku/mobile ios
```

That creates `ios/`. It's gitignored.

## License

[MIT](./LICENSE), copyright Innei.
