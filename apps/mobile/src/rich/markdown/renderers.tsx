import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'

import type { InlineRun } from '../inline-runs'
import { collectRuns } from '../lexical/collect-runs'
import {
  InlineMarker,
  LineBreakMarker,
  type ListData,
  type ListItemData,
  ListMarker,
  type ListMarkerProps,
  RunMarker,
  type TableCellData,
  TextBlockMarker,
  type TextBlockMarkerProps,
  ViewBlockMarker,
} from '../lexical/markers'
import { textBlockElement } from '../lexical/overrides'
import { type MarkdownNode, type MarkdownNodeType, plainText } from './ast'
import { type FootnoteScope, inlineRuns } from './inline-extensions'

type InlineRenderer = (
  node: MarkdownNode,
  key: string,
  scope: FootnoteScope,
) => ReactNode

const CJK = /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/
const ALERT = /^\[!(note|tip|important|warning|caution)\]\s*/i

function isBreak(node: MarkdownNode | undefined): boolean {
  return node?.type === 'softBreak' || node?.type === 'lineBreak'
}

function isBlank(node: MarkdownNode): boolean {
  return isBreak(node) || (node.type === 'text' && !node.content?.trim())
}

function imageMarker(node: MarkdownNode, key: string): ReactNode {
  const src = node.attributes?.url
  if (!src) return null
  const title = node.attributes?.title
  return (
    <ViewBlockMarker
      key={key}
      node={{
        type: 'image',
        src,
        altText: plainText(node),
        ...(title ? { caption: title } : null),
      }}
    />
  )
}

// A soft break between two CJK characters is a source line wrap, not a word
// boundary; rendering it as a space would split the sentence.
function softBreak(
  siblings: MarkdownNode[],
  index: number,
  key: string,
): ReactNode {
  const before = plainText(siblings[index - 1] ?? { type: 'text' }).at(-1) ?? ''
  const after = plainText(siblings[index + 1] ?? { type: 'text' })[0] ?? ''
  if (CJK.test(before) && CJK.test(after)) return null
  return <RunMarker key={key} run={{ text: ' ' }} />
}

function renderInline(
  nodes: MarkdownNode[] | undefined,
  prefix: string,
  scope: FootnoteScope,
): ReactNode[] {
  const siblings = nodes ?? []
  return siblings.map((node, index) => {
    const key = `${prefix}${index}`
    if (node.type === 'softBreak') return softBreak(siblings, index, key)
    return inlineRenderers[node.type]?.(node, key, scope) ?? null
  })
}

const mark =
  (patch: Partial<InlineRun>): InlineRenderer =>
  (node, key, scope) => (
    <InlineMarker key={key} patch={patch}>
      {renderInline(node.children, `${key}.`, scope)}
    </InlineMarker>
  )

const literal =
  (patch: Partial<InlineRun>): InlineRenderer =>
  (node, key) => <RunMarker key={key} run={{ ...patch, text: plainText(node) }} />

const inlineRenderers: Partial<Record<MarkdownNodeType, InlineRenderer>> = {
  text: (node, key, scope) => (
    <Fragment key={key}>
      {inlineRuns(node.content ?? '', scope).map((run, index) => (
        <RunMarker key={index} run={run} />
      ))}
    </Fragment>
  ),
  lineBreak: (_node, key) => <LineBreakMarker key={key} />,
  strong: mark({ bold: true }),
  emphasis: mark({ italic: true }),
  strikethrough: mark({ strike: true }),
  underline: mark({ underline: true }),
  highlight: mark({ highlight: true }),
  spoiler: mark({ spoiler: true }),
  superscript: mark({ sup: true }),
  subscript: mark({ sub: true }),
  code: literal({ code: true }),
  latexMathInline: literal({ math: true }),
  latexMathDisplay: literal({ math: true }),
  image: (node, key) => imageMarker(node, key),
  link: (node, key, scope) => {
    const content = (node.children ?? []).filter((child) => !isBlank(child))
    if (content.length === 1 && content[0]!.type === 'image')
      return imageMarker(content[0]!, key)
    const url = node.attributes?.url
    return (
      <InlineMarker key={key} patch={url ? { href: url } : {}}>
        {renderInline(node.children, `${key}.`, scope)}
      </InlineMarker>
    )
  },
}

