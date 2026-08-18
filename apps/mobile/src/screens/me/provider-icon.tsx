import { Image } from 'expo-image'

import { hasProviderIcon, providerIconSvg } from './provider-icon-svg'

export { hasProviderIcon }

export function ProviderIcon({
  color,
  provider,
  size,
}: {
  color: string
  provider: string
  size: number
}) {
  const svg = providerIconSvg(provider, color)
  if (!svg) return null
  return (
    <Image
      source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }}
      style={{ width: size, height: size }}
    />
  )
}
