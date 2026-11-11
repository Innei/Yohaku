// The iOS app serialises this tree outside React render; the compiler's
// memo-cache hook would make that an invalid hook call.
'use no memo'

import type { CSSProperties, FC } from 'react'
import { Fragment, memo } from 'react'

import { fontFamilyToCss } from './fonts'
import { resolveRichTextHeights } from './richtext'
import { RichTextBody } from './RichTextBody'
import {
  curve,
  diamond,
  drawableToOpSets,
  ellipse,
  getCornerRadius,
  linearPath,
  path,
  rectangle,
  roughOptionsForElement,
  roundedRectPath,
} from './rough'
import { isSvgSource, svgDataUrl } from './svg'
import type {
  BinaryFiles,
  EllipseElement,
  ExcalidrawElement,
  ExcalidrawScene,
  FreedrawElement,
  ImageElement,
  LinearElement,
  RectangleElement,
  SvgElement,
  TextElement,
} from './types'

const SVG_PADDING = 32

export interface SceneBounds {
  height: number
  minX: number
  minY: number
  width: number
}

export function computeSceneBounds(input: ExcalidrawElement[]): SceneBounds {
  const elements = resolveRichTextHeights(input)
  if (elements.length === 0) {
    return { minX: 0, minY: 0, width: 100, height: 100 }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const el of elements) {
    if (el.isDeleted) continue
    const x0 = el.x
    const y0 = el.y
    const x1 = el.x + el.width
    const y1 = el.y + el.height
    if (x0 < minX) minX = x0
    if (y0 < minY) minY = y0
    if (x1 > maxX) maxX = x1
    if (y1 > maxY) maxY = y1
  }
  if (!Number.isFinite(minX))
    return { minX: 0, minY: 0, width: 100, height: 100 }
  return {
    minX: minX - SVG_PADDING,
    minY: minY - SVG_PADDING,
    width: maxX - minX + SVG_PADDING * 2,
    height: maxY - minY + SVG_PADDING * 2,
  }
}

export const DARK_SCENE_FILTER = 'invert(93%) hue-rotate(180deg)'

const SHADOW_TYPES = new Set([
  'rectangle',
  'diamond',
  'ellipse',
  'image',
  'svg',
  'richtext',
])

const hasShadow = (el: ExcalidrawElement) =>
  el.shadow === true && SHADOW_TYPES.has(el.type)

const angleOf = (el: ExcalidrawElement) =>
  typeof el.angle === 'number' && Number.isFinite(el.angle) ? el.angle : 0

// `url(#id)` resolves to the first match in the page, so each scene needs its
// own ids; the scene is serialised without React on iOS, which rules out useId.
function sceneUid(elements: readonly ExcalidrawElement[], dark: boolean) {
  let hash = dark ? 7 : 3
  for (const el of elements) {
    for (let i = 0; i < el.id.length; i++) {
      hash = (Math.imul(hash, 31) + el.id.charCodeAt(i)) | 0
    }
  }
  return (hash >>> 0).toString(36)
}

// Exact inverse of DARK_SCENE_FILTER, so images keep their colours inside the
// inverted drawing. CSS filters run in sRGB, so the SVG filter must too.
const CounterInvertFilter: FC<{ id: string }> = ({ id }) => (
  <filter colorInterpolationFilters="sRGB" id={id}>
    <feColorMatrix type="hueRotate" values="180" />
    <feColorMatrix
      type="matrix"
      values="-1.16279 0 0 0 1.081395 0 -1.16279 0 0 1.081395 0 0 -1.16279 0 1.081395 0 0 0 1 0"
    />
  </filter>
)

// The dark scene is inverted, so a white flood comes out as a dark shadow.
const ShadowFilter: FC<{ dark: boolean; id: string }> = ({ dark, id }) => (
  <filter height="160%" id={id} width="140%" x="-20%" y="-20%">
    <feDropShadow
      dx="0"
      dy="3"
      floodColor={dark ? '#fff' : '#000'}
      floodOpacity="0.14"
      stdDeviation="4"
    />
  </filter>
)

interface SceneContentProps {
  dark?: boolean
  files?: BinaryFiles
  scene: ExcalidrawScene
}

export const SceneContent: FC<SceneContentProps> = memo(
  ({ dark = false, files, scene }) => {
    const elements = resolveRichTextHeights(
      scene.elements.filter((el) => !el.isDeleted),
    )
    const uid = sceneUid(elements, dark)
    const invertId = dark ? `excalidraw-counter-invert-${uid}` : undefined
    const shadowId = `excalidraw-shadow-${uid}`
    const anyShadow = elements.some(hasShadow)
    return (
      <>
        {(invertId || anyShadow) && (
          <defs>
            {invertId && <CounterInvertFilter id={invertId} />}
            {anyShadow && <ShadowFilter dark={dark} id={shadowId} />}
          </defs>
        )}
        {elements.map((el) =>
          hasShadow(el) ? (
            <g filter={`url(#${shadowId})`} key={el.id}>
              <ElementGroup el={el} files={files} invertId={invertId} />
            </g>
          ) : (
            <ElementGroup
              el={el}
              files={files}
              invertId={invertId}
              key={el.id}
            />
          ),
        )}
      </>
    )
  },
)
SceneContent.displayName = 'SceneContent'