function flatten(nodes: ReactNode): ReactElement[] {
  const out: ReactElement[] = []
  Children.forEach(nodes, (child) => {
    if (!isValidElement(child)) return
    if (child.type === Fragment) {
      out.push(...flatten((child.props as { children?: ReactNode }).children))
    } else {
      out.push(child)
    }
  })
  return out
}

function wrap(parts: ReactElement[], key: string): ReactNode {
  if (parts.length === 0) return null
  if (parts.length === 1) return cloneElement(parts[0]!, { key })
  return <Fragment key={key}>{parts}</Fragment>
}

function textRuns(part: ReactElement): InlineRun[] | null {
  if (part.type !== TextBlockMarker) return null
  const { block } = part.props as TextBlockMarkerProps
  return block.role === 'hr' ? null : block.runs
}

function bareLinkUrl(node: MarkdownNode): string | null {
  const content = (node.children ?? []).filter((child) => !isBlank(child))
  const only = content.length === 1 ? content[0]! : null
  if (only?.type !== 'link') return null
  const url = only.attributes?.url
  if (!url || url.startsWith('#')) return null
  return plainText(only).trim() === url ? url : null
}

function codeBlock(node: MarkdownNode, key: string): ReactNode {
  const code = plainText(node).replace(/\n$/, '')
  const language = node.attributes?.language ?? ''
  return language.toLowerCase() === 'mermaid' ? (
    <ViewBlockMarker key={key} node={{ type: 'mermaid', diagram: code }} />
  ) : (
    <ViewBlockMarker key={key} node={{ type: 'code-block', code, language }} />
  )
}

function alertOf(
  node: MarkdownNode,
): { kind: string; rest: MarkdownNode[] } | null {
  const [first, ...others] = node.children ?? []
  if (first?.type !== 'paragraph') return null
  const [lead, ...inline] = first.children ?? []
  if (lead?.type !== 'text') return null
  const match = ALERT.exec(lead.content ?? '')
  if (!match) return null
  const text = (lead.content ?? '').slice(match[0].length)
  const body = text
    ? [{ ...lead, content: text }, ...inline]
    : isBreak(inline[0])
      ? inline.slice(1)
      : inline
  return {
    kind: match[1]!.toLowerCase(),
    rest: [
      ...(body.length > 0 ? [{ ...first, children: body }] : []),
      ...others,
    ],
  }
}

function blockquote(
  node: MarkdownNode,
  key: string,
  scope: FootnoteScope,
): ReactNode {
  const alert = alertOf(node)
  if (alert) {
    return (
      <ViewBlockMarker
        key={key}
        node={{ type: 'alert-quote', alertType: alert.kind }}
      >
        {renderBlocks(alert.rest, `${key}.`, scope, true)}
      </ViewBlockMarker>
    )
  }
  const out: ReactElement[] = []
  let quoted: InlineRun[] | null = null
  const flush = () => {
    if (!quoted) return
    out.push(
      <TextBlockMarker
        block={{ role: 'quote', runs: quoted }}
        key={`q${out.length}`}
      />,
    )
    quoted = null
  }
  for (const part of flatten(renderBlocks(node.children, `${key}.`, scope))) {
    const runs = textRuns(part)
    if (runs) {
      quoted = quoted ? [...quoted, { text: '\n' }, ...runs] : [...runs]
    } else {
      flush()
      out.push(part)
    }
  }
  flush()
  return wrap(out, key)
}

