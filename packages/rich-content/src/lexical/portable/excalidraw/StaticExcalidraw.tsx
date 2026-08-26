'use client'
import { sx } from '../../../lib/sx'
import { atoms } from '../../../styles/atoms.stylex'

import './fonts.css'

import type { FC } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useHost } from '../../../host'
import { clsxm } from '../../../lib/clsxm'
import { useResource } from '../../../lib/use-resource'
import { InteractiveScene } from './InteractiveScene'
import { normalizeScene, type ParsedSnapshot, parseSnapshot } from './parser'
import type { ExcalidrawScene, StaticTheme } from './types'
import { useLxgwFont } from './use-lxgw-font'

export interface StaticExcalidrawProps {
  className?: string
  data: string
  showExpandButton?: boolean
}

const VIEWPORT_MARGIN = '200px 0px'

function isReactNativeWebView(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
    (
      window as unknown as {
        ReactNativeWebView?: { postMessage?: unknown }
      }
    ).ReactNativeWebView,
  )
}

export const StaticExcalidraw: FC<StaticExcalidrawProps> = ({
  className,
  data,
  showExpandButton = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [entered, setEntered] = useState(isReactNativeWebView)

  useLxgwFont()

  useEffect(() => {
    if (entered) return
    const node = containerRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntered(true)
            observer.disconnect()
            return
          }
        }
      },
      { rootMargin: VIEWPORT_MARGIN, threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [entered])

  return (
    <div
      {...sx(atoms.relative, atoms.size_full, atoms.overflow_hidden, className)}
      ref={containerRef}
    >
      {entered ? (
        <StaticExcalidrawInner
          data={data}
          showExpandButton={showExpandButton}
        />
      ) : (
        <Placeholder />
      )}
    </div>
  )
}

const Placeholder: FC<{ label?: string }> = ({ label = 'Whiteboard' }) => (
  <div {...sx(atoms.absolute, atoms.inset_0, atoms.flex, atoms.items_center, atoms.justify_center, atoms.text_neutral_7)}>
    <span {...sx(atoms.text_sm)}>{label}</span>
  </div>
)

function ExcalidrawLoading() {
  return (
    <div
      aria-hidden
      {...sx(atoms.my_6, atoms.h_64, atoms.w_full, atoms.animate_pulse, atoms.rounded_xl, atoms.bg____color_neutral_2)}
    />
  )
}

const ErrorMessage: FC<{ message: string }> = ({ message }) => (
  <div {...sx(atoms.absolute, atoms.inset_0, atoms.flex, atoms.items_center, atoms.justify_center, atoms.text_sm, atoms.text_red_500)}>
    {message}
  </div>
)

const StaticExcalidrawInner: FC<{
  data: string
  showExpandButton: boolean
}> = ({ data, showExpandButton }) => {
  const host = useHost()
  const theme: StaticTheme = host.theme

  const parsed = useMemo<ParsedSnapshot>(
    () => parseSnapshot(data, host.apiBase),
    [data, host.apiBase],
  )

  const inlineScene = parsed.kind === 'inline' ? parsed.scene : null

  const fetchUrl =
    parsed.kind === 'remote' || parsed.kind === 'incremental'
      ? parsed.fetchUrl
      : null
  const delta = parsed.kind === 'incremental' ? parsed.delta : null

  const remoteResource = useResource(fetchUrl, async () => {
    if (!fetchUrl) throw new Error('No fetch url')
    return host.fetchJSON(fetchUrl)
  })

  const remoteScene = useRemoteScene(remoteResource.data, delta)

  if (parsed.kind === 'error') return <ErrorMessage message={parsed.error} />
  if (parsed.kind === 'empty') return <Placeholder label="Empty whiteboard" />

  const scene = inlineScene ?? remoteScene

  if (!scene) {
    if (remoteResource.error) {
      return (
        <ErrorMessage
          message={(remoteResource.error as Error)?.message || 'Failed to load'}
        />
      )
    }
    if (remoteResource.data !== undefined && !remoteResource.isLoading) {
      return <ErrorMessage message="Invalid whiteboard data" />
    }
    return <ExcalidrawLoading />
  }

  return (
    <SceneFrame
      scene={scene}
      showExpandButton={showExpandButton}
      theme={theme}
    />
  )
}

function useRemoteScene(
  raw: unknown,
  delta: object | null,
): ExcalidrawScene | null {
  const [patched, setPatched] = useState<ExcalidrawScene | null>(null)

  useEffect(() => {
    if (!raw) {
      setPatched(null)
      return
    }
    if (!delta) {
      setPatched(normalizeScene(raw))
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { patch } = await import('jsondiffpatch')
        if (cancelled) return
        const next = patch(structuredClone(raw), delta as never)
        setPatched(normalizeScene(next))
      } catch {
        setPatched(normalizeScene(raw))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [raw, delta])

  return patched
}

const SceneFrame: FC<{
  scene: ExcalidrawScene
  showExpandButton: boolean
  theme: StaticTheme
}> = ({ scene, showExpandButton, theme }) => {
  return (
    <div {...sx(atoms.relative, atoms.size_full, atoms.overflow_hidden, atoms.rounded_md, atoms.bg____surface_paper, atoms.ring_1, atoms.ring_border)}>
      <InteractiveScene
        files={scene.files}
        scene={scene}
        showExpand={showExpandButton}
        theme={theme}
      />
    </div>
  )
}
