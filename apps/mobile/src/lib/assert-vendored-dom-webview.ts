import { requireNativeModule } from 'expo-modules-core'

interface ExpoDomWebViewNativeModule {
  vendor?: string
}

/*
 * `@expo/dom-webview` is a hard `dependency` of `expo`, not just a peer — if
 * the pnpm `overrides` entry pointing it at `packages/dom-webview` fails to
 * take effect, expo silently resolves its own nested upstream copy instead
 * and nothing errors. This checks the native module for the marker constant
 * only our vendored copy defines, so a resolution regression fails loudly.
 */
export function assertVendoredDomWebView() {
  const native = requireNativeModule<ExpoDomWebViewNativeModule>(
    'ExpoDomWebViewModule',
  )
  if (native.vendor !== 'yohaku') {
    throw new Error(
      `@expo/dom-webview resolved to the upstream package instead of packages/dom-webview (native vendor="${native.vendor}")`,
    )
  }
}
