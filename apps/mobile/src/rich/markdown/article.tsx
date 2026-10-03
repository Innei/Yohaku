import { Fragment, type ReactNode } from 'react'

import type { LexicalHeading } from '@/lib/lexical-headings'

import { runsText } from '../lexical/collect-runs'
import { groupSegments, type RichSegment } from '../lexical/group'
import { ViewBlockMarker } from '../lexical/markers'
import type { MarkdownParser } from './ast'
import type { FootnoteScope } from './inline-extensions'
import { type MarkdownChunk, prepass } from './prepass'
import { renderBlocks } from './renderers'

export interface MarkdownArticle {
  footnotes: ReadonlyMap<string, number>
  headings: LexicalHeading[]
  segments: RichSegment[]
}

type ContainerChunk = Extract<MarkdownChunk, { kind: 'container' }>

const IMAGE_CONTAINERS = new Set(['carousel', 'gallery', 'grid', 'masonry'])

const BANNER_KINDS: Record<string, string> = {
  caution: 'caution',
  danger: 'caution',
  error: 'caution',
  important: 'important',
  info: 'note',
  note: 'note',
  success: 'tip',
  tip: 'tip',
  warn: 'warning',
  warning: 'warning',
}

const IMAGE = /!\[([^\]]*)\]\(\s*<?([^\s)>]+)>?(?:\s[^)]*)?\)/g
const RAW_URL = /^https?:\/\/\S+$/

export function containerImages(
  content: string,
): Array<{ alt?: string; src: string }> {
  const images: Array<{ alt?: string; src: string }> = []
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (RAW_URL.test(line)) {
      images.push({ src: line })
      continue
    }
    for (const match of line.matchAll(IMAGE)) {
      images.push({ src: match[2]!, ...(match[1] ? { alt: match[1] } : null) })
    }
  }
  return images
}

function containerMarkers(
  chunk: ContainerChunk,
  key: string,
  parse: MarkdownParser,
  scope: FootnoteScope,
): ReactNode {
  const images = IMAGE_CONTAINERS.has(chunk.name)
    ? containerImages(chunk.content)
    : []
  if (images.length > 0) {
    return <ViewBlockMarker key={key} node={{ type: 'gallery', images }} />
  }
  const body = renderBlocks(
    parse(chunk.content).children,
    `${key}.`,
    scope,
    true,
  )
  if (IMAGE_CONTAINERS.has(chunk.name)) {
    return <Fragment key={key}>{body}</Fragment>
  }
  const kind = chunk.name === 'banner' ? chunk.params : chunk.name
  return (
    <ViewBlockMarker
      key={key}
      node={{
        type: 'banner',
        bannerType: BANNER_KINDS[kind.toLowerCase()] ?? 'note',
      }}
    >
      {body}
    </ViewBlockMarker>
  )
}

function headingsOf(segments: RichSegment[]): LexicalHeading[] {
  return segments.flatMap((segment) =>
    segment.kind === 'text'
      ? segment.blocks.flatMap((block) => {
          const text = runsText(block.runs).trim()
          return block.role === 'heading' && text
            ? [{ blockId: block.id, level: block.level ?? 2, text }]
            : []
        })
      : [],
  )
}

export function buildMarkdownArticle(
  source: string,
  parse: MarkdownParser,
): MarkdownArticle {
  const { chunks, definitions } = prepass(source)
  const scope: FootnoteScope = { definitions, numbers: new Map() }
  const markers: ReactNode[] = chunks.flatMap((chunk, index) =>
    chunk.kind === 'markdown'
      ? renderBlocks(parse(chunk.text).children, `c${index}.`, scope, true)
      : [containerMarkers(chunk, `c${index}`, parse, scope)],
  )
  if (Object.keys(definitions).length > 0) {
    markers.push(
      <ViewBlockMarker
        key="footnotes"
        node={{ type: 'footnote-section', definitions }}
      />,
    )
  }
  const segments = groupSegments(markers, 'm')
  return { footnotes: scope.numbers, headings: headingsOf(segments), segments }
}
