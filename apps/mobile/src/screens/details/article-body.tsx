import {
  useFocusEffect,
  useIsPreview,
  useNavigation,
  useRouter,
} from 'expo-router'
import type { SerializedEditorState } from 'lexical'
import type { RefObject } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ScrollView as ScrollViewType } from 'react-native'
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
import { subscribeTocJump } from '@/lib/article-toc'
import { hrefForExternalUrl } from '@/lib/link-router'
import { openExternalUrl } from '@/lib/open-external'
import {
  buildHighlights,
  indexNativeBlocks,
  type NativeBlockMap,
  selectionMessageFromMenuAction,
} from '@/rich/anchors'
import { FOOTNOTE_SCHEME } from '@/rich/lexical/footnotes'
import { RichDocument } from '@/rich/lexical/rich-document'
import { SelectionCommentSheet } from '@/screens/comments/selection-comment-sheet'
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

export function ArticleBody({
  autoFollow = false,
  content,
  enrichments,
  highlightBlockId = null,
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
  highlightBlockId?: string | null
  queriesEnabled?: boolean
  refId: string
  refType: CommentRefType
  scrollRef: RefObject<ScrollViewType | null>
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
  const [nestedDoc, setNestedDoc] = useState<NestedDoc | null>(null)
  const [blockMap, setBlockMap] = useState<NativeBlockMap>(() => new Map())
  const {
    blockComments,
    closeSelectionSheet,
    handleSelectionMessage,
    rangeComments,
    selectionBlockTitle,
    selectionCommentTitle,
    selectionSheet,
    threadRoots,
  } = useArticleSelection(refId, queriesEnabled)
  const reservedHeight = useReservedBodyHeight(slotTop)

  const value = useMemo(() => parseState(content), [content])
  const blockInfos = useMemo(() => extractBlockInfos(content), [content])
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

  return (
    <View
      style={[styles.bodySlot, { minHeight: reservedHeight }]}
      onLayout={(e) => {
        const { y } = e.nativeEvent.layout
        bodyTopRef.current = y
        setSlotTop(y)
      }}
    >
      {value ? (
        <RichDocument
          enrichments={enrichments}
          highlights={highlights}
          value={value}
          variant={variant}
          webUrl={webUrl}
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
          onHighlightPress={handleHighlightPress}
          onLinkPress={handleLinkPress}
          onNestedDocExpand={setNestedDoc}
          onSelectionActive={handleSelectionActive}
          onBlockLayout={(blockId, y, height) => {
            blockRectsRef.current[blockId] = { y, height }
          }}
          onMenuAction={(event) =>
            handleSelectionMessage(
              selectionMessageFromMenuAction(event, blockInfos, blockMap),
            )
          }
          onSegments={(segments) => {
            footnoteSectionRef.current =
              segments.flatMap((segment) =>
                segment.kind === 'view' &&
                segment.node.type === 'footnote-section'
                  ? [segment.blockId]
                  : [],
              )[0] ?? null
            setBlockMap(indexNativeBlocks(segments))
          }}
        />
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
      <SelectionCommentSheet
        refId={refId}
        refType={refType}
        roots={threadRoots}
        state={selectionSheet}
        onClose={closeSelectionSheet}
      />
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
