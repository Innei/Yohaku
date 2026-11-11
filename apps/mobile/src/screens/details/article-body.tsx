import {
  useFocusEffect,
  useIsPreview,
  useNavigation,
  useRouter,
} from 'expo-router'
import type { SerializedEditorState } from 'lexical'
import type { RefObject } from 'react'
import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ScrollViewInstance } from 'react-native'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'

import type { ApiEnrichment, CommentRefType } from '@/api/types'
import { extractBlockInfos } from '@/components/dom/anchor-utils'
import { AppText } from '@/components/ui'
import { useTranslations } from '@/i18n'
import {
  invalidateTocOffsets,
  registerTocOffsets,
  subscribeTocJump,
} from '@/lib/article-toc'
import { hrefForExternalUrl } from '@/lib/link-router'
import { openExternalUrl } from '@/lib/open-external'
import {
  buildHighlights,
  indexNativeBlocks,
  type NativeBlockMap,
  selectionMessageFromMenuAction,
} from '@/rich/anchors'
import type { RichDocumentHandlers } from '@/rich/lexical/context'
import { FOOTNOTE_SCHEME } from '@/rich/lexical/footnotes'
import { type RichSegment } from '@/rich/lexical/group'
import { RichDocument } from '@/rich/lexical/rich-document'
import type { MarkdownArticle } from '@/rich/markdown/article'
import { MarkdownDocument } from '@/rich/markdown/markdown-document'
import { markdownArticle } from '@/rich/markdown/parse'
import { usePalette } from '@/theme/palette'

import { useReservedBodyHeight } from './body-slot'
import { useArticleSelection } from './use-article-selection'

interface NestedDoc {
  contentState: SerializedEditorState
  title?: string
}

export function parseState(content: string): SerializedEditorState | null {
  try {
    const parsed = JSON.parse(content) as SerializedEditorState
    return parsed && typeof parsed === 'object' && 'root' in parsed
      ? parsed
      : null
  } catch {
    return null
  }
}

class BodyErrorBoundary extends Component<
  { children?: React.ReactNode; fallback?: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[article-body] rich document failed', error)
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}

