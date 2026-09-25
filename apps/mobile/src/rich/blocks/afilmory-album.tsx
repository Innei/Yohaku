import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Image, StyleSheet, View } from 'react-native'

import { AppText, NativePressable, Paper, RemoteImage } from '@/components/ui'
import { noteCoverPlaceholderUri } from '@/screens/lists/note-cover'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import {
  type AfilmoryPhoto,
  type AfilmorySource,
  type AlbumTile,
  albumTiles,
  filterHref,
  masonryColumns,
  searchBody,
  summarizeSource,
} from './afilmory'
import { AfilmoryMark } from './afilmory-polaroid'
import { MediaCarousel } from './media-carousel'
import { useBoneColor } from './skeleton'

const LIST_LIMIT = 24
const FILTER_LIMIT = 12
const MAX_TILES = 6
const BODY_PADDING = 4
const FILTER_BONE_RATIOS = [0.75, 1.25, 1, 1.4, 0.8, 1.1]

export async function fetchAlbum(
  baseUrl: string,
  source: AfilmorySource,
  limit: number,
): Promise<{ photos: AfilmoryPhoto[]; total: number }> {
  const base = baseUrl.replace(/\/$/, '')
  if (source.kind === 'list') {
    const ids = source.items.slice(0, limit).map((item) => item.id)
    const res = await fetch(
      `${base}/api/manifest/photos?${new URLSearchParams({ ids: ids.join(',') })}`,
    )
    if (!res.ok) throw new Error(`${res.status}`)
    const photos: AfilmoryPhoto[] = await res.json()
    return { photos, total: source.items.length }
  }
  const res = await fetch(`${base}/api/manifest/photos/search`, {
    body: JSON.stringify(searchBody(source.filter, limit)),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json: { data: AfilmoryPhoto[]; total?: number } = await res.json()
  return { photos: json.data, total: json.total ?? json.data.length }
}

function Tile({
  fulls,
  overflow,
  tile,
}: {
  fulls: string[]
  overflow?: number
  tile: AlbumTile
}) {
  const bone = useBoneColor()
  const placeholderUri = tile.hash ? noteCoverPlaceholderUri(tile.hash) : null
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: bone }]}>
      {placeholderUri ? (
        <Image
          source={{ uri: placeholderUri }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {tile.thumb ? (
        <RemoteImage
          contentFit="cover"
          images={fulls}
          index={tile.full ? fulls.indexOf(tile.full) : 0}
          style={StyleSheet.absoluteFill}
          uri={tile.thumb}
        />
      ) : null}
      {overflow ? (
        <View pointerEvents="none" style={styles.overflowPill}>
          <AppText color="#fdfcf9" variant="meta">
            +{overflow}
          </AppText>
        </View>
      ) : null}
    </View>
  )
}

function Masonry({ fulls, tiles }: { fulls: string[]; tiles: AlbumTile[] }) {
  const shown = tiles.slice(0, MAX_TILES)
  const overflow = tiles.length - shown.length
  const lastIndex = shown.length - 1
  return (
    <View style={styles.masonry}>
      {masonryColumns(shown).map((column) => (
        <View key={column.join('-')} style={styles.column}>
          {column.map((index) => {
            const tile = shown[index]!
            return (
              <View
                key={tile.id}
                style={[
                  styles.masonryTile,
                  {
                    aspectRatio: tile.w > 0 && tile.h > 0 ? tile.w / tile.h : 1,
                  },
                ]}
              >
                <Tile
                  fulls={fulls}
                  overflow={index === lastIndex ? overflow : 0}
                  tile={tile}
                />
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

export function AfilmoryAlbum({
  baseUrl,
  caption,
  fallback,
  layout,
  limit,
  source,
  title,
}: {
  baseUrl: string
  caption?: string
  fallback: ReactNode
  layout?: string
  limit?: number
  source: AfilmorySource
  title?: string
}) {
  const doc = useRichDocument()
  const palette = usePalette()
  const bone = useBoneColor()
  const cap = limit ?? (source.kind === 'list' ? LIST_LIMIT : FILTER_LIMIT)
  const query = useQuery({
    queryFn: () => fetchAlbum(baseUrl, source, cap),
    queryKey: ['afilmory-album', baseUrl, source, cap],
    staleTime: Infinity,
  })

  if (query.isError || query.data?.photos.length === 0) return fallback

  const tiles = query.data
    ? albumTiles(baseUrl, source, query.data.photos).slice(0, cap)
    : source.kind === 'list'
      ? albumTiles(baseUrl, source, []).slice(0, cap)
      : null
  const fulls = (tiles ?? [])
    .map((tile) => tile.full)
    .filter((full): full is string => Boolean(full))
  const total =
    query.data?.total ?? (source.kind === 'list' ? source.items.length : 0)

  let body: ReactNode
  if (!tiles) {
    body = (
      <View style={styles.masonry}>
        {[0, 1].map((column) => (
          <View key={column} style={styles.column}>
            {FILTER_BONE_RATIOS.filter((_, i) => i % 2 === column).map(
              (ratio) => (
                <View
                  key={ratio}
                  style={[{ aspectRatio: ratio, backgroundColor: bone }]}
                />
              ),
            )}
          </View>
        ))}
      </View>
    )
  } else if (layout === 'carousel') {
    const carouselItems = tiles.map((tile) => ({
      height: tile.h,
      key: tile.id,
      width: tile.w,
    }))
    body = (
      <MediaCarousel
        bleed={BODY_PADDING}
        items={carouselItems}
        radius={0}
        renderItem={(index) => <Tile fulls={fulls} tile={tiles[index]!} />}
      />
    )
  } else {
    body = <Masonry fulls={fulls} tiles={tiles} />
  }

  return (
    <View style={styles.wrap}>
      <Paper style={styles.frame}>
        <View
          style={[styles.header, { borderBottomColor: palette.neutral[3] }]}
        >
          <View style={styles.headerText}>
            {title ? (
              <AppText
                numberOfLines={1}
                style={styles.title}
                variant="secondary"
              >
                {title}
              </AppText>
            ) : null}
            <AppText
              color={palette.neutral[6]}
              numberOfLines={1}
              style={styles.summary}
            >
              {query.data || source.kind === 'list'
                ? summarizeSource(source, total)
                : ''}
            </AppText>
          </View>
          <AfilmoryMark label="AFILMORY" />
          <NativePressable
            haptic={false}
            style={styles.viewAll}
            onPress={() =>
              doc.onLinkPress?.(
                source.kind === 'filter'
                  ? filterHref(baseUrl, source.filter)
                  : `${baseUrl.replace(/\/$/, '')}/`,
              )
            }
          >
            <AppText color={palette.accent} variant="secondary">
              全部 ↗
            </AppText>
          </NativePressable>
        </View>
        <View style={styles.body}>{body}</View>
      </Paper>
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
  wrap: { gap: 10, marginVertical: 12 },
  frame: { overflow: 'hidden' },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 14,
    paddingRight: 14,
  },
  headerText: { flex: 1, gap: 2, minWidth: 0, paddingVertical: 10 },
  title: { ...fonts.sansSemiBold },
  summary: { ...fonts.mono, fontSize: 10.5, lineHeight: 14 },
  viewAll: { justifyContent: 'center', minHeight: 44 },
  body: { padding: BODY_PADDING },
  masonry: { flexDirection: 'row', gap: 4 },
  column: { flex: 1, gap: 4, minWidth: 0 },
  masonryTile: { overflow: 'hidden', width: '100%' },
  overflowPill: {
    backgroundColor: 'rgba(20,19,18,0.62)',
    borderRadius: 999,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    right: 8,
  },
  caption: { textAlign: 'center' },
})
