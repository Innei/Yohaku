import { Image } from 'expo-image'
import { requireNativeModule } from 'expo-modules-core'
import { Platform } from 'react-native'

import { openImagePreview } from './image-preview-store'

/**
 * Image cache/preview service.
 *
 * iOS talks to the vendored `ExpoDomWebViewModule` (SDWebImage); Android uses
 * expo-image's Glide cache and the JS `ImagePreviewHost`. The native module is
 * required lazily so the Android bundle never touches a missing view manager.
 */
interface ExpoDomWebViewImageModule {
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
}

let nativeModule: ExpoDomWebViewImageModule | null = null

function native(): ExpoDomWebViewImageModule | null {
  if (Platform.OS === 'android') return null
  nativeModule ??= requireNativeModule<ExpoDomWebViewImageModule>(
    'ExpoDomWebViewModule',
  )
  return nativeModule
}

export function presentImagePreview(payload: {
  cornerRadius?: number
  index: number
  objectFit?: string
  siteReferer?: string
  urls: string[]
}): Promise<void> {
  const impl = native()
  if (impl) return impl.presentImagePreview(payload)
  openImagePreview({
    cornerRadius: payload.cornerRadius,
    index: payload.index,
    objectFit: 'contain',
    siteReferer: payload.siteReferer,
    urls: payload.urls,
  })
  return Promise.resolve()
}

export async function prefetchImages(
  urls: string[],
  siteReferer?: string,
): Promise<void> {
  if (urls.length === 0) return
  const impl = native()
  if (impl) return impl.prefetchImages(urls, siteReferer ?? null)
  try {
    // expo-image prefetch only accepts URIs; the Referer is applied when the
    // image is actually rendered by RemoteImage.
    void siteReferer
    await Image.prefetch(urls)
  } catch {
    // Prefetching is best effort.
  }
}

export async function clearImageCache(): Promise<void> {
  const impl = native()
  if (impl) return impl.clearImageCache()
  await Image.clearMemoryCache()
  await Image.clearDiskCache()
}

export function imageCacheBytes(): number {
  const impl = native()
  return impl ? impl.imageCacheBytes() : 0
}