interface SceneProps extends SceneContentProps {
  className?: string
  style?: CSSProperties
  theme?: 'light' | 'dark'
}

export const Scene: FC<SceneProps> = ({
  className,
  files,
  scene,
  style,
  theme = 'light',
}) => {
  const elements = scene.elements.filter((el) => !el.isDeleted)
  const bounds = computeSceneBounds(elements)
  const isDark = theme === 'dark'

  return (
    <svg
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        ...(isDark ? { filter: DARK_SCENE_FILTER } : null),
        ...style,
      }}
    >
      <SceneContent dark={isDark} files={files ?? scene.files} scene={scene} />
    </svg>
  )
}

interface ElementProps {
  el: ExcalidrawElement
  files?: BinaryFiles
  invertId?: string
}

const ElementGroup: FC<ElementProps> = ({ el, files, invertId }) => {
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const angleDeg = (angleOf(el) * 180) / Math.PI
  const transform = `translate(${el.x} ${el.y}) rotate(${angleDeg} ${el.width / 2} ${el.height / 2})`

  return (
    <g
      data-cx={cx}
      data-cy={cy}
      data-id={el.id}
      data-type={el.type}
      opacity={el.opacity != null ? el.opacity / 100 : 1}
      transform={transform}
    >
      <ElementContent el={el} files={files} invertId={invertId} />
    </g>
  )
}

const ElementContent: FC<ElementProps> = ({ el, files, invertId }) => {
  switch (el.type) {
    case 'rectangle': {
      return <RectangleRender el={el} />
    }
    case 'ellipse': {
      return <EllipseRender el={el} />
    }
    case 'diamond': {
      return <DiamondRender el={el} />
    }
    case 'line':
    case 'arrow': {
      return <LinearRender el={el} />
    }
    case 'freedraw': {
      return <FreedrawRender el={el} />
    }
    case 'text': {
      return <TextRender el={el} />
    }
    case 'image': {
      return <ImageRender el={el} files={files} invertId={invertId} />
    }
    case 'svg': {
      return <SvgRender el={el} invertId={invertId} />
    }
    case 'richtext': {
      return (
        <>
          <RectangleRender el={el as unknown as RectangleElement} />
          <RichTextBody el={el} />
        </>
      )
    }
    case 'frame':
    case 'magicframe': {
      return <FrameRender el={el} />
    }
    case 'embeddable':
    case 'iframe': {
      return <EmbedPlaceholder el={el} />
    }
    default: {
      return null
    }
  }
}

const EVENODD_SHAPES = new Set(['curve', 'polygon'])

