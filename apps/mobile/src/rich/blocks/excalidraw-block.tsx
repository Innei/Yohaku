import { YohakuNative } from '@modules/yohaku'
import {
  normalizeScene,
  parseSnapshot,
} from '@yohaku/rich-content/src/lexical/portable/excalidraw/parser.ts'
import {
  computeSceneBounds,
  Scene,
} from '@yohaku/rich-content/src/lexical/portable/excalidraw/Scene.tsx'
import type { ExcalidrawScene } from '@yohaku/rich-content/src/lexical/portable/excalidraw/types.ts'
import { patch } from 'jsondiffpatch'
import { useEffect, useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import { AppText, RemoteImage } from '@/components/ui'
import { reactToSvg } from '@/rich/svg-markup'
import { usePalette } from '@/theme/palette'

import { type BlockProps, str } from './types'

type Loaded =
  | { kind: 'error'; message: string }
  | { height: number; kind: 'ready'; uri: string; width: number }

async function loadScene(snapshot: string): Promise<ExcalidrawScene> {
  const parsed = parseSnapshot(snapshot, apiBaseUrl())
  if (parsed.kind === 'inline') return parsed.scene
  if (parsed.kind === 'error') throw new Error(parsed.error)
  if (parsed.kind === 'empty') throw new Error('Empty whiteboard')
  const response = await fetch(parsed.fetchUrl)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const raw: unknown = await response.json()
  const patched =
    parsed.kind === 'incremental'
      ? patch(structuredClone(raw), parsed.delta as never)
      : raw
  const scene = normalizeScene(patched)
  if (!scene) throw new Error('Invalid whiteboard data')
  return scene
}

export function ExcalidrawBlock({ node }: BlockProps) {
  const palette = usePalette()
  const { width: windowWidth } = useWindowDimensions()
  const snapshot = str(node.snapshot)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const targetWidth = Math.round(Math.max(320, windowWidth - 40 - 16))
  const bg = palette.surface.paper
  const theme = palette.theme

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const scene = await loadScene(snapshot)
        const bounds = computeSceneBounds(
          scene.elements.filter((el) => !el.isDeleted),
        )
        const svg = reactToSvg(
          <Scene files={scene.files} scene={scene} theme={theme} />,
        )
        const height = Math.round((targetWidth * bounds.height) / bounds.width)
        const rendered = await YohakuNative.rasterizeSvg({
          bg,
          height,
          svg,
          width: targetWidth,
        })
        if (!cancelled) setLoaded({ kind: 'ready', ...rendered })
      } catch (error) {
        if (!cancelled) {
          setLoaded({
            kind: 'error',
            message: error instanceof Error ? error.message : String(error),
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bg, snapshot, targetWidth, theme])

  if (!loaded) {
    return (
      <View
        style={[styles.placeholder, { backgroundColor: palette.neutral[2] }]}
      />
    )
  }
  if (loaded.kind === 'error') {
    return (
      <AppText color={palette.neutral[7]} variant="secondary">
        {loaded.message}
      </AppText>
    )
  }
  return (
    <View
      style={[
        styles.frame,
        { backgroundColor: bg, borderColor: palette.neutral[3] },
      ]}
    >
      <RemoteImage
        contentFit="contain"
        images={[loaded.uri]}
        index={0}
        style={{ width: '100%', aspectRatio: loaded.width / loaded.height }}
        uri={loaded.uri}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: { height: 200, borderRadius: 8, marginVertical: 12 },
  frame: {
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    padding: 8,
  },
})
