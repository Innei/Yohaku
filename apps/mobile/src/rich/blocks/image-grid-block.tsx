import { radius } from '@yohaku/design-system/tokens'
import {
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native'

import { AppText, RemoteImage } from '@/components/ui'
import { noteCoverPlaceholderUri } from '@/screens/lists/note-cover'
import { usePalette } from '@/theme/palette'

import { UnsupportedBlock } from './card-blocks'
import { galleryImages, type GridImage, gridRows } from './image-grid'
import type { BlockProps } from './types'

const MOCKUP_CONTENT_WIDTH = 350
const FULL_ROW_HEIGHT = 236
const PAIR_ROW_HEIGHT = 172
const PORTRAIT_RATIO_CAP = 4 / 5

function useContentWidth(): number {
  const { width } = useWindowDimensions()
  return Math.round(Math.max(280, width - 40 - 16))
}

function ratioOf(image: { height?: number; width?: number }): number {
  const raw = image.width && image.height ? image.width / image.height : 4 / 3
  return Math.max(raw, PORTRAIT_RATIO_CAP)
}

function rowHeight(row: number[], scale: number): number {
  return (row.length === 1 ? FULL_ROW_HEIGHT : PAIR_ROW_HEIGHT) * scale
}

function captionOf(images: GridImage[]): string | undefined {
  return (
    images
      .map((image) => image.alt)
      .filter((alt): alt is string => Boolean(alt))
      .join(' · ') || undefined
  )
}

function Tile({
  fullUrls,
  height,
  image,
  index,
  overflow,
  style,
}: {
  fullUrls: string[]
  height: number
  image: GridImage
  index: number
  overflow?: number
  style?: ViewStyle
}) {
  const palette = usePalette()
  const placeholderUri = image.thumbhash
    ? noteCoverPlaceholderUri(image.thumbhash)
    : null
  return (
    <View
      style={[
        styles.tile,
        { height },
        !placeholderUri && { backgroundColor: palette.neutral[3] },
        style,
      ]}
    >
      {placeholderUri ? (
        <Image
          source={{ uri: placeholderUri }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <RemoteImage
        accessibilityLabel={image.alt}
        contentFit="cover"
        images={fullUrls}
        index={index}
        style={StyleSheet.absoluteFill}
        uri={image.src}
      />
      {overflow ? (
        <View style={styles.overflowPill}>
          <AppText color="#fdfcf9" variant="meta">
            +{overflow}
          </AppText>
        </View>
      ) : null}
    </View>
  )
}

function ImageGrid({
  caption,
  images,
}: {
  caption?: string
  images: GridImage[]
}) {
  const palette = usePalette()
  const contentWidth = useContentWidth()
  const scale = contentWidth / MOCKUP_CONTENT_WIDTH

  if (images.length === 0) return null

  const fullUrls = images.map((image) => image.full)
  const { overflow, rows } = gridRows(images.length)

  const grid =
    images.length === 1 ? (
      <Tile
        fullUrls={fullUrls}
        height={contentWidth / ratioOf(images[0]!)}
        image={images[0]!}
        index={0}
        style={{ borderRadius: radius.control, width: '100%' }}
      />
    ) : (
      <View style={[styles.grid, { borderRadius: radius.control }]}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((index) => {
              const isLastRow = rowIndex === rows.length - 1
              const isLastTile = index === row.at(-1)
              return (
                <Tile
                  fullUrls={fullUrls}
                  height={rowHeight(row, scale)}
                  image={images[index]!}
                  index={index}
                  key={index}
                  overflow={isLastRow && isLastTile ? overflow : undefined}
                  style={{ flex: 1 }}
                />
              )
            })}
          </View>
        ))}
      </View>
    )

  return (
    <View style={styles.wrap}>
      {grid}
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

export function GalleryBlock({ blockId, node }: BlockProps) {
  const images = galleryImages(node)
  if (images.length === 0) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }
  return <ImageGrid caption={captionOf(images)} images={images} />
}

const styles = StyleSheet.create({
  caption: { textAlign: 'center' },
  grid: { gap: 4, overflow: 'hidden' },
  overflowPill: {
    backgroundColor: 'rgba(20,19,18,0.62)',
    borderRadius: 999,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    right: 8,
  },
  row: { flexDirection: 'row', gap: 4 },
  tile: { overflow: 'hidden' },
  wrap: { gap: 10, marginVertical: 12 },
})
