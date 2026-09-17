import { requireNativeModule } from 'expo-modules-core'

const DomWebViewModule = requireNativeModule<{
  presentFilePreview: (payload: {
    mimeType?: string
    name: string
    siteReferer?: string
    url: string
  }) => Promise<void>
}>('ExpoDomWebViewModule')

export function presentFilePreview(payload: {
  mimeType?: string
  name: string
  siteReferer?: string
  url: string
}): Promise<void> {
  return DomWebViewModule.presentFilePreview(payload)
}
