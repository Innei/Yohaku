import type { ImageContentFit } from 'expo-image'

export interface ImagePreviewRequest {
  cornerRadius?: number
  index: number
  objectFit?: ImageContentFit
  siteReferer?: string
  urls: string[]
}

type Listener = () => void

let current: ImagePreviewRequest | null = null
const listeners = new Set<Listener>()

export function getImagePreview(): ImagePreviewRequest | null {
  return current
}

export function subscribeImagePreview(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function openImagePreview(request: ImagePreviewRequest) {
  current = request
  for (const listener of [...listeners]) listener()
}

export function closeImagePreview() {
  current = null
  for (const listener of [...listeners]) listener()
}
