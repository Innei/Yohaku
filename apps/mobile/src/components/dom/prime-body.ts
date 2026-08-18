import { requireNativeModule } from 'expo-modules-core'

import type { RichBodyPrime } from './rich-body'

// Reached through the native module rather than `@expo/dom-webview`'s JS entry:
// pnpm cannot resolve a direct workspace edge onto the linked override that
// vendors that package, so the native module name is the only usable handle.
const DomWebViewModule = requireNativeModule<{
  getDomSourceUrl: () => string | null
  prime: (url: string, key: string, payload: string) => void
}>('ExpoDomWebViewModule')

let sourceUrl: string | null = null

export function primeArticleBody(payload: RichBodyPrime) {
  sourceUrl ??= DomWebViewModule.getDomSourceUrl()
  if (!sourceUrl) return
  DomWebViewModule.prime(sourceUrl, payload.key, JSON.stringify(payload))
}
