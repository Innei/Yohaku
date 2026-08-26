'use client'
import { sx, sxClass } from '../../lib/sx'
import { atoms } from '../../styles/atoms.stylex'
import { extras } from '../../styles/extras.stylex'

import { useNestedDocConfig } from '@haklex/rich-compose/modules/nested-doc'
import {
  ColorSchemeProvider,
  NestedContentRendererProvider,
  useColorScheme,
  useOptionalNestedContentRenderer,
  useVariant,
} from '@haklex/rich-editor/static'
import { NestedDocRenderer } from '@haklex/rich-ext-nested-doc'
import type { SerializedEditorState } from 'lexical'
import { useCallback, useMemo, useState } from 'react'

import { useHost, usePrintFallback } from '../../host'

const PREVIEW_NODE_LIMIT = 6

function truncateEditorState(
  state: SerializedEditorState,
  maxNodes: number,
): SerializedEditorState {
  const root = state.root
  if (!root?.children || root.children.length <= maxNodes) return state
  return {
    ...state,
    root: { ...root, children: root.children.slice(0, maxNodes) },
  }
}

function hasRenderableEditorState(state: SerializedEditorState): boolean {
  const children = state.root?.children ?? []
  if (children.length === 0) return false
  if (children.length > 1) return true
  const first = children[0] as { type?: string; children?: any[] }
  if (!first) return false
  if (first.type !== 'paragraph') return true
  return (
    first.children?.some((child: { type?: string; text?: string }) => {
      if (child.type !== 'text') return true
      return Boolean(child.text?.trim())
    }) ?? false
  )
}

interface NestedDocStaticDecoratorProps {
  contentState: SerializedEditorState
}

export function LexicalNestedDocOverride({
  contentState,
}: NestedDocStaticDecoratorProps) {
  const colorScheme = useColorScheme()
  const renderNestedContent = useOptionalNestedContentRenderer()
  const { onExpand } = useNestedDocConfig()
  const { labels, nestedDocPresentation } = useHost()
  const [expanded, setExpanded] = useState(false)

  const rootChildren = contentState.root?.children ?? []
  const needsTruncation = rootChildren.length > PREVIEW_NODE_LIMIT
  const previewState = useMemo(
    () => truncateEditorState(contentState, PREVIEW_NODE_LIMIT),
    [contentState],
  )
  const hasPreview = hasRenderableEditorState(contentState)

  const title = useMemo(() => {
    const firstChild = rootChildren[0] as any
    if (!firstChild) return ''
    const walk = (node: any): string => {
      if (node.text) return node.text
      if (node.children) return node.children.map(walk).join('')
      return ''
    }
    return walk(firstChild).slice(0, 80)
  }, [rootChildren])
  const printFallback = usePrintFallback('nestedDoc', { title })

  const contextVariant = useVariant()
  const handleOpen = useCallback(
    (target: HTMLElement) => {
      if (nestedDocPresentation === 'inline') {
        setExpanded((prev) => !prev)
        return
      }
      if (!onExpand) return
      const content = (
        <ColorSchemeProvider colorScheme={colorScheme}>
          <NestedContentRendererProvider value={renderNestedContent}>
            <div>
              <NestedDocRenderer
                value={contentState}
                variant={contextVariant}
              />
            </div>
          </NestedContentRendererProvider>
        </ColorSchemeProvider>
      )
      onExpand({
        content,
        contentState,
        target,
        title: title || undefined,
      })
    },
    [
      colorScheme,
      contentState,
      contextVariant,
      nestedDocPresentation,
      onExpand,
      renderNestedContent,
      title,
    ],
  )

  if (printFallback !== null) {
    return <p className="print-block-fallback">{printFallback}</p>
  }

  if (!hasPreview) {
    return null
  }

  const showFull = nestedDocPresentation === 'inline' && expanded

  return (
    <div
      aria-expanded={nestedDocPresentation === 'inline' ? showFull : undefined}
      {...sxClass("rich-nestdoc-yohaku", atoms.relative, atoms.my_4, atoms.cursor_pointer, atoms.border_l, atoms.border____color_neutral_3, atoms.py_1, atoms.pl_6, atoms.transition_colors, atoms.hover_border____color_accent)} data-group=""
      role="button"
      tabIndex={0}
      onClick={(e) => handleOpen(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleOpen(e.currentTarget)
        }
      }}
    >
      <div {...sx(atoms.text_caption_10, atoms.mb_2, atoms.flex, atoms.items_center, atoms.gap_2, atoms.tracking__0dot06em, atoms.text____color_neutral_7, atoms.uppercase)}>
        <span>{labels.nestedDocLabel}</span>
        <span aria-hidden {...sx(atoms.h_px, atoms.flex_1, atoms.bg____color_neutral_3)} />
        <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1)}>
          {showFull ? labels.nestedDocCollapse : labels.nestedDocExpand}
          <span
            aria-hidden
            {...sx(extras.groupHoverTranslateX05, atoms.inline_block, atoms.transition_transform)}
            style={showFull ? { transform: 'rotate(90deg)' } : undefined}
          >
            ›
          </span>
        </span>
      </div>
      <div
        {...sx(!showFull && [extras.pointerEventsNone, atoms.overflow_hidden])}
        // Expanded content renders real interactive descendants (links,
        // nested block boundaries); without this, any click inside bubbles
        // up to the outer toggle above and immediately closes the block
        // again instead of letting the click do its own thing.
        onClick={showFull ? (e) => e.stopPropagation() : undefined}
      >
        <NestedDocRenderer value={showFull ? contentState : previewState} />
      </div>
      {needsTruncation && !showFull && (
        <div
          aria-hidden
          {...sx(atoms.absolute, atoms.inset_x_0, atoms.bottom_0, atoms.h_10, atoms.bg__linear_gradient_to_bottom_transparent_var___surface_paper)}
        />
      )}
    </div>
  )
}
