import { Asset } from 'expo-asset'
import { useEffect, useState } from 'react'

import { webviewFontFaceSpecs } from './font-faces'
import { fontModules } from './fonts'

export interface WebviewFontFace {
  family: string
  uri: string
  weight: number
}

const faces = webviewFontFaceSpecs.map(({ family, native, weight }) => ({
  family,
  module: fontModules[native],
  weight,
}))

// In dev the webview page is served over http, so the Metro asset URL is the
// only scheme it may load (file:// subresources are mixed-content-blocked).
// In release the page is file:// and the upstream DomWebView grants read
// access to "/", so the font resolves to its file:// path inside the app
// bundle — the same bytes expo-font registered natively, no extra copy.
async function resolveFaceUri(module: number | string): Promise<string> {
  const asset = Asset.fromModule(module)
  if (asset.uri.startsWith('http')) return asset.uri
  if (!asset.localUri) await asset.downloadAsync()
  return asset.localUri ?? asset.uri
}

let cached: WebviewFontFace[] | null = null

export function useWebviewFontFaces(): WebviewFontFace[] | undefined {
  const [value, setValue] = useState(cached ?? undefined)

  useEffect(() => {
    if (cached) return
    let cancelled = false
    void Promise.all(
      faces.map(async ({ family, module, weight }) => ({
        family,
        uri: await resolveFaceUri(module),
        weight,
      })),
    )
      .then((resolved) => {
        cached = resolved
        if (!cancelled) setValue(resolved)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return value
}
