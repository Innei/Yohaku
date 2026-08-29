# Vendored from `@expo/dom-webview`

Source: `@expo/dom-webview@57.0.1` from the `expo@57.0.11` release line (upstream
[`expo/expo`](https://github.com/expo/expo), `packages/@expo/dom-webview`).

This package used to be installed normally and patched via
`patches/@expo__dom-webview.patch` (pnpm `patchedDependencies`). It's vendored
here for the app's persistent article renderer and native media/print surfaces.
`pnpm-workspace.yaml` resolves
`@expo/dom-webview` to `link:./packages/dom-webview` via `overrides`; `expo`
itself still declares `@expo/dom-webview` as a regular (non-optional)
`dependency`, so without that override it would silently fall back to its own
nested upstream copy — see `DomWebViewModule.swift`'s `vendor` constant and
`apps/mobile/src/lib/assert-vendored-dom-webview.ts` for the `__DEV__` check
that catches a resolution regression.

## Changes vs. upstream 57.0.1

- `ios/DomWebView.swift`: `SharedReaderWebView` retains one article
  `DomWKWebView` and moves it between detail-screen hosts. The `shared` prop is
  opt-in, so print, nested documents, and other DOM components remain isolated.
- `ios/DomWebViewModule.swift`: `setReaderContent` sends the newest tapped
  article to that live document before navigation. There is no pool, backfill,
  replay log, warm scan, expiry state, or generic injection retry queue.
- `ios/DomWebView.swift`: `resetupScripts()` re-registers the script message
  handler only when ownership changes. A reused document asks Expo's SDK 57 DOM
  wrapper to resend current props through its existing `$$dom_ready` contract.
- `ios/DomWebViewModule.swift`: `Constants(["vendor": "yohaku"])`, purely for
  the resolution self-check above.
- `src/DomWebView.types.ts`: `allowingReadAccessToURL` added to
  `UnsupportedWebViewProps`. Expo's wrapper passes it and neither upstream's
  types nor ours declared it; the contract test below is what surfaced it.
- Remote `https` images are rewritten to the `yohaku-asset` scheme and fetched
  natively. The caller supplies `siteUrl` as `siteReferer`; the package has no
  site default (`site-referer.ts`, `ios/DomAssetSchemeHandler.swift`,
  `DomImageAssetStore`). The DOM document is served from Metro or a file URL;
  Cloudflare hotlink protection (1011) rejects those Referers. Third-party
  hosts (GitHub avatars) are fetched without a site Referer.
- `DomImagePreviewDomain.present` is the shared lightbox entry: a window rect
  plus URLs. The WKWebView message handler converts DOM layout; `RemoteImage`
  (`ViewName("RemoteImage")`) converts its own bounds. `presentImagePreview`,
  `prefetchImages`, `clearImageCache`, and `imageCacheBytes` are module
  functions. Disk cache is capped at 200MB LRU under `Caches/DomImageAssets`.
- Android removed entirely (`android/`, `local-maven-repo/`,
  `expo-module.config.json`'s `android` block) — see `apps/mobile/AGENTS.md`,
  this app is iOS-only and Android sources are never kept alive here.

## Packaging deltas

- **Every file is reformatted** by this repo's prettier (single quotes, no
  semicolons, narrower wrapping). A file-by-file diff against a new upstream
  release is therefore mostly formatting noise — normalize both sides before
  reading it.
- **Upstream's `devDependencies` are dropped** (`expo`, `expo-module-scripts`).
  They installed a _second_ copy of `expo` here (57.0.6, while the app runs
  57.0.11), and both Node and Metro prefer the nearest copy — so an
  `import … from 'expo'` added to this package would have bundled the older one,
  which the `vendor` self-check cannot catch because it only inspects the native
  module. Metro still resolves the peers (`react-native`, `expo-modules-core`)
  from `apps/mobile/node_modules`, which expo's metro config puts on
  `nodeModulesPaths` for every file in the workspace.
- **No build, lint or typecheck runs here.** The `build` / `clean` / `lint` /
  `expo-module` scripts were wrappers over `expo-module-scripts` and went with
  it, as did `syncBrowserScripts` (whose `scripts/` directory was never
  vendored) and `.eslintrc.js` (the root `eslint.config.mjs` ignores
  `packages/dom-webview/**`). `tsconfig.json` no longer extends
  `expo-module-scripts/tsconfig.base`; its options are inlined so the file still
  describes the dialect the sources are written in, but `tsc` cannot run against
  it — the peers are not installed here, and installing them would recreate the
  duplicate-copy hazard above.
- **`build/*.d.ts` is upstream's, frozen at 57.0.1.** Nothing regenerates it, so
  it no longer describes this fork's public types — it has no `shared` prop.
  `package.json`'s `types` still points at it; `main` points at `src/`, which is
  what Metro and this repo actually consume.
- **`test` runs vitest**, not `expo-module-scripts`' jest preset (the dead
  `jest.preset` key is gone with it). `vitest` and `typescript` are declared
  here rather than borrowed from the workspace root's `PATH`.

## Upstream fixes do not flow in automatically

Bumping `expo` no longer bumps this package. If upstream ships a WebView fix
or the `expo` SDK moves to a new `@expo/dom-webview` version, re-diff this
directory against the new release manually and re-apply the changes above.

The one place that bump can break silently is the boundary with
`expo/src/dom/webview-wrapper.tsx`, which renders this view and drives its ref.
`src/expo-contract.test.ts` reads that file out of the app's installed `expo` at
test time and asserts that every prop it passes and every ref method it calls is
declared in `src/DomWebView.types.ts`, so a wrapper that starts passing
something new fails a test instead of failing at runtime. It also pins the
number of pass-through spreads: `...dom` is caller-controlled and cannot be
enumerated, and a second such channel would be a new blind spot.
