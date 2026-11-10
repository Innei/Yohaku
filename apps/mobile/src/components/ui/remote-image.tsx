import { Image } from 'expo-image'
import { requireNativeViewManager } from 'expo-modules-core'
import type { ComponentType } from 'react'
import {
  Platform,
  Pressable,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native'

import { presentImagePreview } from '@/lib/image-cache'

export type RemoteImageContentFit = 'contain' | 'cover' | 'fill'

export type RemoteImageProps = ViewProps & {
  contentFit?: RemoteImageContentFit
  images?: string[]
  index?: number
  siteReferer?: string
  style?: StyleProp<ViewStyle>
  uri: string
}

type NativeRemoteImageProps = ViewProps & {
  contentFit: RemoteImageContentFit
  images: string[]
  index: number
  label?: string
  siteReferer?: string
  uri: string
}

// iOS renders through the vendored SDWebImage view (Referer + native viewer).
// Android uses expo-image with the same header and the JS preview host.
const NativeRemoteImage: ComponentType<NativeRemoteImageProps> | null =
  Platform.OS === 'ios'
    ? requireNativeViewManager<NativeRemoteImageProps>(
        'ExpoDomWebViewModule',
        'RemoteImage',
      )
    : null

export function RemoteImage({
  accessibilityLabel,
  contentFit = 'cover',
  images,
  index = 0,
  siteReferer,
  style,
  uri,
  ...rest
}: RemoteImageProps) {
  if (NativeRemoteImage) {
    return (
      <NativeRemoteImage
        {...rest}
        accessibilityLabel={accessibilityLabel}
        contentFit={contentFit}
        images={images ?? []}
        index={index}
        label={accessibilityLabel}
        siteReferer={siteReferer}
        uri={uri}
      />
    )
  }

  return (
    <Pressable
      {...rest}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="imagebutton"
      onPress={() => {
        void presentImagePreview({
          index,
          siteReferer,
          urls: images && images.length > 0 ? images : [uri],
        })
      }}
      style={style}
    >
      <Image
        accessible
        accessibilityLabel={accessibilityLabel}
        contentFit={contentFit}
        recyclingKey={uri}
        source={
          siteReferer
            ? { headers: { Referer: siteReferer }, uri }
            : { uri }
        }
        style={{ height: '100%', width: '100%' }}
        transition={160}
      />
    </Pressable>
  )
}
