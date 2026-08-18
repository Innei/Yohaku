import type {
  Drawable,
  Op,
  OpSet,
  Options as RoughOptions,
} from 'roughjs/bin/core'
import { RoughGenerator } from 'roughjs/bin/generator'

import type { BaseElement, StrokeStyle } from './types'

let _gen: RoughGenerator | null = null
function gen(): RoughGenerator {
  if (!_gen) _gen = new RoughGenerator()
  return _gen
}

export function roughOptionsForElement(
  el: BaseElement,
  override?: Partial<RoughOptions>,
): RoughOptions {
  const dashes = strokeDash(el.strokeStyle, el.strokeWidth)
  const opts: RoughOptions = {
    seed: el.seed || 1,
    stroke: el.strokeColor,
    strokeWidth: el.strokeWidth,
    roughness: el.roughness,
    disableMultiStroke: el.strokeWidth < 2,
    fill: el.backgroundColor === 'transparent' ? undefined : el.backgroundColor,
    fillStyle: el.fillStyle,
    fillWeight: el.strokeWidth / 2,
    hachureGap: el.strokeWidth * 4,
    preserveVertices: false,
  }
  if (dashes) opts.strokeLineDash = dashes
  return { ...opts, ...override }
}

function strokeDash(style: StrokeStyle, w: number): number[] | undefined {
  if (style === 'solid') return undefined
  if (style === 'dashed') return [8, 8 + w]
  if (style === 'dotted') return [1.5, 6 + w]
  return undefined
}

export function rectangle(
  el: BaseElement,
  override?: Partial<RoughOptions>,
): Drawable {
  return gen().rectangle(
    0,
    0,
    el.width,
    el.height,
    roughOptionsForElement(el, override),
  )
}

export function ellipse(
  el: BaseElement,
  override?: Partial<RoughOptions>,
): Drawable {
  return gen().ellipse(
    el.width / 2,
    el.height / 2,
    el.width,
    el.height,
    roughOptionsForElement(el, override),
  )
}

export function diamond(
  el: BaseElement,
  override?: Partial<RoughOptions>,
): Drawable {
  const hw = el.width / 2
  const hh = el.height / 2
  return gen().polygon(
    [
      [hw, 0],
      [el.width, hh],
      [hw, el.height],
      [0, hh],
    ],
    roughOptionsForElement(el, override),
  )
}

export function path(d: string, options: RoughOptions): Drawable {
  return gen().path(d, options)
}

export function linearPath(
  points: Array<[number, number]>,
  options: RoughOptions,
): Drawable {
  return gen().linearPath(points, options)
}

export function curve(
  points: Array<[number, number]>,
  options: RoughOptions,
): Drawable {
  return gen().curve(points, options)
}

export function polygon(
  points: Array<[number, number]>,
  options: RoughOptions,
): Drawable {
  return gen().polygon(points, options)
}

export function opsToPath(ops: Op[]): string {
  let d = ''
  for (const { op, data } of ops) {
    switch (op) {
      case 'move': {
        d += `M${data[0]} ${data[1]} `
        break
      }
      case 'lineTo': {
        d += `L${data[0]} ${data[1]} `
        break
      }
      case 'bcurveTo': {
        d += `C${data[0]} ${data[1]}, ${data[2]} ${data[3]}, ${data[4]} ${data[5]} `
        break
      }
    }
  }
  return d.trim()
}

export interface RenderedOpSet {
  d: string
  type: OpSet['type']
}

export function drawableToOpSets(drawable: Drawable): RenderedOpSet[] {
  return drawable.sets.map((set) => ({ type: set.type, d: opsToPath(set.ops) }))
}

export function roundedRectPath(
  width: number,
  height: number,
  radius: number,
): string {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  return [
    `M ${r} 0`,
    `L ${width - r} 0`,
    `Q ${width} 0 ${width} ${r}`,
    `L ${width} ${height - r}`,
    `Q ${width} ${height} ${width - r} ${height}`,
    `L ${r} ${height}`,
    `Q 0 ${height} 0 ${height - r}`,
    `L 0 ${r}`,
    `Q 0 0 ${r} 0`,
    'Z',
  ].join(' ')
}

const PROPORTIONAL_RADIUS = 0.25
const FIXED_RADIUS = 32

export function getCornerRadius(el: BaseElement): number {
  if (!el.roundness) return 0
  if (el.roundness.type === 3) {
    const min = Math.min(el.width, el.height)
    return Math.min(min * PROPORTIONAL_RADIUS, FIXED_RADIUS)
  }
  return el.roundness.value ?? 0
}