export function ArticleBody({
  autoFollow = false,
  content,
  enrichments,
  fallbackText = null,
  highlightBlockId = null,
  markdown = null,
  queriesEnabled = true,
  refId,
  refType,
  scrollRef,
  variant,
  webUrl,
}: {
  autoFollow?: boolean
  content: string
  enrichments?: Record<string, ApiEnrichment> | null
  fallbackText?: string | null
  highlightBlockId?: string | null
  markdown?: MarkdownArticle | null
  queriesEnabled?: boolean
  refId: string
  refType: CommentRefType
  scrollRef: RefObject<ScrollViewInstance | null>
  variant: 'article' | 'note'
  webUrl: string
}) {
  const t = useTranslations('detail')
  const tc = useTranslations('common')
  const palette = usePalette()
  const { height: windowHeight } = useWindowDimensions()
  const router = useRouter()
  const navigation = useNavigation()
  const isPreview = useIsPreview()
  const blockRectsRef = useRef<Record<string, { height: number; y: number }>>(
    {},
  )
  const bodyTopRef = useRef(0)
  const footnoteSectionRef = useRef<string | null>(null)
  const [slotTop, setSlotTop] = useState<number | null>(null)
  const [renderedSegments, setRenderedSegments] = useState<
    RichSegment[] | null
  >(null)
  const [nestedDoc, setNestedDoc] = useState<NestedDoc | null>(null)
  const [blockMap, setBlockMap] = useState<NativeBlockMap>(() => new Map())
  const {
    blockComments,
    handleSelectionMessage,
    rangeComments,
    selectionBlockTitle,
    selectionCommentTitle,
    selectionSheet,
  } = useArticleSelection({
    onPresent: (blockId) => scrollToBlock(blockId, 0.12),
    queriesEnabled: queriesEnabled && !markdown,
    refId,
    refType,
  })
  const reservedHeight = useReservedBodyHeight(slotTop)

  const value = useMemo(
    () => (markdown ? null : parseState(content)),
    [content, markdown],
  )
  const blockInfos = useMemo(
    () => (markdown ? [] : extractBlockInfos(content)),
    [content, markdown],
  )

  // A lexical body can parse yet still render nothing. Two ways that happens:
  // an unknown node type makes the headless editor drop the whole document
  // (0 segments), or the segments come back with no text runs at all so every
  // block collapses to zero height. Either way, fall back to the markdown text
  // so the article is never a blank page. This is a blank-page guard, not a
  // format choice: it only fires when the declared renderer produced nothing,
  // so the declared format keeps priority on every platform.
  const lexicalTextLength = useMemo(() => {
    if (!renderedSegments) return null
    let total = 0
    for (const segment of renderedSegments) {
      if (segment.kind !== 'text') continue
      for (const block of segment.blocks)
        for (const run of block.runs) total += run.text.length
    }
    return total
  }, [renderedSegments])

  const lexicalCameOutEmpty =
    !markdown &&
    value !== null &&
    renderedSegments !== null &&
    (value.root?.children?.length ?? 0) > 0 &&
    (renderedSegments.length === 0 || lexicalTextLength === 0)
  const fallbackMarkdown = useMemo(
    () =>
      lexicalCameOutEmpty && fallbackText
        ? markdownArticle(fallbackText)
        : null,
    [lexicalCameOutEmpty, fallbackText],
  )
  const activeAnchor = selectionSheet?.anchor ?? null
  const highlights = useMemo(
    () =>
      buildHighlights({
        activeAnchor,
        blockComments,
        blockInfos,
        highlightBlockId,
        map: blockMap,
        rangeComments,
      }),
    [
      activeAnchor,
      blockComments,
      blockInfos,
      highlightBlockId,
      blockMap,
      rangeComments,
    ],
  )

  const rectForBlock = (blockId: string) => {
    const rects = blockRectsRef.current
    if (rects[blockId]) return rects[blockId]
    const itemKey = Object.keys(rects).find((key) =>
      key.startsWith(`${blockId}#`),
    )
    return itemKey ? rects[itemKey] : undefined
  }

  const scrollToBlock = (
    blockId: string,
    offsetRatio: number,
    align: 'center' | 'top' = 'center',
  ) => {
    const rect = rectForBlock(blockId)
    if (!rect) return
    const anchor = align === 'top' ? 0 : rect.height / 2
    scrollRef.current?.scrollTo({
      animated: true,
      y: Math.max(
        0,
        rect.y + bodyTopRef.current + anchor - windowHeight * offsetRatio,
      ),
    })
  }

  useEffect(() => {
    if (!autoFollow || !highlightBlockId) return
    scrollToBlock(highlightBlockId, 0.38)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFollow, highlightBlockId])

  useEffect(
    () => subscribeTocJump((blockId) => scrollToBlock(blockId, 0.12)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(
    () =>
      registerTocOffsets((blockId) => {
        const rect = rectForBlock(blockId)
        return rect ? bodyTopRef.current + rect.y : null
      }),
    [],
  )

  useFocusEffect(
    useCallback(() => {
      if (isPreview) return
      return () => navigation.setOptions({ gestureEnabled: true })
    }, [isPreview, navigation]),
  )

  const handleSelectionActive = (active: boolean) => {
    if (isPreview || !navigation.isFocused()) return
    navigation.setOptions({ gestureEnabled: !active })
  }

  const handleLinkPress = (url: string) => {
    if (url.startsWith(FOOTNOTE_SCHEME)) {
      if (footnoteSectionRef.current)
        scrollToBlock(footnoteSectionRef.current, 0.12, 'top')
      return
    }
    const href = hrefForExternalUrl(url)
    if (href) {
      router.push(href)
    } else {
      void openExternalUrl(url)
    }
  }

  const handleHighlightPress = (id: string) => {
    const range = rangeComments.find((comment) => comment.id === id)
    if (range) {
      handleSelectionMessage({
        type: 'yohaku:range-comment',
        anchor: range.anchor,
      })
      return
    }
    const block = blockComments.find((comment) => comment.id === id)
    if (block) {
      handleSelectionMessage({
        type: 'yohaku:block-comment',
        anchor: block.anchor,
      })
    }
  }

  const documentHandlers: RichDocumentHandlers = {
    enrichments,
    highlights,
    variant,
    webUrl,
    onHighlightPress: handleHighlightPress,
    onLinkPress: handleLinkPress,
    onSelectionActive: handleSelectionActive,
    onBlockLayout: (blockId, y, height) => {
      blockRectsRef.current[blockId] = { y, height }
      invalidateTocOffsets()
    },
    onSegments: (segments) => {
      setRenderedSegments(segments)
      footnoteSectionRef.current =
        segments.flatMap((segment) =>
          segment.kind === 'view' && segment.node.type === 'footnote-section'
            ? [segment.blockId]
            : [],
        )[0] ?? null
      setBlockMap(indexNativeBlocks(segments))
    },
  }

  return (
    <View
      style={[styles.bodySlot, { minHeight: reservedHeight }]}
      onLayout={(e) => {
        const { y } = e.nativeEvent.layout
        bodyTopRef.current = y
        invalidateTocOffsets()
        setSlotTop(y)
      }}
    >
      {fallbackMarkdown ? (
        <MarkdownDocument article={fallbackMarkdown} {...documentHandlers} />
      ) : markdown ? (
        <MarkdownDocument article={markdown} {...documentHandlers} />
      ) : value ? (
        <BodyErrorBoundary
          fallback={
            fallbackMarkdown ? (
              <MarkdownDocument
                article={fallbackMarkdown}
                {...documentHandlers}
              />
            ) : null
          }
        >
        <RichDocument
          value={value}
          {...documentHandlers}
          menuItems={[
            {
              id: 'comment',
              label: selectionCommentTitle,
              icon: 'text.bubble',
            },
            {
              id: 'comment-block',
              label: selectionBlockTitle,
              icon: 'text.quote',
            },
          ]}
          onNestedDocExpand={setNestedDoc}
          onMenuAction={(event) =>
            handleSelectionMessage(
              selectionMessageFromMenuAction(event, blockInfos, blockMap),
            )
          }
        />
        </BodyErrorBoundary>
      ) : null}
      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        visible={nestedDoc !== null}
        onRequestClose={() => setNestedDoc(null)}
      >
        <View style={[styles.sheet, { backgroundColor: palette.neutral[1] }]}>
          <View
            style={[styles.sheetHeader, { borderColor: palette.neutral[3] }]}
          >
            <AppText numberOfLines={1} style={styles.sheetTitle}>
              {nestedDoc?.title || t('nestedDoc')}
            </AppText>
            <Pressable hitSlop={12} onPress={() => setNestedDoc(null)}>
              <AppText variant="secondary">{tc('close')}</AppText>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            {nestedDoc ? (
              <RichDocument
                nested
                value={nestedDoc.contentState}
                variant={variant}
                webUrl={webUrl}
                onLinkPress={(url) => {
                  if (!url.startsWith(FOOTNOTE_SCHEME)) handleLinkPress(url)
                }}
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  bodySlot: {
    position: 'relative',
  },
  sheet: {
    flex: 1,
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
})
