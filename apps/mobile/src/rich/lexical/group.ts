import { Children, Fragment, isValidElement, type ReactNode } from 'react'

import type { RichTextBlock } from '../inline-runs'
import {
  type ListData,
  ListMarker,
  type ListMarkerProps,
  TextBlockMarker,
  type TextBlockMarkerProps,
  ViewBlockMarker,
  type ViewBlockMarkerProps,
} from './markers'

export type RichSegment =
  | { blocks: RichTextBlock[]; kind: 'text' }
  | {
      blockId: string
      children?: ReactNode
      kind: 'view'
      node: ViewBlockMarkerProps['node']
    }

// Range anchors address a list by its root blockId; items get `#index`
// suffixes so a selection can be mapped back to list-level offsets later.
function flattenList(
  list: ListData,
  blockId: string,
  depth: number,
  out: RichTextBlock[],
) {
  list.items.forEach((item, index) => {
    out.push({
      id: `${blockId}#${out.length}`,
      role: 'listItem',
      listType: list.listType,
      depth,
      index: list.start + index,
      ...(item.checked !== undefined ? { checked: item.checked } : null),
      runs: item.runs,
    })
    for (const nested of item.nested)
      flattenList(nested, blockId, depth + 1, out)
  })
}

export function groupSegments(
  children: ReactNode,
  keyPrefix = 'b',
): RichSegment[] {
  const segments: RichSegment[] = []
  let current: RichTextBlock[] | null = null
  const pushText = (blocks: RichTextBlock[]) => {
    if (!current) {
      current = []
      segments.push({ kind: 'text', blocks: current })
    }
    current.push(...blocks)
  }

  const visit = (nodes: ReactNode, prefix: string) =>
    Children.forEach(nodes, (child, index) => {
      if (!isValidElement(child)) return
      if (child.type === Fragment) {
        visit(
          (child.props as { children?: ReactNode }).children,
          `${prefix}${index}.`,
        )
        return
      }
      const fallbackId = `${prefix}${index}`
      if (child.type === TextBlockMarker) {
        const props = child.props as TextBlockMarkerProps
        pushText([{ ...props.block, id: props.blockId ?? fallbackId }])
        return
      }
      if (child.type === ListMarker) {
        const props = child.props as ListMarkerProps
        const blocks: RichTextBlock[] = []
        flattenList(props.list, props.blockId ?? fallbackId, 0, blocks)
        pushText(blocks)
        return
      }
      if (child.type === ViewBlockMarker) {
        const props = child.props as ViewBlockMarkerProps
        current = null
        segments.push({
          kind: 'view',
          blockId: props.blockId ?? fallbackId,
          node: props.node,
          children: props.children,
        })
      }
    })
  visit(children, keyPrefix)
  return segments
}
