import { StyleSheet, View } from 'react-native'

import { AppText, RemoteImage } from '@/components/ui'
import { getSiteUrl } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'

import { type BlockProps, num, str } from './types'

export function ImageBlock({ gallery, node }: BlockProps) {
  const palette = usePalette()
  const src = str(node.src)
  const width = num(node.width)
  const height = num(node.height)
  const ratio = width && height ? width / height : 4 / 3
  const caption = str(node.caption) || str(node.altText)
  if (!src) return null
  const images = gallery && gallery.includes(src) ? gallery : [src]
  return (
    <View style={styles.wrap}>
      <RemoteImage
        accessibilityLabel={caption}
        contentFit="cover"
        images={images}
        index={Math.max(0, images.indexOf(src))}
        siteReferer={getSiteUrl()}
        uri={src}
        style={[
          styles.image,
          { aspectRatio: ratio, backgroundColor: palette.neutral[2] },
        ]}
      />
      {caption ? (
        <AppText
          color={palette.neutral[6]}
          style={styles.caption}
          variant="meta"
        >
          {caption}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 12, gap: 8 },
  image: { width: '100%', borderRadius: 6, overflow: 'hidden' },
  caption: { textAlign: 'center' },
})
