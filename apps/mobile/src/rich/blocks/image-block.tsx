import { Image, StyleSheet, View } from 'react-native'

import { RemoteImage } from '@/components/ui'
import { getSiteUrl } from '@/lib/site-url'
import { noteCoverPlaceholderUri } from '@/screens/lists/note-cover'
import { usePalette } from '@/theme/palette'

import { MEDIA_RADIUS, MediaCaption } from './media-caption'
import { type BlockProps, num, str } from './types'

export function ImageBlock({ gallery, node }: BlockProps) {
  const palette = usePalette()
  const src = str(node.src)
  const width = num(node.width)
  const height = num(node.height)
  // ponytail: Markdown images carry no size, so they letterbox in a 4:3 frame; store the API's image meta if exact ratios matter.
  const ratio = width && height ? width / height : 4 / 3
  const caption = str(node.caption) || str(node.altText)
  const placeholder = noteCoverPlaceholderUri(str(node.thumbhash))
  if (!src) return null
  const images = gallery && gallery.includes(src) ? gallery : [src]
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.frame,
          { aspectRatio: ratio, backgroundColor: palette.neutral[2] },
        ]}
      >
        {placeholder ? (
          <Image
            source={{ uri: placeholder }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <RemoteImage
          accessibilityLabel={caption}
          contentFit={width && height ? 'cover' : 'contain'}
          images={images}
          index={Math.max(0, images.indexOf(src))}
          siteReferer={getSiteUrl()}
          style={StyleSheet.absoluteFill}
          uri={src}
        />
      </View>
      {caption ? <MediaCaption>{caption}</MediaCaption> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 12, gap: 10 },
  frame: {
    width: '100%',
    borderRadius: MEDIA_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
})
