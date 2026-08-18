import { requireNativeModule } from 'expo-modules-core'

const DomWebViewModule = requireNativeModule<{
  clearImageCache: () => Promise<void>
  imageCacheBytes: () => number
  prefetchImages: (urls: string[], siteReferer?: string | null) => Promise<void>
  presentImagePreview: (payload: {
    cornerRadius?: number
    index: number
    objectFit?: string
    siteReferer?: string
    urls: string[]
  }) => Promise<void>
}>('ExpoDomWebViewModule')

export function presentImagePreview(payload: {
  index: number
  siteReferer?: string
  urls: string[]
}): Promise<void> {
  return DomWebViewModule.presentImagePreview(payload)
}

export function prefetchImages(
  urls: string[],
  siteReferer?: string,
): Promise<void> {
  if (urls.length === 0) return Promise.resolve()
  return DomWebViewModule.prefetchImages(urls, siteReferer ?? null)
}

export function clearImageCache(): Promise<void> {
  return DomWebViewModule.clearImageCache()
}

export function imageCacheBytes(): number {
  return DomWebViewModule.imageCacheBytes()
}
