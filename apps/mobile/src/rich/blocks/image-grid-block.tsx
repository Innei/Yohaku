import { useQuery } from '@tanstack/react-query'
import { radius } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import type { ReactNode } from 'react'
import {
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native'

import { AppText, NativePressable, RemoteImage } from '@/components/ui'
import { noteCoverPlaceholderUri } from '@/screens/lists/note-cover'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import { UnsupportedBlock } from './card-blocks'
import {
  afilmoryIds,
  afilmoryImages,
  type AfilmoryManifestPhoto,
  galleryImages,
  type GridImage,
  gridRows,
} from './image-grid'
import { type BlockProps, str } from './types'

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

function formatShutter(value: number | string | undefined): string | null {
  if (value === undefined || value === '') return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    return value >= 1 ? `${value}s` : `1/${Math.round(1 / value)}s`
  }
  return value.includes('/') ? `${value}s` : value
}

function exifLine(exif: AfilmoryManifestPhoto['exif']): string | undefined {
  if (!exif) return undefined
  return (
    [
      exif.Model,
      exif.LensModel,
      typeof exif.FNumber === 'number' ? `ƒ/${exif.FNumber}` : undefined,
      formatShutter(exif.ExposureTime),
      typeof exif.ISO === 'number' ? `ISO ${exif.ISO}` : undefined,
    ]
      .filter((part): part is string => Boolean(part))
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

export function ImageGrid({
  caption,
  footer,
  images,
}: {
  caption?: string
  footer?: ReactNode
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
      {footer ??
        (caption ? (
          <AppText
            color={palette.neutral[6]}
            style={styles.caption}
            variant="meta"
          >
            {caption}
          </AppText>
        ) : null)}
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

function AfilmoryFooter({
  baseUrl,
  photo,
}: {
  baseUrl: string
  photo: AfilmoryManifestPhoto
}) {
  const doc = useRichDocument()
  const palette = usePalette()
  return (
    <View style={styles.footerRow}>
      <AppText
        color={palette.neutral[6]}
        style={styles.exifText}
        variant="meta"
      >
        {exifLine(photo.exif) ?? photo.id}
      </AppText>
      <NativePressable
        accessibilityLabel="在 Afilmory 中打开"
        haptic={false}
        style={styles.openButton}
        onPress={() =>
          doc.onLinkPress?.(
            `${baseUrl.replace(/\/$/, '')}/photos/${encodeURIComponent(photo.id)}`,
          )
        }
      >
        <SymbolView
          name="arrow.up.right.square"
          size={16}
          tintColor={palette.neutral[6]}
        />
      </NativePressable>
    </View>
  )
}

function AfilmorySkeleton({
  items,
}: {
  items: { h: number; id: string; w: number }[]
}) {
  const palette = usePalette()
  const contentWidth = useContentWidth()
  const scale = contentWidth / MOCKUP_CONTENT_WIDTH
  const bone = { backgroundColor: palette.neutral[3] }

  if (items.length <= 1) {
    const ratio = items[0]
      ? ratioOf({ height: items[0].h, width: items[0].w })
      : 1
    return (
      <View style={styles.wrap}>
        <View
          style={[
            bone,
            { borderRadius: radius.control, height: contentWidth / ratio },
          ]}
        />
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.grid, { borderRadius: radius.control }]}>
        {gridRows(items.length).rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((index) => (
              <View
                key={index}
                style={[bone, { flex: 1, height: rowHeight(row, scale) }]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

async function fetchAfilmoryPhotos(
  baseUrl: string,
  ids: string[],
): Promise<AfilmoryManifestPhoto[]> {
  const qs = new URLSearchParams({ ids: ids.join(',') })
  const res = await fetch(
    `${baseUrl.replace(/\/$/, '')}/api/manifest/photos?${qs.toString()}`,
  )
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

export function AfilmoryBlock({ blockId, node }: BlockProps) {
  const baseUrl = str(node.baseUrl)
  const ids = afilmoryIds(node)
  const enabled = Boolean(baseUrl) && ids !== null && ids.length > 0

  const query = useQuery({
    enabled,
    queryFn: () => fetchAfilmoryPhotos(baseUrl, ids!),
    queryKey: ['afilmory-photos', baseUrl, ids],
    staleTime: Infinity,
  })

  if (!enabled) return <UnsupportedBlock blockId={blockId} node={node} />

  if (query.isPending) {
    const source = node.source as
      { items?: { h: number; id: string; w: number }[] } | undefined
    return <AfilmorySkeleton items={source?.items ?? []} />
  }

  if (query.isError || !query.data || query.data.length === 0) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }

  const images = afilmoryImages(baseUrl, query.data)
  if (images.length === 1) {
    return (
      <ImageGrid
        footer={<AfilmoryFooter baseUrl={baseUrl} photo={query.data[0]!} />}
        images={images}
      />
    )
  }
  return <ImageGrid caption={captionOf(images)} images={images} />
}

const styles = StyleSheet.create({
  caption: { textAlign: 'center' },
  exifText: { flex: 1, fontVariant: ['tabular-nums'] },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
  },
  grid: { gap: 4, overflow: 'hidden' },
  openButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    margin: -12,
    marginLeft: 0,
    width: 44,
  },
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
