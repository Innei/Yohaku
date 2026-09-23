import { useQuery } from '@tanstack/react-query'
import { SymbolView } from 'expo-symbols'
import { Image, StyleSheet, View } from 'react-native'

import { AppText, NativePressable, Paper, RemoteImage } from '@/components/ui'
import { noteCoverPlaceholderUri } from '@/screens/lists/note-cover'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import {
  type AfilmoryListItem,
  type AfilmoryPhoto,
  exifLine,
  photoDetailHref,
  photoUrls,
  polaroidRatio,
} from './afilmory'

async function fetchPhoto(baseUrl: string, id: string): Promise<AfilmoryPhoto> {
  const res = await fetch(
    `${baseUrl.replace(/\/$/, '')}/api/manifest/photos/${encodeURIComponent(id)}`,
  )
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

export function AfilmoryMark({ label }: { label: string }) {
  const palette = usePalette()
  return (
    <View style={styles.mark}>
      <SymbolView
        name="camera.aperture"
        size={11}
        tintColor={palette.neutral[5]}
      />
      <AppText color={palette.neutral[5]} style={styles.markText}>
        {label}
      </AppText>
    </View>
  )
}

export function AfilmoryPolaroid({
  baseUrl,
  caption,
  item,
}: {
  baseUrl: string
  caption?: string
  item: AfilmoryListItem
}) {
  const doc = useRichDocument()
  const palette = usePalette()
  const query = useQuery({
    queryFn: () => fetchPhoto(baseUrl, item.id),
    queryKey: ['afilmory-photo', baseUrl, item.id],
    staleTime: Infinity,
  })
  const photo = query.data
  const { full, thumb } = photoUrls(baseUrl, photo)
  const hash = item.hash ?? photo?.thumbHash
  const placeholderUri = hash ? noteCoverPlaceholderUri(hash) : null
  const text = caption ?? photo?.description
  const dataLine = photo
    ? exifLine(photo.exif)
    : query.isError
      ? item.id
      : undefined

  return (
    <Paper style={styles.frame}>
      <View
        style={[
          styles.photo,
          { aspectRatio: polaroidRatio(item.w, item.h) },
          !placeholderUri && { backgroundColor: palette.neutral[3] },
        ]}
      >
        {placeholderUri ? (
          <Image
            source={{ uri: placeholderUri }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {photo && thumb ? (
          <RemoteImage
            accessibilityLabel={text ?? photo.title ?? item.id}
            contentFit="cover"
            images={full ? [full] : []}
            style={StyleSheet.absoluteFill}
            uri={thumb}
          />
        ) : null}
      </View>
      <View style={styles.foot}>
        {text ? (
          <AppText style={styles.caption} variant="body">
            {text}
          </AppText>
        ) : null}
        <View style={styles.dataRow}>
          <AppText
            color={palette.neutral[6]}
            style={styles.dataLine}
            variant="meta"
          >
            {dataLine ?? ''}
          </AppText>
          <NativePressable
            accessibilityLabel="在 Afilmory 中打开"
            haptic={false}
            style={styles.openButton}
            onPress={() => doc.onLinkPress?.(photoDetailHref(baseUrl, item.id))}
          >
            <AfilmoryMark label="AFILMORY ↗" />
          </NativePressable>
        </View>
      </View>
    </Paper>
  )
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 6,
    marginVertical: 12,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  photo: { borderRadius: 2, overflow: 'hidden', width: '100%' },
  foot: { gap: 2, paddingHorizontal: 6, paddingTop: 12 },
  caption: { lineHeight: 25 },
  dataRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  dataLine: {
    ...fonts.mono,
    flex: 1,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    lineHeight: 16,
  },
  openButton: { justifyContent: 'center', minHeight: 44 },
  mark: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  markText: { ...fonts.mono, fontSize: 9, letterSpacing: 1.3, lineHeight: 12 },
})
