# @yohaku/mobile

**[简体中文](./README.md) · [English](./README.en.md)**

iOS reader for a personal [Mix Space](https://github.com/mx-space) blog. Open source. Point `publicSite` at your own [mx-core](https://github.com/mx-space/core) and compile locally.

Requires **iOS 18+**. There is no Android target. This is a single-site personal client, not a multi-site product — there is no first-launch “connect your site” flow.

## Configure

Public defaults live in `publicSite` in [`src/site-config.ts`](./src/site-config.ts): empty API URL, bundle id `dev.yohaku.app`.

Set these before compiling:

| Field | Purpose |
|-------|---------|
| `apiUrl` | mx-core API root, e.g. `https://api.example.com` |
| `siteUrl` | Site URL; used to derive the privacy policy link |
| `bundleId` | iOS bundle id for local / store builds; default `dev.yohaku.app` |
| `scheme` | URL scheme; default `yohaku` |

Do not edit [`src/site.ts`](./src/site.ts). That file only merges an optional private overlay; in the public tree the overlay is empty.

## Run

From the repository root:

```bash
pnpm install
pnpm --filter @yohaku/mobile start
```

On a Mac with Xcode:

```bash
pnpm --filter @yohaku/mobile ios
```

`expo run:ios` generates an `ios/` directory. It is gitignored — do not commit it.

## License

[MIT](./LICENSE), copyright Innei.
