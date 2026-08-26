'use client'

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
      className="rich-nestdoc-yohaku group relative my-4 cursor-pointer border-l border-(--color-neutral-3) py-1 pl-6 transition-colors hover:border-(--color-accent)"
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
      <div className="text-caption-10 mb-2 flex items-center gap-2 tracking-[0.06em] text-(--color-neutral-7) uppercase">
        <span>{labels.nestedDocLabel}</span>
        <span aria-hidden className="h-px flex-1 bg-(--color-neutral-3)" />
        <span className="inline-flex items-center gap-1">
          {showFull ? labels.nestedDocCollapse : labels.nestedDocExpand}
          <span
            aria-hidden
            className="inline-block transition-transform group-hover:translate-x-0.5"
            style={showFull ? { transform: 'rotate(90deg)' } : undefined}
          >
            ›
          </span>
        </span>
      </div>
      <div
        className={showFull ? undefined : 'pointer-events-none overflow-hidden'}
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
          className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(to_bottom,transparent,var(--surface-paper))]"
        />
      )}
    </div>
  )
}