const PathSet: FC<{
  drawable: ReturnType<typeof rectangle>
  fillColor?: string
  strokeColor: string
  strokeWidth: number
}> = ({ drawable, fillColor, strokeColor, strokeWidth }) => {
  const opSets = drawableToOpSets(drawable)
  return (
    <>
      {opSets.map((set, i) => {
        if (set.type === 'path') {
          return (
            <path
              d={set.d}
              fill="none"
              key={i}
              stroke={strokeColor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={strokeWidth}
            />
          )
        }
        if (set.type === 'fillPath') {
          return (
            <path
              d={set.d}
              fill={fillColor || 'none'}
              fillRule={
                EVENODD_SHAPES.has(drawable.shape) ? 'evenodd' : undefined
              }
              key={i}
              stroke="none"
            />
          )
        }
        // fillSketch — hachure lines drawn as strokes in fill color
        return (
          <path
            d={set.d}
            fill="none"
            key={i}
            stroke={fillColor || strokeColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={drawable.options.fillWeight ?? strokeWidth / 2}
          />
        )
      })}
    </>
  )
}

const RectangleRender: FC<{ el: RectangleElement }> = ({ el }) => {
  const radius = getCornerRadius(el)
  const opts = roughOptionsForElement(el)
  const drawable =
    radius > 0
      ? path(roundedRectPath(el.width, el.height, radius), opts)
      : rectangle(el)
  return (
    <PathSet
      drawable={drawable}
      strokeColor={el.strokeColor}
      strokeWidth={el.strokeWidth}
      fillColor={
        el.backgroundColor !== 'transparent' ? el.backgroundColor : undefined
      }
    />
  )
}

const EllipseRender: FC<{ el: EllipseElement }> = ({ el }) => {
  const drawable = ellipse(el)
  return (
    <PathSet
      drawable={drawable}
      strokeColor={el.strokeColor}
      strokeWidth={el.strokeWidth}
      fillColor={
        el.backgroundColor !== 'transparent' ? el.backgroundColor : undefined
      }
    />
  )
}

const DiamondRender: FC<{ el: ExcalidrawElement & { type: 'diamond' } }> = ({
  el,
}) => {
  const drawable = diamond(el)
  return (
    <PathSet
      drawable={drawable}
      strokeColor={el.strokeColor}
      strokeWidth={el.strokeWidth}
      fillColor={
        el.backgroundColor !== 'transparent' ? el.backgroundColor : undefined
      }
    />
  )
}

const ARROWHEAD_LENGTH = 18

function arrowheadAngle(
  points: Array<[number, number]>,
  end: 'start' | 'end',
): {
  angle: number
  x: number
  y: number
} {
  if (points.length < 2) return { x: 0, y: 0, angle: 0 }
  const idx = end === 'end' ? points.length - 1 : 0
  const next = end === 'end' ? points.length - 2 : 1
  const [x, y] = points[idx]
  const [px, py] = points[next]
  return { x, y, angle: Math.atan2(y - py, x - px) }
}

const Arrowhead: FC<{
  angle: number
  color: string
  shape: NonNullable<LinearElement['endArrowhead']>
  strokeWidth: number
  x: number
  y: number
}> = ({ angle, color, shape, strokeWidth, x, y }) => {
  if (!shape) return null
  if (
    shape === 'arrow' ||
    shape === 'triangle' ||
    shape === 'triangle_outline'
  ) {
    const len = ARROWHEAD_LENGTH
    const a1 = angle + Math.PI - Math.PI / 7
    const a2 = angle + Math.PI + Math.PI / 7
    const x1 = x + Math.cos(a1) * len
    const y1 = y + Math.sin(a1) * len
    const x2 = x + Math.cos(a2) * len
    const y2 = y + Math.sin(a2) * len
    if (shape === 'arrow') {
      return (
        <g>
          <line
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            x1={x}
            x2={x1}
            y1={y}
            y2={y1}
          />
          <line
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            x1={x}
            x2={x2}
            y1={y}
            y2={y2}
          />
        </g>
      )
    }
    const fill = shape === 'triangle' ? color : 'none'
    return (
      <polygon
        fill={fill}
        points={`${x},${y} ${x1},${y1} ${x2},${y2}`}
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    )
  }
  if (shape === 'dot' || shape === 'circle' || shape === 'circle_outline') {
    const r = ARROWHEAD_LENGTH / 3
    return (
      <circle
        cx={x}
        cy={y}
        fill={shape === 'circle_outline' ? 'none' : color}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
      />
    )
  }
  if (shape === 'bar') {
    const len = ARROWHEAD_LENGTH / 1.5
    const perp = angle + Math.PI / 2
    return (
      <line
        stroke={color}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        x1={x + Math.cos(perp) * len}
        x2={x - Math.cos(perp) * len}
        y1={y + Math.sin(perp) * len}
        y2={y - Math.sin(perp) * len}
      />
    )
  }
  return null
}

const LinearRender: FC<{ el: LinearElement }> = ({ el }) => {
  const points =
    el.points && el.points.length > 0
      ? el.points
      : [[0, 0] as [number, number], [el.width, el.height] as [number, number]]
  const isCurved = el.roundness?.type === 2
  const opts = roughOptionsForElement(el, {
    fill: undefined,
    fillStyle: undefined,
  })
  const drawable =
    isCurved && points.length > 2
      ? curve(points, opts)
      : linearPath(points, opts)
  const startHead = el.startArrowhead
  const endHead =
    el.type === 'arrow' ? (el.endArrowhead ?? 'arrow') : el.endArrowhead

  const startInfo = startHead ? arrowheadAngle(points, 'start') : null
  const endInfo = endHead ? arrowheadAngle(points, 'end') : null

  return (
    <>
      <PathSet
        drawable={drawable}
        strokeColor={el.strokeColor}
        strokeWidth={el.strokeWidth}
      />
      {startHead && startInfo && (
        <Arrowhead
          angle={startInfo.angle + Math.PI}
          color={el.strokeColor}
          shape={startHead}
          strokeWidth={el.strokeWidth}
          x={startInfo.x}
          y={startInfo.y}
        />
      )}
      {endHead && endInfo && (
        <Arrowhead
          angle={endInfo.angle}
          color={el.strokeColor}
          shape={endHead}
          strokeWidth={el.strokeWidth}
          x={endInfo.x}
          y={endInfo.y}
        />
      )}
    </>
  )
}

const FreedrawRender: FC<{ el: FreedrawElement }> = ({ el }) => {
  if (!el.points || el.points.length === 0) return null
  if (el.points.length === 1) {
    const [x, y] = el.points[0]
    return <circle cx={x} cy={y} fill={el.strokeColor} r={el.strokeWidth} />
  }
  const d = el.points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`)
    .join(' ')
  return (
    <path
      d={d}
      fill="none"
      stroke={el.strokeColor}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={el.strokeWidth}
    />
  )
}

const DEFAULT_LINE_HEIGHT = 1.25

const TextRender: FC<{ el: TextElement }> = ({ el }) => {
  const lineHeight = el.lineHeight ?? DEFAULT_LINE_HEIGHT
  const lines = el.text.split('\n')
  const fontSize = el.fontSize
  const family = fontFamilyToCss(el.fontFamily)
  const anchor =
    el.textAlign === 'center'
      ? 'middle'
      : el.textAlign === 'right'
        ? 'end'
        : 'start'
  const ax =
    el.textAlign === 'center'
      ? el.width / 2
      : el.textAlign === 'right'
        ? el.width
        : 0
  const dy = fontSize * lineHeight
  const baseline = fontSize * 0.82

  return (
    <text
      dominantBaseline="alphabetic"
      fill={el.strokeColor}
      fontFamily={family}
      fontSize={fontSize}
      style={{ whiteSpace: 'pre' }}
      textAnchor={anchor}
      x={ax}
      y={baseline}
    >
      {lines.map((line, i) => (
        <tspan dy={i === 0 ? 0 : dy} key={i} x={ax}>
          {line || ' '}
        </tspan>
      ))}
    </text>
  )
}

const SvgRender: FC<{ el: SvgElement; invertId?: string }> = ({
  el,
  invertId,
}) => {
  if (!isSvgSource(el.svg)) {
    return (
      <rect
        fill="none"
        height={el.height}
        stroke="#888"
        strokeDasharray="4 4"
        strokeWidth={1}
        width={el.width}
      />
    )
  }
  return (
    <image
      filter={invertId ? `url(#${invertId})` : undefined}
      height={el.height}
      href={svgDataUrl(el.svg)}
      preserveAspectRatio="xMidYMid meet"
      width={el.width}
    />
  )
}

const ImageRender: FC<{
  el: ImageElement
  files?: BinaryFiles
  invertId?: string
}> = ({ el, files, invertId }) => {
  const file = el.fileId && files ? files[el.fileId] : undefined
  if (!file?.dataURL) {
    return <ImagePlaceholder el={el} label="Image" />
  }
  const scaleX = el.scale?.[0] ?? 1
  const scaleY = el.scale?.[1] ?? 1
  return (
    <image
      filter={invertId ? `url(#${invertId})` : undefined}
      height={el.height}
      href={file.dataURL}
      preserveAspectRatio="none"
      width={el.width}
      transform={
        scaleX !== 1 || scaleY !== 1
          ? `translate(${scaleX < 0 ? el.width : 0} ${scaleY < 0 ? el.height : 0}) scale(${scaleX} ${scaleY})`
          : undefined
      }
    />
  )
}

const ImagePlaceholder: FC<{ el: ExcalidrawElement; label: string }> = ({
  el,
  label,
}) => {
  return (
    <g>
      <rect
        fill="none"
        height={el.height}
        stroke={el.strokeColor || '#888'}
        strokeDasharray="4 4"
        strokeWidth={1}
        width={el.width}
      />
      <text
        dominantBaseline="middle"
        fill={el.strokeColor || '#888'}
        fontFamily={fontFamilyToCss(1)}
        fontSize={Math.min(16, el.height / 4)}
        textAnchor="middle"
        x={el.width / 2}
        y={el.height / 2}
      >
        {label}
      </text>
    </g>
  )
}

const FrameRender: FC<{
  el: ExcalidrawElement & { type: 'frame' | 'magicframe' }
}> = ({ el }) => {
  const name =
    (el as { name?: string | null }).name ||
    (el.type === 'magicframe' ? 'Magic frame' : 'Frame')
  return (
    <>
      <rect
        fill="none"
        height={el.height}
        rx={4}
        stroke="#bbb"
        strokeWidth={1.5}
        width={el.width}
      />
      <text
        fill="#999"
        fontFamily={fontFamilyToCss(2)}
        fontSize={12}
        x={4}
        y={-4}
      >
        {name}
      </text>
    </>
  )
}

const EmbedPlaceholder: FC<{ el: ExcalidrawElement }> = ({ el }) => (
  <ImagePlaceholder el={el} label="Embed" />
)

export { Fragment }
