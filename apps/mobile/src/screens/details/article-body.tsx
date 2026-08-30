import {
  useFocusEffect,
  useIsPreview,
  useNavigation,
  useRouter,
} from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScrollView as ScrollViewType } from 'react-native'
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { apiBaseUrl } from '@/api/base-url'
import type { ApiEnrichment, CommentRefType } from '@/api/types'
import { isPreparedReader } from '@/components/dom/prepare-reader'
import type {
  RichBodyImagePress,
  RichBodyNestedDocExpand,
} from '@/components/dom/rich-body'
import RichBody from '@/components/dom/rich-body'
import { useRichBodyLabels } from '@/components/dom/use-rich-body-labels'
import { AppText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { subscribeTocJump } from '@/lib/article-toc'
import { presentImagePreview } from '@/lib/image-cache'
import { hrefForExternalUrl } from '@/lib/link-router'
import { getSiteUrl } from '@/lib/site-url'
import { useOwner } from '@/owner/store'
import { SelectionCommentSheet } from '@/screens/comments/selection-comment-sheet'
import { timings } from '@/theme/motion'
import { usePalette } from '@/theme/palette'
import { useWebviewSerifFontFamily } from '@/theme/serif-font'
import { useWebviewFontFaces } from '@/theme/webview-fonts'
import { extractBlockOrder, indexForBlock } from '@/tts/blocks'

import {
  BODY_LOADING_DELAY_MS,
  bodyRevealMotion,
} from './body-reveal'
import { BodyLoadingIndicator, useReservedBodyHeight } from './body-slot'
import { useArticleSelection } from './use-article-selection'

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
  const locale = useLocale()
  const t = useTranslations('detail')
  const tc = useTranslations('common')
  const palette = usePalette()
  const { height: windowHeight } = useWindowDimensions()
  const isPreview = useIsPreview()
  const router = useRouter()
  const navigation = useNavigation()
  const fontFaces = useWebviewFontFaces()
  const serifFontFamily = useWebviewSerifFontFamily()
  const owner = useOwner()
  const site = owner
    ? { ownerAvatar: owner.avatarUrl, ownerName: owner.name }
    : undefined
  const anchorOffsetsRef = useRef<Record<string, number>>({})
  const blockRectsRef = useRef<Array<{ height: number; y: number }>>([])
  const bodyTopRef = useRef(0)
  const prepared = isPreparedReader(refId)
  const revealedRef = useRef(prepared)
  const mountedAtRef = useRef(Date.now())
  const [ready, setReady] = useState(prepared)
  const [showLoading, setShowLoading] = useState(false)
  const [slotTop, setSlotTop] = useState<number | null>(null)
  const [nestedDoc, setNestedDoc] = useState<RichBodyNestedDocExpand | null>(
    null,
  )
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
  const reveal = useSharedValue(prepared ? 1 : 0)
  const labels = useRichBodyLabels()
  const reservedHeight = useReservedBodyHeight(slotTop)
  const bodyStyle = useAnimatedStyle(() => ({ opacity: reveal.value }))

  const handleImagePress = async ({
    images,
    index,
    src,
  }: RichBodyImagePress) => {
    const urls = images.length > 0 ? images : src ? [src] : []
    if (urls.length === 0) return
    await presentImagePreview({
      index: Math.max(0, index),
      siteReferer: getSiteUrl(),
      urls,
    })
  }

  const handleLinkPress = async (url: string) => {
    const href = hrefForExternalUrl(url)
    if (href) {
      router.push(href)
    } else {
      await WebBrowser.openBrowserAsync(url)
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (isPreview) return
      return () => navigation.setOptions({ gestureEnabled: true })
    }, [isPreview, navigation]),
  )

  const scrollToBlock = useCallback(
    (blockId: string, offsetRatio: number) => {
      const index = indexForBlock(extractBlockOrder(content), blockId)
      const rect = blockRectsRef.current[index]
      if (!rect) return
      scrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(
          0,
          rect.y +
            bodyTopRef.current +
            rect.height / 2 -
            windowHeight * offsetRatio,
        ),
      })
    },
    [content, scrollRef, windowHeight],
  )

  useEffect(() => {
    if (!autoFollow || !highlightBlockId) return
    scrollToBlock(highlightBlockId, 0.38)
  }, [autoFollow, highlightBlockId, scrollToBlock])

  useEffect(
    () => subscribeTocJump((blockId) => scrollToBlock(blockId, 0.12)),
    [scrollToBlock],
  )

  useEffect(() => {
    if (ready) return
    const timer = setTimeout(() => setShowLoading(true), BODY_LOADING_DELAY_MS)
    return () => clearTimeout(timer)
  }, [ready])

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    let payload: {
      anchor?: unknown
      data?: unknown
      locked?: boolean
      selectedText?: unknown
      type?: string
    }
    try {
      payload = JSON.parse(event.nativeEvent.data) as typeof payload
    } catch {
      return
    }
    if (handleSelectionMessage(payload)) return
    if (payload.type === 'yohaku:reader-ready') {
      if (payload.data !== refId || revealedRef.current) return
      revealedRef.current = true
      setReady(true)
      setShowLoading(false)
      if (
        bodyRevealMotion(Date.now() - mountedAtRef.current) === 'instant'
      ) {
        reveal.set(1)
      } else {
        reveal.set(
          withTiming(1, {
            ...timings.fade,
            reduceMotion: ReduceMotion.System,
          }),
        )
      }
      return
    }
    if (payload.type === 'yohaku:gesture-lock') {
      if (!isPreview && navigation.isFocused()) {
        navigation.setOptions({ gestureEnabled: payload.locked !== true })
      }
      return
    }
    if (payload.type === 'yohaku:anchors') {
      if (payload.data && typeof payload.data === 'object') {
        anchorOffsetsRef.current = payload.data as Record<string, number>
      }
      return
    }
    if (payload.type === 'yohaku:blocks') {
      if (Array.isArray(payload.data)) {
        blockRectsRef.current = payload.data.filter(
          (item): item is { height: number; y: number } =>
            !!item &&
            typeof item === 'object' &&
            typeof (item as { y?: unknown }).y === 'number' &&
            typeof (item as { height?: unknown }).height === 'number',
        )
      }
      return
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
      {showLoading ? (
        <View
          accessibilityElementsHidden={ready}
          importantForAccessibility={ready ? 'no-hide-descendants' : 'auto'}
          pointerEvents="none"
          style={styles.loading}
        >
          <BodyLoadingIndicator minHeight={reservedHeight} />
        </View>
      ) : null}
      <Animated.View style={[styles.bodyBleed, bodyStyle]}>
        <RichBody
          activeCommentAnchor={selectionSheet?.anchor ?? null}
          apiBase={apiBaseUrl()}
          blockComments={blockComments}
          content={content}
          enrichments={enrichments ?? undefined}
          fontFaces={fontFaces}
          highlightBlockId={highlightBlockId}
          labels={labels}
          locale={locale}
          rangeComments={rangeComments}
          readerId={refId}
          serifFontFamily={serifFontFamily}
          site={site}
          theme={palette.theme}
          variant={variant}
          viewportHeight={windowHeight}
          webUrl={webUrl}
          dom={{
            contentInsetAdjustmentBehavior: 'never',
            containerStyle: { minHeight: reservedHeight, width: '100%' },
            matchContents: true,
            scrollEnabled: false,
            selectionBlockTitle,
            selectionCommentTitle,
            selectionMenu: 'copyComment',
            shared: true,
            siteReferer: getSiteUrl(),
            onMessage: handleMessage,
          }}
          onImagePress={handleImagePress}
          onLinkPress={handleLinkPress}
          onNestedDocExpand={async (payload) => setNestedDoc(payload)}
          onScrollToAnchor={async (id) => {
            const y = anchorOffsetsRef.current[id]
            if (y === undefined) return
            scrollRef.current?.scrollTo({
              animated: true,
              y: Math.max(0, y + bodyTopRef.current),
            })
          }}
        />
      </Animated.View>
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
          <View style={styles.sheetBody}>
            {nestedDoc ? (
              <RichBody
                apiBase={apiBaseUrl()}
                content={JSON.stringify(nestedDoc.contentState)}
                enrichments={enrichments ?? undefined}
                fontFaces={fontFaces}
                labels={labels}
                locale={locale}
                serifFontFamily={serifFontFamily}
                site={site}
                theme={palette.theme}
                variant={variant}
                viewportHeight={windowHeight}
                webUrl={webUrl}
                dom={{
                  contentInsetAdjustmentBehavior: 'never',
                  scrollEnabled: true,
                  siteReferer: getSiteUrl(),
                  style: { flex: 1 },
                }}
                onImagePress={handleImagePress}
                onLinkPress={handleLinkPress}
                onScrollToAnchor={async () => {}}
              />
            ) : null}
          </View>
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
  loading: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    flex: 1,
  },
  bodyBleed: {
    marginHorizontal: -20,
  },
  sheetBody: {
    flex: 1,
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
