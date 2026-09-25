import type { SerializedEditorState } from 'lexical'

import type { Locale } from '@/i18n/config'
import {
  printBlockFallback,
  type PrintBlockKind,
} from '@/screens/details/article-print'

import { snippetFiles } from '../blocks/code-snippet'
import { gridCells, isMediaGrid } from '../blocks/grid'
import { galleryImages } from '../blocks/image-grid'
import { num, str } from '../blocks/types'
import type { InlineRun, RichTextBlock } from '../inline-runs'
import { footnoteEntries, numberFootnotes } from '../lexical/footnotes'
import { groupSegments, type RichSegment } from '../lexical/group'

export interface PrintKlineBar {
  c: number
  h: number
  l: number
  o: number
  t: number
  v: number
}

export interface PrintKline {
  bars: PrintKlineBar[]
  ema: Array<{ color: string; period: number; values: number[] }>
}

export type PrintItem =
  | { blocks: RichTextBlock[]; kind: 'text' }
  | { caption?: string; kind: 'image'; src: string }
  | { caption?: string; columns: number; kind: 'imageGrid'; srcs: string[] }
  | { caption: string; kind: 'map'; polylines: number[][][] }
  | ({ caption: string; kind: 'kline' } & PrintKline)
  | { code: string; kind: 'code' }
  | { kind: 'math'; latex: string }
  | { kind: 'caption'; text: string }

type Node = Record<string, unknown> & { type: string }

export interface PrintContext {
  fetchAlbum: (node: Node) => Promise<string[]>
  fetchKline: (node: Node) => Promise<PrintKline | null>
  fetchTrack: (node: Node) => Promise<number[][][] | null>
  footnotes: ReadonlyMap<string, number>
  locale: Locale
  probe: (state: SerializedEditorState) => Promise<RichSegment[]>
  renderMermaid: (diagram: string) => Promise<string>
  timeoutMs?: number
}

const FETCH_TIMEOUT_MS = 8000
const GRID_LIMIT = 9

async function settle<T>(
  task: () => Promise<T>,
  timeoutMs: number,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      task(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs)
      }),
    ])
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

type ViewSegment = Extract<RichSegment, { kind: 'view' }>

const CAPTION_KINDS: Record<string, PrintBlockKind> = {
  chat: 'chat',
  dynamic: 'dynamic',
  embed: 'embed',
  excalidraw: 'excalidraw',
  video: 'video',
}

export async function printItems(
  segments: RichSegment[],
  ctx: PrintContext,
): Promise<PrintItem[]> {
  const pending = segments.map((segment) =>
    segment.kind === 'text'
      ? Promise.resolve<PrintItem[]>([
          {
            kind: 'text',
            blocks: numberFootnotes(segment.blocks, ctx.footnotes),
          },
        ])
      : viewItems(segment, ctx),
  )
  const out: PrintItem[] = []
  for (const items of pending) out.push(...(await items))
  return out
}

function heading(id: string, text: string): PrintItem {
  return {
    kind: 'text',
    blocks: [{ id, role: 'paragraph', runs: [{ bold: true, text }] }],
  }
}

// ponytail: rows print as delimited lines, not a ruled grid; draw cells natively if wide tables matter.
function tableBlocks(
  blockId: string,
  rows: Array<Array<{ header: boolean; runs: InlineRun[] }>>,
): RichTextBlock[] {
  return rows.map((row, index) => ({
    id: `${blockId}#${index}`,
    role: 'paragraph',
    runs: row.flatMap((cell, cellIndex) => [
      ...(cellIndex > 0 ? [{ text: '  │  ' }] : []),
      ...cell.runs.map((run) => (cell.header ? { ...run, bold: true } : run)),
    ]),
  }))
}

async function nestedItems(
  content: unknown,
  ctx: PrintContext,
): Promise<PrintItem[]> {
  const state = content as SerializedEditorState | undefined
  return state?.root ? printItems(await ctx.probe(state), ctx) : []
}

