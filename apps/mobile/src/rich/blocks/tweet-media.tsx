import { YohakuVideo } from '@modules/yohaku'
import { neutral } from '@yohaku/design-system/tokens'
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native'

import { RemoteImage } from '@/components/ui'

import { MediaCarousel } from './media-carousel'
import { singleMediaRatio } from './media-carousel-layout'
import type { TweetMedia } from './tweet'

const MEDIA_RADIUS = 12
const VIDEO_BACKDROP = neutral.light[10]

function MediaTile({
  item,
  photoIndex,
  photos,
  style,
}: {
  item: TweetMedia
  photoIndex: number
  photos: string[]
  style: StyleProp<ViewStyle>
}) {
  if (item.kind === 'photo') {
    return (
      <RemoteImage
        contentFit="cover"
        images={photos}
        index={photoIndex}
        style={style}
        uri={item.url}
      />
    )
  }
  return (
    <YohakuVideo
      backdropColor={VIDEO_BACKDROP}
      loop={item.kind === 'gif'}
      poster={item.url}
      src={item.videoUrl!}
      style={[style, { backgroundColor: VIDEO_BACKDROP }]}
    />
  )
}

export function TweetMediaView({
  bleed,
  media,
}: {
  bleed: number
  media: TweetMedia[]
}) {
  if (media.length === 0) return null
  const photos = media
    .filter((item) => item.kind === 'photo')
    .map((item) => item.url)
  const photoIndexOf = (item: TweetMedia) => photos.indexOf(item.url)

  if (media.length === 1) {
    const item = media[0]!
    return (
      <MediaTile
        item={item}
        photoIndex={photoIndexOf(item)}
        photos={photos}
        style={[styles.single, { aspectRatio: singleMediaRatio(item) }]}
      />
    )
  }

  return (
    <MediaCarousel
      bleed={bleed}
      items={media.map((item) => ({ ...item, key: item.url }))}
      radius={MEDIA_RADIUS}
      renderItem={(index) => (
        <MediaTile
          item={media[index]!}
          photoIndex={photoIndexOf(media[index]!)}
          photos={photos}
          style={StyleSheet.absoluteFill}
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  single: {
    borderRadius: MEDIA_RADIUS,
    overflow: 'hidden',
    width: '100%',
  },
})
