import { RichRenderer } from '@haklex/rich-compose/core'
import { allNodes } from '@haklex/rich-editor/static'
import type { SerializedEditorState } from 'lexical'
import { type ReactNode, useEffect, useMemo, useRef } from 'react'
import { View } from 'react-native'

import { blockRegistry, UnsupportedBlock } from '../blocks/registry'
import type { RichTextBlock } from '../inline-runs'
import { type RichTextBlockRect, RichTextView } from '../rich-text-view'
import {
  RichDocumentContext,
  type RichDocumentContextValue,
  type RichDocumentHandlers,
  useRichDocument,
} from './context'
import { footnoteNumbers, numberFootnotes } from './footnotes'
import { passthroughNodes } from './generic-node'
import { groupSegments, type RichSegment } from './group'
import { nativeBlockAnchor, nativeBuiltinOverrides } from './overrides'

export const extraNodes = passthroughNodes(allNodes)

export interface RichDocumentProps extends RichDocumentHandlers {
  footnotes?: ReadonlyMap<string, number>
  nested?: boolean
  value: SerializedEditorState
}

function TextSegment({ blocks }: { blocks: RichTextBlock[] }) {
  const doc = useRichDocument()
  const originY = useRef<number | null>(null)
  const rects = useRef<RichTextBlockRect[]>([])

  const publish = () => {
    const y = originY.current
    if (y === null || !doc.onBlockLayout) return
    for (const rect of rects.current)
      doc.onBlockLayout(rect.id, y + rect.y, rect.height)
  }

  return (
    <View
      onLayout={(event) => {
        originY.current = event.nativeEvent.layout.y
        publish()
      }}
    >
      <RichTextView
        blocks={doc.footnotes ? numberFootnotes(blocks, doc.footnotes) : blocks}
        highlights={doc.highlights}
        menuItems={doc.menuItems}
        variant={doc.variant}
        onHighlightPress={doc.onHighlightPress}
        onLinkPress={doc.onLinkPress}
        onMenuAction={doc.onMenuAction}
        onSelectionActive={doc.onSelectionActive}
        onBlockRects={(next) => {
          rects.current = next
          publish()
        }}
      />
    </View>
  )
}

function SegmentList({ segments }: { segments: RichSegment[] }) {
  const doc = useRichDocument()
  const gallery = segments.flatMap((segment) =>
    segment.kind === 'view' &&
    segment.node.type === 'image' &&
    typeof segment.node.src === 'string'
      ? [segment.node.src]
      : [],
  )
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'text') {
          return (
            <TextSegment
              blocks={segment.blocks}
              key={`t${index}:${segment.blocks[0]?.id ?? ''}`}
            />
          )
        }
        const Block = blockRegistry[segment.node.type] ?? UnsupportedBlock
        return (
          <View
            key={segment.blockId}
            nativeID={segment.blockId}
            onLayout={(event) =>
              doc.onBlockLayout?.(
                segment.blockId,
                event.nativeEvent.layout.y,
                event.nativeEvent.layout.height,
              )
            }
          >
            <Block
              blockId={segment.blockId}
              gallery={gallery}
              node={segment.node}
            >
              {segment.children}
            </Block>
          </View>
        )
      })}
    </>
  )
}

function SegmentHost({ children }: { children?: ReactNode }) {
  const doc = useRichDocument()
  const segments = useMemo(() => groupSegments(children), [children])
  const onSegments = useRef(doc.onSegments)
  onSegments.current = doc.onSegments
  useEffect(() => {
    onSegments.current?.(segments)
  }, [segments])
  return <SegmentList segments={segments} />
}

export function RichDocument({
  footnotes: inheritedFootnotes,
  nested,
  value,
  ...handlers
}: RichDocumentProps) {
  const ownFootnotes = useMemo(
    () => (inheritedFootnotes ? null : footnoteNumbers(value)),
    [inheritedFootnotes, value],
  )
  const footnotes = inheritedFootnotes ?? ownFootnotes ?? undefined
  const context: RichDocumentContextValue = {
    ...handlers,
    footnotes,
    renderNested: (state) => (
      <RichDocument
        nested
        footnotes={footnotes}
        value={state}
        {...handlers}
        onSegments={undefined}
      />
    ),
    renderSegments: (segments) => <SegmentList segments={segments} />,
  }

  return (
    <RichDocumentContext value={context}>
      <RichRenderer
        as={SegmentHost}
        blockAnchor={nativeBlockAnchor}
        builtinNodeOverrides={nativeBuiltinOverrides}
        extraNodes={extraNodes}
        nested={nested}
        value={value}
      />
    </RichDocumentContext>
  )
}