// ListItemData holds only runs and nested lists. Anything else inside an item
// (code, images, tables) is hoisted to sit after that item, and the list
// resumes with the next number.
function listItem(
  item: MarkdownNode,
  key: string,
  scope: FootnoteScope,
): { data: ListItemData; hoisted: ReactElement[] } {
  const runs: InlineRun[] = []
  const nested: ListData[] = []
  const hoisted: ReactElement[] = []
  ;(item.children ?? []).forEach((child, index) => {
    for (const part of flatten(renderBlock(child, `${key}.${index}`, scope))) {
      const partRuns = textRuns(part)
      if (partRuns) {
        if (runs.length > 0) runs.push({ text: '\n' })
        runs.push(...partRuns)
      } else if (part.type === ListMarker) {
        nested.push((part.props as ListMarkerProps).list)
      } else {
        hoisted.push(part)
      }
    }
  })
  const task = item.attributes?.isTask === 'true'
  return {
    data: {
      runs,
      nested,
      ...(task ? { checked: item.attributes?.taskChecked === 'true' } : null),
    },
    hoisted,
  }
}

function list(node: MarkdownNode, key: string, scope: FootnoteScope): ReactNode {
  const items = node.children ?? []
  const listType: ListData['listType'] = items.some(
    (item) => item.attributes?.isTask === 'true',
  )
    ? 'check'
    : node.type === 'orderedList'
      ? 'number'
      : 'bullet'
  const declared = Number(node.attributes?.start ?? 1)
  let start = Number.isFinite(declared) ? declared : 1
  const out: ReactElement[] = []
  let pending: ListItemData[] = []
  const flush = () => {
    if (pending.length === 0) return
    out.push(
      <ListMarker
        key={`l${out.length}`}
        list={{ listType, start, items: pending }}
      />,
    )
    start += pending.length
    pending = []
  }
  items.forEach((item, index) => {
    const built = listItem(item, `${key}.${index}`, scope)
    pending.push(built.data)
    if (built.hoisted.length > 0) {
      flush()
      out.push(...built.hoisted)
    }
  })
  flush()
  return wrap(out, key)
}

function table(
  node: MarkdownNode,
  key: string,
  scope: FootnoteScope,
): ReactNode {
  const rows: TableCellData[][] = []
  for (const section of node.children ?? []) {
    for (const row of section.children ?? []) {
      const rowKey = `${key}.${rows.length}`
      rows.push(
        (row.children ?? []).map((cell, index) => ({
          header: cell.type === 'tableHeaderCell',
          runs: collectRuns(
            renderInline(cell.children, `${rowKey}.${index}.`, scope),
          ),
        })),
      )
    }
  }
  return <ViewBlockMarker key={key} node={{ type: 'table', rows }} />
}

function renderBlock(
  node: MarkdownNode,
  key: string,
  scope: FootnoteScope,
  top = false,
): ReactNode {
  switch (node.type) {
    case 'paragraph': {
      const url = top ? bareLinkUrl(node) : null
      if (url) {
        return <ViewBlockMarker key={key} node={{ type: 'link-card', url }} />
      }
      return textBlockElement(
        { role: 'paragraph' },
        key,
        renderInline(node.children, `${key}.`, scope),
      )
    }
    case 'heading': {
      return textBlockElement(
        { role: 'heading', level: Number(node.attributes?.level) || 2 },
        key,
        renderInline(node.children, `${key}.`, scope),
      )
    }
    case 'thematicBreak': {
      return <TextBlockMarker block={{ role: 'hr', runs: [] }} key={key} />
    }
    case 'codeBlock': {
      return codeBlock(node, key)
    }
    case 'latexMathDisplay': {
      return (
        <ViewBlockMarker
          key={key}
          node={{ type: 'katex-block', equation: plainText(node).trim() }}
        />
      )
    }
    case 'blockquote': {
      return blockquote(node, key, scope)
    }
    case 'unorderedList':
    case 'orderedList': {
      return list(node, key, scope)
    }
    case 'table': {
      return table(node, key, scope)
    }
    default: {
      return null
    }
  }
}

export function renderBlocks(
  nodes: MarkdownNode[] | undefined,
  prefix: string,
  scope: FootnoteScope,
  top = false,
): ReactNode[] {
  return (nodes ?? []).map((node, index) =>
    renderBlock(node, `${prefix}${index}`, scope, top),
  )
}
