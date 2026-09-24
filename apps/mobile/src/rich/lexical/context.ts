import type { SerializedEditorState } from 'lexical'
import { createContext, type ReactNode, useContext } from 'react'

import type { ApiEnrichment } from '@/api/types'

import type { RichTextHighlight, RichTextMenuItem } from '../inline-runs'
import type { RichTextMenuActionEvent } from '../rich-text-view'
import type { RichVariant } from '../typography'
import type { RichSegment } from './group'

export interface RichDocumentHandlers {
  enrichments?: Record<string, ApiEnrichment> | null
  highlights?: RichTextHighlight[]
  menuItems?: RichTextMenuItem[]
  onBlockLayout?: (blockId: string, y: number, height: number) => void
  onHighlightPress?: (id: string) => void
  onLinkPress?: (href: string) => void
  onMenuAction?: (event: RichTextMenuActionEvent) => void
  onNestedDocExpand?: (payload: {
    contentState: SerializedEditorState
    title?: string
  }) => void
  onSegments?: (segments: RichSegment[]) => void
  onSelectionActive?: (active: boolean) => void
  variant?: RichVariant
  webUrl?: string
}

export interface RichDocumentContextValue extends RichDocumentHandlers {
  footnotes?: ReadonlyMap<string, number>
  renderNested: (state: SerializedEditorState) => ReactNode
  renderSegments: (segments: RichSegment[]) => ReactNode
}

export const RichDocumentContext =
  createContext<RichDocumentContextValue | null>(null)

export function useRichDocument(): RichDocumentContextValue {
  const value = useContext(RichDocumentContext)
  if (!value) throw new Error('useRichDocument outside RichDocument')
  return value
}
