import type {
  BlockAnchorRenderer,
  BuiltinNodeRenderer,
} from '@haklex/rich-compose/core'
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactNode,
} from 'react'

import type { InlineRun, RichTextBlock } from '../inline-runs'
import { collectRuns, runsText } from './collect-runs'
import {
  InlineMarker,
  LineBreakMarker,
  type ListData,
  type ListItemData,
  ListItemMarker,
  type ListItemMarkerProps,
  ListMarker,
  type ListMarkerProps,
  RunMarker,
  type TableCellData,
  TableCellMarker,
  type TableCellMarkerProps,
  TableRowMarker,
  type TableRowMarkerProps,
  TextBlockMarker,
  ViewBlockMarker,
} from './markers'

const FORMAT_FLAGS: Array<[number, keyof InlineRun]> = [
  [1, 'bold'],
  [2, 'italic'],
  [4, 'strike'],
  [8, 'underline'],
  [16, 'code'],
  [32, 'sub'],
  [64, 'sup'],
  [128, 'highlight'],
]

function colorFromStyle(style: unknown): string | undefined {
  if (typeof style !== 'string') return undefined
  const match = /(?:^|;)\s*color\s*:\s*(#[\dA-Fa-f]{6,8})/.exec(style)
  return match?.[1]
}

const text: BuiltinNodeRenderer = (node, key) => {
  const run: InlineRun = { text: String(node.text ?? '') }
  const format = Number(node.format) || 0
  for (const [flag, prop] of FORMAT_FLAGS) {
    if (format & flag) Object.assign(run, { [prop]: true })
  }
  const color = colorFromStyle(node.style)
  if (color) run.color = color
  return <RunMarker key={key} run={run} />
}

const inline =
  (patch: (node: any) => Partial<InlineRun>): BuiltinNodeRenderer =>
  (node, key, children) => (
    <InlineMarker key={key} patch={patch(node)}>
      {children}
    </InlineMarker>
  )

const inlineText =
  (
    toText: (node: any) => string,
    patch?: Partial<InlineRun>,
  ): BuiltinNodeRenderer =>
  (node, key) => <RunMarker key={key} run={{ ...patch, text: toText(node) }} />

// Block decorators (excalidraw, images) can sit inside a paragraph; they are
// hoisted out as sibling blocks so the segment grouping sees them.
function splitHoisted(children: ReactNode): {
  hoisted: ReactNode[]
  inline: ReactNode[]
} {
  const hoisted: ReactNode[] = []
  const inline: ReactNode[] = []
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === ViewBlockMarker)
      hoisted.push(child)
    else inline.push(child)
  })
  return { hoisted, inline }
}

const textBlock =
  (
    role: RichTextBlock['role'],
    extra?: (node: any) => Partial<RichTextBlock>,
  ): BuiltinNodeRenderer =>
  (node, key, children) => {
    const { hoisted, inline } = splitHoisted(children)
    const runs = collectRuns(inline)
    const block =
      runs.some((run) => run.text.trim()) || hoisted.length === 0 ? (
        <TextBlockMarker block={{ role, runs, ...extra?.(node) }} key={key} />
      ) : null
    if (hoisted.length === 0) return block
    return (
      <Fragment key={key}>
        {block}
        {hoisted}
      </Fragment>
    )
  }

const viewBlock: BuiltinNodeRenderer = (node, key, children) => (
  <ViewBlockMarker key={key} node={node}>
    {children}
  </ViewBlockMarker>
)

function childrenOfType<P>(children: ReactNode, type: unknown): P[] {
  const out: P[] = []
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === type) out.push(child.props as P)
  })
  return out
}

const listitem: BuiltinNodeRenderer = (node, key, children) => {
  const nested = childrenOfType<ListMarkerProps>(children, ListMarker).map(
    (props) => props.list,
  )
  const inlineChildren = Children.toArray(children).filter(
    (child) => !(isValidElement(child) && child.type === ListMarker),
  )
  const item: ListItemData = {
    runs: collectRuns(inlineChildren),
    nested,
    ...(typeof node.checked === 'boolean' ? { checked: node.checked } : null),
  }
  return <ListItemMarker item={item} key={key} />
}

