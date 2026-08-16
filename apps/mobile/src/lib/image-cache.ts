import { requireNativeModule } from 'expo-modules-core'

const DomWebViewModule = requireNativeModule<{
  clearImageCache: () => Promise<void>
  imageCacheBytes: () => number
  prefetchImages: (urls: string[]) => Promise<void>
  presentImagePreview: (payload: {
    cornerRadius?: number
    index: number
    objectFit?: string
    urls: string[]
  }) => Promise<void>
}>('ExpoDomWebViewModule')

export function presentImagePreview(payload: {
  index: number
  urls: string[]
}): Promise<void> {
  return DomWebViewModule.presentImagePreview(payload)
}

export function prefetchImages(urls: string[]): Promise<void> {
  if (urls.length === 0) return Promise.resolve()
  return DomWebViewModule.prefetchImages(urls)
}

export function clearImageCache(): Promise<void> {
  return DomWebViewModule.clearImageCache()
}

export function imageCacheBytes(): number {
  return DomWebViewModule.imageCacheBytes()
}
