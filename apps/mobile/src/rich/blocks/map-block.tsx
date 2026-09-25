import { YohakuTrackMap } from '@modules/yohaku'
import { useQuery } from '@tanstack/react-query'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { Modal, StyleSheet, View } from 'react-native'

import { AppText, NativePressable, Paper } from '@/components/ui'
import { usePalette } from '@/theme/palette'

import { UnsupportedBlock } from './card-blocks'
import {
  trackBounds,
  type TrackPolyline,
  trackPolylines,
  type TrackSummary,
  trackSummary,
} from './map-track'
import { useBoneColor } from './skeleton'
import { type BlockProps, str } from './types'

const MAP_RATIO = 350 / 220

interface Track {
  polylines: TrackPolyline[]
  summary: TrackSummary
}

export async function fetchTrack(url: string): Promise<Track | null> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status}`)
  const json: unknown = await res.json()
  const polylines = trackPolylines(json)
  if (!trackBounds(polylines)) return null
  return { polylines, summary: trackSummary(json) }
}

export function track(node: BlockProps['node']): string {
  const value = node.track
  return value && typeof value === 'object'
    ? str((value as Record<string, unknown>).url)
    : ''
}

function MapSkeleton({ title }: { title: string }) {
  const bone = useBoneColor()
  return (
    <Paper style={styles.card}>
      <View style={[styles.map, { backgroundColor: bone }]} />
      <View style={styles.caption}>
        <View style={styles.captionText}>
          {title ? (
            <AppText numberOfLines={1} style={styles.title}>
              {title}
            </AppText>
          ) : null}
          <View style={[styles.skeletonLine, { backgroundColor: bone }]} />
        </View>
        <View style={styles.expand} />
      </View>
    </Paper>
  )
}

export function MapBlock({ blockId, node }: BlockProps) {
  const palette = usePalette()
  const bone = useBoneColor()
  const url = track(node)
  const title = str(node.title)
  const [expanded, setExpanded] = useState(false)

  const query = useQuery({
    enabled: url !== '',
    queryFn: () => fetchTrack(url),
    queryKey: ['map-track', url],
    staleTime: Infinity,
  })

  if (query.isPending && url) return <MapSkeleton title={title} />
  if (!url || query.isError || !query.data) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }

  const { polylines, summary } = query.data
  const summaryLine = [summary.distanceKm, summary.duration]
    .filter(Boolean)
    .join(' · ')

  return (
    <Paper style={styles.card}>
      <YohakuTrackMap
        accessibilityElementsHidden
        accentColor={palette.accent}
        paperColor={palette.surface.paper}
        polylines={polylines}
        style={[styles.map, { backgroundColor: bone }]}
        onNativePress={() => setExpanded(true)}
      />
      <View style={styles.caption}>
        <View style={styles.captionText}>
          {title ? (
            <AppText numberOfLines={1} style={styles.title}>
              {title}
            </AppText>
          ) : null}
          {summaryLine ? (
            <AppText
              color={palette.neutral[6]}
              style={styles.summary}
              variant="secondary"
            >
              {summaryLine}
            </AppText>
          ) : null}
        </View>
        <NativePressable
          accessibilityLabel="全屏查看地图"
          haptic={false}
          style={styles.expand}
          onPress={() => setExpanded(true)}
        >
          <SymbolView
            name="arrow.up.left.and.arrow.down.right"
            size={16}
            tintColor={palette.neutral[7]}
          />
        </NativePressable>
      </View>
      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        visible={expanded}
        onRequestClose={() => setExpanded(false)}
      >
        <View style={[styles.sheet, { backgroundColor: bone }]}>
          <YohakuTrackMap
            interactive
            accentColor={palette.accent}
            paperColor={palette.surface.paper}
            polylines={polylines}
            style={StyleSheet.absoluteFill}
          />
          <NativePressable
            accessibilityLabel="关闭地图"
            style={[styles.close, { backgroundColor: palette.surface.paper }]}
            onPress={() => setExpanded(false)}
          >
            <SymbolView name="xmark" size={15} tintColor={palette.neutral[8]} />
          </NativePressable>
        </View>
      </Modal>
    </Paper>
  )
}

const styles = StyleSheet.create({
  card: { marginVertical: 12, overflow: 'hidden' },
  map: { width: '100%', aspectRatio: MAP_RATIO },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 6,
  },
  captionText: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  summary: { fontVariant: ['tabular-nums'] },
  expand: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonLine: { width: '42%', height: 12, borderRadius: 6 },
  sheet: { flex: 1 },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
