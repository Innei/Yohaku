import {
  useFocusEffect,
  useIsPreview,
  useNavigation,
  useRouter,
} from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScrollView } from 'react-native'
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { apiBaseUrl } from '@/api/base-url'
import type { ApiEnrichment, CommentRefType } from '@/api/types'
import type {
  RichBodyImagePress,
  RichBodyNestedDocExpand,
} from '@/components/dom/rich-body'
import RichBody from '@/components/dom/rich-body'
import { useRichBodyLabels } from '@/components/dom/use-rich-body-labels'
import { AppText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import type { WatchdogPhase } from '@/lib/body-render-watchdog'
import {
  nextWatchdogPhase,
  SKELETON_DELAY_MS,
  WATCHDOG_TIMEOUT_MS,
} from '@/lib/body-render-watchdog'
import { presentImagePreview } from '@/lib/image-cache'
import { hrefForExternalUrl } from '@/lib/link-router'
import { getSiteUrl } from '@/lib/site-url'
import { useOwner } from '@/owner/store'
import { SelectionCommentSheet } from '@/screens/comments/selection-comment-sheet'
import { timings } from '@/theme/motion'
import { usePalette } from '@/theme/palette'
import { useWebviewFontFaces } from '@/theme/webview-fonts'
import { extractBlockOrder, indexForBlock } from '@/tts/blocks'

import { useReservedBodyHeight } from './body-slot'
import { useArticleSelection } from './use-article-selection'

const SKELETON_LINE_WIDTHS = [92, 100, 96, 60]
const SKELETON_PARAGRAPHS = [0, 1, 2, 3, 4, 5]

export function ArticleBody({
  autoFollow = false,
  content,
  enrichments,
  highlightBlockId = null,
  primeKey,
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
  primeKey: string
  queriesEnabled?: boolean
  refId: string
  refType: CommentRefType
  scrollRef: RefObject<ScrollView | null>
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
  const owner = useOwner()
  const site = owner
    ? { ownerAvatar: owner.avatarUrl, ownerName: owner.name }
    : undefined
  const bodyRef = useRef<{ reload?: () => void } | null>(null)
  const phaseRef = useRef<WatchdogPhase>('waiting')
  const anchorOffsetsRef = useRef<Record<string, number>>({})
  const blockRectsRef = useRef<Array<{ height: number; y: number }>>([])
  const bodyTopRef = useRef(0)
  const [nonce, setNonce] = useState(() => Date.now())
  const [settled, setSettled] = useState(false)
  const [heightKnown, setHeightKnown] = useState(false)
  const [failed, setFailed] = useState(false)
  const [skeletonVisible, setSkeletonVisible] = useState(false)
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
  const opacity = useSharedValue(0)
  const labels = useRichBodyLabels()
  const reservedHeight = useReservedBodyHeight(slotTop)

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

  useEffect(() => {
    const timer = setTimeout(() => setSkeletonVisible(true), SKELETON_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (isPreview) return
      return () => navigation.setOptions({ gestureEnabled: true })
    }, [isPreview, navigation]),
  )

  useEffect(() => {
    if (settled || failed) return
    const timeout = WATCHDOG_TIMEOUT_MS[phaseRef.current]
    if (timeout === undefined) return
    const timer = setTimeout(() => {
      const next = nextWatchdogPhase(phaseRef.current)
      if (!next) return
      phaseRef.current = next.phase
      if (next.action === 'fail') {
        setFailed(true)
        return
      }
      if (next.action === 'reload') bodyRef.current?.reload?.()
      setNonce((n) => n + 1)
    }, timeout)
    return () => clearTimeout(timer)
  }, [nonce, settled, failed])

  useEffect(() => {
    if (settled) opacity.value = withTiming(1, timings.fade)
  }, [settled, opacity])

  useEffect(() => {
    if (!autoFollow || !highlightBlockId) return
    const index = indexForBlock(extractBlockOrder(content), highlightBlockId)
    const rect = blockRectsRef.current[index]
    if (!rect) return
    scrollRef.current?.scrollTo({
      animated: true,
      y: Math.max(
        0,
        rect.y + bodyTopRef.current + rect.height / 2 - windowHeight * 0.38,
      ),
    })
  }, [autoFollow, content, highlightBlockId, scrollRef, windowHeight])

  const bodyStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    let payload: {
      anchor?: unknown
      data?: unknown
      length?: number
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
    if (payload.type !== 'yohaku:rendered') return
    if (payload.length !== content.length) return
    phaseRef.current = 'settled'
    setSettled(true)
  }

  if (failed) {
    return (
      <AppText
        style={styles.failed}
        variant="secondary"
        onPress={() => void WebBrowser.openBrowserAsync(webUrl)}
      >
        {t('bodyFailedOpenWeb')}
      </AppText>
    )
  }

  return (
    <View
      style={heightKnown ? undefined : { minHeight: reservedHeight }}
      onLayout={(e) => {
        const { y } = e.nativeEvent.layout
        bodyTopRef.current = y
        setSlotTop(y)
      }}
    >
      {settled || !skeletonVisible ? null : (
        <View pointerEvents="none" style={styles.skeleton}>
          {SKELETON_PARAGRAPHS.map((paragraph) => (
            <View key={paragraph} style={styles.skeletonParagraph}>
              {SKELETON_LINE_WIDTHS.map((width) => (
                <View
                  key={width}
                  style={[
                    styles.skeletonLine,
                    { backgroundColor: palette.neutral[3], width: `${width}%` },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      )}
      <Animated.View
        style={[bodyStyle, styles.bodyBleed]}
        onLayout={(e) => {
          if (e.nativeEvent.layout.height > 0) setHeightKnown(true)
        }}
      >
        <RichBody
          apiBase={apiBaseUrl()}
          blockComments={blockComments}
          content={content}
          enrichments={enrichments ?? undefined}
          fontFaces={fontFaces}
          highlightBlockId={highlightBlockId}
          labels={labels}
          locale={locale}
          primeKey={primeKey}
          rangeComments={rangeComments}
          ref={bodyRef}
          renderNonce={nonce}
          site={site}
          theme={palette.theme}
          variant={variant}
          viewportHeight={windowHeight}
          webUrl={webUrl}
          dom={{
            contentInsetAdjustmentBehavior: 'never',
            matchContents: true,
            primeKey,
            scrollEnabled: false,
            selectionBlockTitle,
            selectionCommentTitle,
            selectionMenu: 'copyComment',
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
  skeleton: {
    flex: 1,
    gap: 22,
    // Clipped rather than counted to fit: a line cut off at the fold reads as
    // an article that continues, which is what is actually loading.
    overflow: 'hidden',
    paddingVertical: 6,
  },
  skeletonParagraph: {
    gap: 14,
  },
  skeletonLine: {
    borderRadius: 4,
    height: 15,
  },
  failed: {
    marginTop: 32,
    textAlign: 'center',
  },
})