const list: BuiltinNodeRenderer = (node, key, children) => {
  const data: ListData = {
    listType:
      node.listType === 'number' || node.listType === 'check'
        ? node.listType
        : 'bullet',
    start: typeof node.start === 'number' ? node.start : 1,
    items: childrenOfType<ListItemMarkerProps>(children, ListItemMarker).map(
      (props) => props.item,
    ),
  }
  return <ListMarker key={key} list={data} />
}

const tablecell: BuiltinNodeRenderer = (node, key, children) => {
  const cell: TableCellData = {
    header: Boolean(node.headerState),
    runs: collectRuns(children),
  }
  return <TableCellMarker cell={cell} key={key} />
}

const tablerow: BuiltinNodeRenderer = (_node, key, children) => (
  <TableRowMarker
    key={key}
    cells={childrenOfType<TableCellMarkerProps>(children, TableCellMarker).map(
      (props) => props.cell,
    )}
  />
)

const table: BuiltinNodeRenderer = (node, key, children) => (
  <ViewBlockMarker
    key={key}
    node={{
      ...node,
      rows: childrenOfType<TableRowMarkerProps>(children, TableRowMarker).map(
        (props) => props.cells,
      ),
    }}
  />
)

const legacyCode: BuiltinNodeRenderer = (node, key, children) => (
  <ViewBlockMarker
    key={key}
    node={{
      type: 'code-block',
      code: runsText(collectRuns(children)),
      language: node.language ?? '',
    }}
  />
)

const VIEW_BLOCK_TYPES = [
  'image',
  'video',
  'file',
  'link-card',
  'katex-block',
  'mermaid',
  'code-block',
  'embed',
  'code-snippet',
  'gallery',
  'excalidraw',
  'dynamic',
  'poll',
  'chat',
  'banner',
  'alert-quote',
  'nested-doc',
  'grid-container',
  'footnote-section',
  'details',
  'stock',
  'map',
  'afilmory',
]

export const nativeBuiltinOverrides: Record<string, BuiltinNodeRenderer> = {
  ...Object.fromEntries(VIEW_BLOCK_TYPES.map((type) => [type, viewBlock])),
  text,
  linebreak: (_node, key) => <LineBreakMarker key={key} />,
  tab: inlineText(() => '  '),
  link: inline((node) => ({ href: String(node.url ?? '') })),
  autolink: inline((node) => ({ href: String(node.url ?? '') })),
  spoiler: inline(() => ({ spoiler: true })),
  ruby: inline(() => ({})),
  mention: inlineText((node) => `@${node.displayName || node.handle || ''}`, {
    bold: true,
  }),
  tag: inlineText((node) => `#${node.text ?? ''}`, { code: true }),
  footnote: (node, key) => {
    const identifier = String(node.identifier ?? '')
    return (
      <RunMarker
        key={key}
        run={{ footnote: identifier, sup: true, text: identifier }}
      />
    )
  },
  'katex-inline': inlineText((node) => String(node.equation ?? ''), {
    math: true,
  }),
  comment: () => null,
  'code-highlight': inlineText((node) => String(node.text ?? '')),
  paragraph: textBlock('paragraph'),
  heading: textBlock('heading', (node) => ({
    level: Number(String(node.tag ?? 'h2').slice(1)) || 2,
  })),
  quote: textBlock('quote'),
  'rich-quote': textBlock('quote', (node) =>
    typeof node.attribution === 'string' && node.attribution
      ? { attribution: node.attribution }
      : {},
  ),
  horizontalrule: (_node, key) => (
    <TextBlockMarker block={{ role: 'hr', runs: [] }} key={key} />
  ),
  list,
  listitem,
  table,
  tablerow,
  tablecell,
  code: legacyCode,
}

export const nativeBlockAnchor: BlockAnchorRenderer = (element, blockId) => {
  if (!isValidElement(element)) return element
  if (element.type === Fragment) {
    const inner = (element.props as { children?: ReactNode }).children
    return (
      <Fragment key={element.key ?? undefined}>
        {Children.map(inner, (child, index) =>
          isValidElement(child)
            ? cloneElement(child as React.ReactElement<{ blockId?: string }>, {
                blockId: index === 0 ? blockId : `${blockId}~${index}`,
              })
            : child,
        )}
      </Fragment>
    )
  }
  return cloneElement(element as React.ReactElement<{ blockId?: string }>, {
    blockId,
  })
}
