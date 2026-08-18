export type StrokeStyle = 'solid' | 'dashed' | 'dotted'
export type FillStyle =
  | 'hachure'
  | 'cross-hatch'
  | 'solid'
  | 'zigzag'
  | 'zigzag-line'
  | 'dots'
  | 'dashed'

export type ElementType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'freedraw'
  | 'text'
  | 'image'
  | 'frame'
  | 'magicframe'
  | 'embeddable'
  | 'iframe'
  | 'selection'

export interface BaseElement {
  angle: number
  backgroundColor: string
  boundElements?: Array<{ id: string; type: string }> | null
  fillStyle: FillStyle
  height: number
  id: string
  index?: string
  isDeleted?: boolean
  link?: string | null
  locked?: boolean
  opacity: number
  roughness: number
  roundness?: { type: number; value?: number } | null
  seed: number
  strokeColor: string
  strokeStyle: StrokeStyle
  strokeWidth: number
  type: ElementType
  version?: number
  versionNonce?: number
  width: number
  x: number
  y: number
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle'
}
export interface EllipseElement extends BaseElement {
  type: 'ellipse'
}
export interface DiamondElement extends BaseElement {
  type: 'diamond'
}

export type Arrowhead =
  | 'arrow'
  | 'bar'
  | 'dot'
  | 'circle'
  | 'circle_outline'
  | 'triangle'
  | 'triangle_outline'
  | 'diamond'
  | 'diamond_outline'
  | 'crowfoot_one'
  | 'crowfoot_many'
  | 'crowfoot_one_or_many'
  | null

export interface LinearElement extends BaseElement {
  elbowed?: boolean
  endArrowhead?: Arrowhead
  endBinding?: unknown
  lastCommittedPoint?: [number, number] | null
  points: Array<[number, number]>
  startArrowhead?: Arrowhead
  startBinding?: unknown
  type: 'line' | 'arrow'
}

export interface FreedrawElement extends BaseElement {
  points: Array<[number, number]>
  pressures: number[]
  simulatePressure: boolean
  type: 'freedraw'
}

export type FontFamilyId = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface TextElement extends BaseElement {
  autoResize?: boolean
  baseline: number
  containerId?: string | null
  fontFamily: FontFamilyId
  fontSize: number
  lineHeight?: number
  originalText?: string
  text: string
  textAlign: 'left' | 'center' | 'right'
  type: 'text'
  verticalAlign: 'top' | 'middle'
}

export interface ImageElement extends BaseElement {
  crop?: { x: number; y: number; width: number; height: number } | null
  fileId?: string
  scale?: [number, number]
  status?: 'pending' | 'saved' | 'error'
  type: 'image'
}

export interface FrameLikeElement extends BaseElement {
  children?: string[]
  name?: string | null
  type: 'frame' | 'magicframe'
}

export interface EmbedElement extends BaseElement {
  type: 'embeddable' | 'iframe'
}

export type ExcalidrawElement =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | LinearElement
  | FreedrawElement
  | TextElement
  | ImageElement
  | FrameLikeElement
  | EmbedElement
  | (BaseElement & { type: 'selection' })

export interface BinaryFileData {
  created?: number
  dataURL: string
  id: string
  lastRetrieved?: number
  mimeType?: string
}

export type BinaryFiles = Record<string, BinaryFileData>

export interface ExcalidrawScene {
  appState?: Record<string, unknown> & {
    viewBackgroundColor?: string
    theme?: 'light' | 'dark'
  }
  elements: ExcalidrawElement[]
  files?: BinaryFiles
  source?: string
  type?: 'excalidraw'
  version?: number
}

export type StaticTheme = 'light' | 'dark'
