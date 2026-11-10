import { requireNativeModule } from 'expo-modules-core'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'

interface ExpoDomWebViewFileModule {
  presentFilePreview: (payload: {
    mimeType?: string
    name: string
    siteReferer?: string
    url: string
  }) => Promise<void>
}

let nativeModule: ExpoDomWebViewFileModule | null = null

function native(): ExpoDomWebViewFileModule | null {
  if (Platform.OS === 'android') return null
  nativeModule ??= requireNativeModule<ExpoDomWebViewFileModule>(
    'ExpoDomWebViewModule',
  )
  return nativeModule
}

/**
 * iOS shows documents in a QuickLook sheet. Android hands the URL to the
 * system browser / document viewer, which is the platform equivalent.
 */
export function presentFilePreview(payload: {
  mimeType?: string
  name: string
  siteReferer?: string
  url: string
}): Promise<void> {
  const impl = native()
  if (impl) return impl.presentFilePreview(payload)
  return WebBrowser.openBrowserAsync(payload.url).then(() => {})
}