async function viewItems(
  segment: ViewSegment,
  ctx: PrintContext,
): Promise<PrintItem[]> {
  const { blockId, node } = segment
  const timeoutMs = ctx.timeoutMs ?? FETCH_TIMEOUT_MS
  const fallbackText = (
    kind: PrintBlockKind,
    fields: Parameters<typeof printBlockFallback>[1] = {},
  ) => printBlockFallback(kind, fields, ctx.locale)
  const caption = (
    kind: PrintBlockKind,
    fields: Parameters<typeof printBlockFallback>[1] = {},
  ): PrintItem[] => [{ kind: 'caption', text: fallbackText(kind, fields) }]

  switch (node.type) {
    case 'image': {
      const src = str(node.src)
      return src
        ? [{ kind: 'image', src, caption: str(node.caption) || undefined }]
        : []
    }
    case 'gallery': {
      const srcs = galleryImages(node)
        .slice(0, GRID_LIMIT)
        .map((image) => image.src)
      return srcs.length > 0 ? [{ kind: 'imageGrid', columns: 3, srcs }] : []
    }
    case 'code-block': {
      return [{ kind: 'code', code: str(node.code) }]
    }
    case 'katex-block': {
      return [{ kind: 'math', latex: str(node.equation) }]
    }
    case 'code-snippet': {
      return snippetFiles(node).flatMap((file): PrintItem[] => [
        { kind: 'caption', text: file.filename },
        { kind: 'code', code: file.code },
      ])
    }
    case 'mermaid': {
      const diagram = str(node.diagram)
      const src = await ctx.renderMermaid(diagram)
      return [src ? { kind: 'image', src } : { kind: 'code', code: diagram }]
    }
    case 'table': {
      return [
        {
          kind: 'text',
          blocks: tableBlocks(
            blockId,
            (node.rows as Parameters<typeof tableBlocks>[1] | undefined) ?? [],
          ),
        },
      ]
    }
    case 'link-card': {
      const text = [str(node.title), str(node.url)].filter(Boolean).join(' — ')
      return text ? [{ kind: 'caption', text }] : []
    }
    case 'alert-quote':
    case 'banner': {
      return nestedItems(node.content, ctx)
    }
    case 'nested-doc': {
      const title = str(node.title)
      const body = await nestedItems(node.content, ctx)
      return title ? [heading(blockId, title), ...body] : body
    }
    case 'details': {
      const summary = str(node.summary)
      const body = await printItems(
        groupSegments(segment.children, `${blockId}.`),
        ctx,
      )
      return summary ? [heading(blockId, summary), ...body] : body
    }
    case 'grid-container': {
      const cells = gridCells(node)
      const out: PrintItem[] = []
      for (const cell of cells)
        out.push(...(await printItems(await ctx.probe(cell), ctx)))
      const srcs = out.flatMap((item) =>
        item.kind === 'image'
          ? [item.src]
          : item.kind === 'imageGrid'
            ? item.srcs
            : [],
      )
      return isMediaGrid(cells) && srcs.length > 0
        ? [
            {
              kind: 'imageGrid',
              columns: Math.max(1, Math.floor(num(node.cols) ?? cells.length)),
              srcs,
            },
          ]
        : out
    }
    case 'footnote-section': {
      const definitions =
        node.definitions && typeof node.definitions === 'object'
          ? (node.definitions as Record<string, string>)
          : {}
      const entries = footnoteEntries(definitions, ctx.footnotes)
      if (entries.length === 0) return []
      return [
        {
          kind: 'text',
          blocks: [
            { id: blockId, role: 'hr', runs: [] },
            ...entries.map((entry): RichTextBlock => ({
              id: `${blockId}#${entry.id}`,
              role: 'paragraph',
              runs: [{ text: `${entry.label}  ` }, { text: entry.text }],
            })),
          ],
        },
      ]
    }
    case 'poll': {
      return caption('poll', {
        count: Array.isArray(node.options) ? node.options.length : 0,
        question: str(node.question),
      })
    }
    case 'map': {
      const text = fallbackText('map', { title: str(node.title) })
      const polylines = await settle(() => ctx.fetchTrack(node), timeoutMs)
      return polylines?.length
        ? [{ kind: 'map', caption: text, polylines }]
        : [{ kind: 'caption', text }]
    }
    case 'file': {
      return caption('file', { name: str(node.name) })
    }
    case 'stock': {
      const text = fallbackText('stock', { symbol: str(node.symbol) })
      const kline = await settle(() => ctx.fetchKline(node), timeoutMs)
      return kline?.bars.length
        ? [{ kind: 'kline', caption: text, ...kline }]
        : [{ kind: 'caption', text }]
    }
    case 'afilmory': {
      const text = fallbackText('afilmory', { title: str(node.title) })
      const srcs = await settle(() => ctx.fetchAlbum(node), timeoutMs)
      return srcs?.length
        ? [{ kind: 'imageGrid', caption: text, columns: 3, srcs }]
        : [{ kind: 'caption', text }]
    }
    default: {
      return caption(CAPTION_KINDS[node.type] ?? 'embed')
    }
  }
}

const PRINT_SCALE = 0.66

export function printScaled<T>(value: T): T {
  if (typeof value === 'number')
    return (Math.round(value * PRINT_SCALE * 10) / 10) as T
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, printScaled(entry)]),
    ) as T
  return value
}
