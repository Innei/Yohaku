import type { FC, MouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { imagePreviewSourceFromElement, useOptionalHost } from '../../../host'
import { clsxm } from '../../../lib/clsxm'
import { rasterizeSvgMarkupToPng } from '../../../lib/rasterize-to-png'
import {
  openSceneInNewWindow,
  serializeStandaloneSceneSvg,
} from './open-in-new-window'
import { computeSceneBounds, SceneContent } from './Scene'
import type { BinaryFiles, ExcalidrawScene, StaticTheme } from './types'

interface Transform {
  s: number
  tx: number
  ty: number
}

interface InteractiveSceneProps {
  className?: string
  files?: BinaryFiles
  scene: ExcalidrawScene
  showExpand?: boolean
  theme?: StaticTheme
}

const MIN_SCALE = 0.05
const MAX_SCALE = 16
const FIT_PADDING = 32

export const InteractiveScene: FC<InteractiveSceneProps> = ({
  className,
  files,
  scene,
  showExpand = false,
  theme = 'light',
}) => {
  const host = useOptionalHost()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [transform, setTransform] = useState<Transform>({ s: 1, tx: 0, ty: 0 })
  const transformRef = useRef(transform)
  const userInteractedRef = useRef(false)

  const bounds = useMemo(
    () => computeSceneBounds(scene.elements.filter((el) => !el.isDeleted)),
    [scene],
  )

  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  useLayoutEffect(() => {
    const node = containerRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    setSize({ w: rect.width, h: rect.height })
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const computeFit = useCallback((): Transform => {
    if (!size.w || !size.h) return { s: 1, tx: 0, ty: 0 }
    const sceneW = bounds.width || 1
    const sceneH = bounds.height || 1
    const s = Math.max(
      MIN_SCALE,
      Math.min(
        MAX_SCALE,
        Math.min(
          (size.w - FIT_PADDING * 2) / sceneW,
          (size.h - FIT_PADDING * 2) / sceneH,
        ),
      ),
    )
    const tx = size.w / 2 - (bounds.minX + sceneW / 2) * s
    const ty = size.h / 2 - (bounds.minY + sceneH / 2) * s
    return { s, tx, ty }
  }, [size, bounds])

  const fitToContent = useCallback(() => {
    setTransform(computeFit())
    userInteractedRef.current = false
  }, [computeFit])

  useLayoutEffect(() => {
    if (userInteractedRef.current) return
    if (!size.w || !size.h) return
    setTransform(computeFit())
  }, [size, computeFit])

  useEffect(() => {
    userInteractedRef.current = false
  }, [scene])

  const zoomAt = useCallback(
    (factor: number, anchorX: number, anchorY: number) => {
      const t = transformRef.current
      const newS = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.s * factor))
      const k = newS / t.s
      if (k === 1) return
      userInteractedRef.current = true
      setTransform({
        s: newS,
        tx: anchorX - (anchorX - t.tx) * k,
        ty: anchorY - (anchorY - t.ty) * k,
      })
    },
    [],
  )

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const rect = node.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      zoomAt(factor, cx, cy)
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const panRef = useRef<{
    origTx: number
    origTy: number
    startX: number
    startY: number
  } | null>(null)
  const pinchRef = useRef<{
    distance: number
    midContainerX: number
    midContainerY: number
    origScale: number
    origTx: number
    origTy: number
  } | null>(null)
  const downRef = useRef<{
    moved: boolean
    pointerId: number
    time: number
    x: number
    y: number
  } | null>(null)

  const startPan = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origTx: transformRef.current.tx,
      origTy: transformRef.current.ty,
    }
  }, [])

  const startPinch = useCallback(() => {
    const pts = [...pointersRef.current.values()]
    if (pts.length < 2) return
    const dx = pts[0].x - pts[1].x
    const dy = pts[0].y - pts[1].y
    const node = containerRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    pinchRef.current = {
      distance: Math.hypot(dx, dy) || 1,
      origScale: transformRef.current.s,
      origTx: transformRef.current.tx,
      origTy: transformRef.current.ty,
      midContainerX: (pts[0].x + pts[1].x) / 2 - rect.left,
      midContainerY: (pts[0].y + pts[1].y) / 2 - rect.top,
    }
  }, [])

  const handleExpand = useCallback(async () => {
    if (host?.diagramPreview === 'openImage') {
      const svg = serializeStandaloneSceneSvg({
        bounds,
        includeFonts: false,
        origin: host.webOrigin || window.location.origin,
        pixelSize: true,
        svgElement: svgRef.current,
        theme,
      })
      const frame = containerRef.current
      if (!svg || !frame) return
      try {
        const png = await rasterizeSvgMarkupToPng(svg)
        void host.openImage({
          images: [png],
          index: 0,
          source: imagePreviewSourceFromElement(frame, png),
          src: png,
        })
      } catch {
        const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
        void host.openImage({
          images: [svgUrl],
          index: 0,
          source: imagePreviewSourceFromElement(frame, svgUrl),
          src: svgUrl,
        })
      }
      return
    }
    openSceneInNewWindow({
      svgElement: svgRef.current,
      bounds,
      theme,
    })
  }, [bounds, host, theme])

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size === 1) {
      startPan(e)
      downRef.current = {
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
        moved: false,
      }
    } else if (pointersRef.current.size === 2) {
      panRef.current = null
      downRef.current = null
      startPinch()
    }
  }

  const CLICK_THRESHOLD_PX = 8
  const CLICK_THRESHOLD_MS = 280

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (downRef.current && downRef.current.pointerId === e.pointerId) {
      const dx = e.clientX - downRef.current.x
      const dy = e.clientY - downRef.current.y
      if (dx * dx + dy * dy > CLICK_THRESHOLD_PX * CLICK_THRESHOLD_PX) {
        downRef.current.moved = true
      }
    }

    if (pinchRef.current && pointersRef.current.size === 2) {
      userInteractedRef.current = true
      const pts = [...pointersRef.current.values()]
      const dx = pts[0].x - pts[1].x
      const dy = pts[0].y - pts[1].y
      const dist = Math.hypot(dx, dy) || 1
      const ratio = dist / pinchRef.current.distance
      const newS = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, pinchRef.current.origScale * ratio),
      )
      const k = newS / pinchRef.current.origScale
      setTransform({
        s: newS,
        tx:
          pinchRef.current.midContainerX -
          (pinchRef.current.midContainerX - pinchRef.current.origTx) * k,
        ty:
          pinchRef.current.midContainerY -
          (pinchRef.current.midContainerY - pinchRef.current.origTy) * k,
      })
      return
    }

    if (panRef.current && pointersRef.current.size === 1) {
      const dx = e.clientX - panRef.current.startX
      const dy = e.clientY - panRef.current.startY
      const origTx = panRef.current.origTx
      const origTy = panRef.current.origTy
      if (downRef.current?.moved) userInteractedRef.current = true
      setTransform((t) => ({
        s: t.s,
        tx: origTx + dx,
        ty: origTy + dy,
      }))
    }
  }

  const releasePointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 0) panRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const wasClick =
      downRef.current?.pointerId === e.pointerId &&
      !downRef.current.moved &&
      Date.now() - downRef.current.time < CLICK_THRESHOLD_MS

    releasePointer(e)
    downRef.current = null

    if (wasClick && showExpand) {
      void handleExpand()
    }
  }

  const handlePointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    releasePointer(e)
    downRef.current = null
  }

  const isDark = theme === 'dark'

  return (
    <div
      data-color-scheme={theme}
      ref={containerRef}
      style={{ cursor: panRef.current ? 'grabbing' : 'grab' }}
      className={clsxm(
        'group/excalidraw relative size-full touch-none select-none overflow-hidden',
        className,
      )}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerCancel}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <svg
        className="block size-full"
        preserveAspectRatio="xMinYMin meet"
        ref={svgRef}
        role="img"
        viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
        xmlns="http://www.w3.org/2000/svg"
        style={
          isDark ? { filter: 'invert(93%) hue-rotate(180deg)' } : undefined
        }
      >
        <g
          transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.s})`}
        >
          <SceneContent files={files} scene={scene} />
        </g>
      </svg>

      <Toolbar
        scale={transform.s}
        onExpand={showExpand ? () => void handleExpand() : undefined}
        onReset={fitToContent}
        onZoomIn={() => zoomAt(1.2, size.w / 2, size.h / 2)}
        onZoomOut={() => zoomAt(1 / 1.2, size.w / 2, size.h / 2)}
      />
    </div>
  )
}

interface ToolbarProps {
  onExpand?: () => void
  onReset: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  scale: number
}

const Toolbar: FC<ToolbarProps> = ({
  onExpand,
  onReset,
  onZoomIn,
  onZoomOut,
  scale,
}) => {
  return (
    <div
      className={clsxm(
        'absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-md border border-neutral-3 bg-(--surface-paper) px-1 py-1 text-sm',
        'opacity-0 transition-opacity duration-150 group-hover/excalidraw:opacity-100 focus-within:opacity-100',
        'pointer-coarse:opacity-90',
      )}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <ToolButton title="Zoom out (⌘/Ctrl + scroll)" onClick={onZoomOut}>
        <i className="i-mingcute-zoom-out-line" />
      </ToolButton>
      <span className="min-w-[3.25rem] px-1.5 text-center text-caption-12 text-neutral-7 tabular-nums">
        {Math.round(scale * 100)}%
      </span>
      <ToolButton title="Zoom in (⌘/Ctrl + scroll)" onClick={onZoomIn}>
        <i className="i-mingcute-zoom-in-line" />
      </ToolButton>
      <span className="mx-0.5 h-4 w-px bg-neutral-3" />
      <ToolButton title="Reset to fit" onClick={onReset}>
        <i className="i-mingcute-refresh-2-line" />
      </ToolButton>
      {onExpand && (
        <>
          <span className="mx-0.5 h-4 w-px bg-neutral-3" />
          <ToolButton title="Open SVG in new tab" onClick={onExpand}>
            <i className="i-mingcute-external-link-line" />
          </ToolButton>
        </>
      )}
    </div>
  )
}

const ToolButton: FC<{
  children: React.ReactNode
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  title: string
}> = ({ children, onClick, title }) => (
  <button
    aria-label={title}
    className="flex size-7 items-center justify-center rounded text-neutral-7 hover:bg-neutral-2 hover:text-neutral-10"
    title={title}
    type="button"
    onClick={onClick}
  >
    {children}
  </button>
)
