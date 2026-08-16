# @yohaku/mobile

iOS client for a personal [Mix Space](https://github.com/mx-space) blog. Open source; point `src/site.ts` at your own mx-core and compile.

Requires **iOS 18+**. There is no Android target.

```bash
pnpm install
pnpm --filter @yohaku/mobile start
# then, on a Mac with Xcode:
pnpm --filter @yohaku/mobile ios
```

Public defaults are empty: no API URL, bundle id `dev.yohaku.app`. Edit `src/site.ts` (or the public `publicSite` in `src/site-config.ts`) before a local `expo run:ios`. Generated `ios/` is gitignored — run `expo run:ios` to create it.

This is a single-site personal client, not a multi-site product. There is no first-launch “connect your site” flow.
