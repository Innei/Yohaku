import { requireNativeViewManager } from 'expo-modules-core'
import type { ComponentType } from 'react'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'

export type RemoteImageContentFit = 'contain' | 'cover' | 'fill'

export type RemoteImageProps = ViewProps & {
  contentFit?: RemoteImageContentFit
  images?: string[]
  index?: number
  style?: StyleProp<ViewStyle>
  uri: string
}

type NativeRemoteImageProps = ViewProps & {
  contentFit: RemoteImageContentFit
  images: string[]
  index: number
  label?: string
  uri: string
}

const NativeRemoteImage: ComponentType<NativeRemoteImageProps> =
  requireNativeViewManager('ExpoDomWebViewModule', 'RemoteImage')

export function RemoteImage({
  accessibilityLabel,
  contentFit = 'cover',
  images,
  index = 0,
  uri,
  ...rest
}: RemoteImageProps) {
  return (
    <NativeRemoteImage
      {...rest}
      accessibilityLabel={accessibilityLabel}
      contentFit={contentFit}
      images={images ?? []}
      index={index}
      label={accessibilityLabel}
      uri={uri}
    />
  )
}
