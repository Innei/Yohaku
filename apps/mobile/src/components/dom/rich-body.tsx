'use dom'

import '@yohaku/rich-content/module-imports'
import '@yohaku/rich-content/block-styles.css'
import '@yohaku/rich-content/rich.css'
import 'katex/dist/katex.min.css'
import './code-block.css'

import { accent, neutral } from '@yohaku/design-system/tokens'
import {
  type HostEnrichment,
  HostProvider,
  type OpenImagePayload,
} from '@yohaku/rich-content/host'
import {
  createYohakuLexicalRenderer,
  nestedDocExpandHolder,
  REGISTERED_NODE_TYPES,
} from '@yohaku/rich-content/lexical'
import { sanitizeEditorState } from '@yohaku/rich-content/src/lexical/sanitize.ts'
import {
  baseFontVarStyle,
  createYohakuThemeStyle,
} from '@yohaku/rich-content/src/lexical/theme.ts'
import type { SerializedEditorState } from 'lexical'
import type { CSSProperties, ReactNode } from 'react'
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'

import type { Locale } from '@/i18n/config'
import type { CommentAnchor } from '@/lib/comment-anchor'
import {
  printBlockFallback,
  type PrintBlockKind,
  type PrintMasthead,
} from '@/screens/details/article-print'
import { WEBVIEW_FONT_FAMILY } from '@/theme/font-faces'
import { extractBlockOrder, indexForBlock } from '@/tts/blocks'

import { extractBlockInfos } from './anchor-utils'
import { MobileCodeBlock } from './code-block'
import { MobileFileCard } from './file-card'
import { activePreparedContent } from './reader-content-state'
import {
  applyActiveCommentHighlight,
  applyBlockWashes,
  applyCommentHighlights,
  type BlockComment,
  hitTestBlockComment,
  hitTestRangeComment,
  type RangeComment,
  rememberSelectionBlock,
  requestBlockComment,
  requestSelectionComment,
} from './selection-comment'
import { createWebviewHost, prewarmNativeImagePreview } from './webview-host'

export type RichBodyImagePress = OpenImagePayload

export interface RichBodyNestedDocExpand {
  contentState: SerializedEditorState
  title?: string
}

export interface RichBodyFontFace {
  family: string
  uri: string
  weight: number
}

// The DOM sandbox has no access to native modules, so the locale store cannot
// be imported here — every string and the locale itself arrive as props.
export interface RichBodyLabels {
  codeCopied: string
  codeCopy: string
  codeExpand: string
  fileDownloadFull: string
  filePreviewDownload: string
  filePreviewTruncated: string
  filePreviewUnavailable: string
  nestedDocCollapse: string
  nestedDocExpand: string
  nestedDocLabel: string
  openInBrowser: string
  unrenderable: string
}

export interface ReaderContent {
  content: string
  enrichments?: Record<string, HostEnrichment>
  id: string
  variant: 'article' | 'note'
  webUrl: string
}

interface RichBodyProps {
  activeCommentAnchor?: CommentAnchor | null
  apiBase: string
  blockComments?: BlockComment[]
  content: string
  dom?: import('expo/dom').DOMProps & {
    printTarget?: boolean
    shared?: boolean
  }
  enrichments?: Record<string, HostEnrichment>
  fontFaces?: RichBodyFontFace[]
  fontScale?: number
  highlightBlockId?: string | null
  labels: RichBodyLabels
  locale: string
  onImagePress: (payload: RichBodyImagePress) => Promise<void>
  onLinkPress: (url: string) => Promise<void>
  onNestedDocExpand?: (payload: RichBodyNestedDocExpand) => Promise<void>
  onPrintReady?: () => Promise<boolean | void>
  onScrollToAnchor: (id: string) => Promise<void>
  printDocument?: PrintMasthead
  rangeComments?: RangeComment[]
  readerId?: string
  ref?: import('react').Ref<unknown>
  serifFontFamily: string
  site?: { ownerAvatar?: string | null; ownerName?: string | null }
  theme: 'dark' | 'light'
  variant: 'article' | 'note'
  viewportHeight?: number
  webUrl: string
}

let preparedContent: ReaderContent | null = null
const readerListeners = new Set<() => void>()

function notifyReader() {
  for (const listener of readerListeners) listener()
}

function subscribeReader(listener: () => void) {
  readerListeners.add(listener)
  return () => {
    readerListeners.delete(listener)
  }
}

function readPreparedContent() {
  return preparedContent
}

function postBridgeMessage(message: object) {
  try {
    ;(
      window as unknown as {
        ReactNativeWebView?: { postMessage: (data: string) => void }
      }
    ).ReactNativeWebView?.postMessage(JSON.stringify(message))
  } catch {}
}

const domGlobal = window as unknown as {
  __yohakuAttachReader?: () => void
  __yohakuRequestBlockComment?: () => void
  __yohakuRequestSelectionComment?: () => void
  __yohakuResetReader?: () => boolean
  __yohakuSetReaderContent?: (json: string) => boolean
}

let requestSelectionCommentImpl: (() => void) | null = null
let requestBlockCommentImpl: (() => void) | null = null
let reportReaderLayoutImpl: (() => void) | null = null
let renderedReaderId: string | null = null
let liveReaderId: string | undefined

function postMissingSelectionHandler(type: string) {
  try {
    ;(
      window as unknown as {
        ReactNativeWebView?: { postMessage: (data: string) => void }
      }
    ).ReactNativeWebView?.postMessage(JSON.stringify({ type }))
  } catch {}
}

domGlobal.__yohakuRequestSelectionComment = () => {
  if (requestSelectionCommentImpl) requestSelectionCommentImpl()
  else postMissingSelectionHandler('yohaku:selection-comment-invalid')
}
domGlobal.__yohakuRequestBlockComment = () => {
  if (requestBlockCommentImpl) requestBlockCommentImpl()
  else postMissingSelectionHandler('yohaku:selection-block-invalid')
}

domGlobal.__yohakuSetReaderContent = (json) => {
  let payload: ReaderContent
  try {
    payload = JSON.parse(json) as ReaderContent
  } catch {
    return false
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.content !== 'string' ||
    typeof payload.id !== 'string' ||
    (payload.variant !== 'article' && payload.variant !== 'note') ||
    typeof payload.webUrl !== 'string'
  ) {
    return false
  }
  preparedContent = payload
  notifyReader()
  return true
}

domGlobal.__yohakuResetReader = () => {
  preparedContent = {
    content: '',
    id: liveReaderId ?? renderedReaderId ?? '',
    variant: 'article',
    webUrl: '',
  }
  renderedReaderId = null
  notifyReader()
  return true
}

domGlobal.__yohakuAttachReader = () => {
  if (preparedContent?.content === '') {
    preparedContent = null
    notifyReader()
  }
  postBridgeMessage({ type: '$$dom_ready', data: null })
  requestAnimationFrame(() => {
    if (renderedReaderId) {
      postBridgeMessage({ type: 'yohaku:reader-ready', data: renderedReaderId })
    }
    reportReaderLayoutImpl?.()
  })
}

const RichContent = createYohakuLexicalRenderer()

// Props cross the DOM bridge freshly deserialized on every update, and expo
// marshals callbacks through a Proxy that mints a new function per property
// read — so object and function identities churn even when nothing changed.
// Prepared content and the host's later props are often identical; comparing
// these by identity would redo the whole article on the second arrival.
function useLatestRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}

function useStableEnrichments(
  enrichments: Record<string, HostEnrichment> | undefined,
) {
  const serialized = JSON.stringify(enrichments ?? null)
  return useMemo(
    () =>
      serialized === 'null'
        ? undefined
        : (JSON.parse(serialized) as Record<string, HostEnrichment>),
    [serialized],
  )
}

// The WebView cannot see fonts expo-font registers on the native side, so
// the host passes the same font assets' URIs in as props (see
// theme/webview-fonts.ts) and they are re-declared as web @font-face rules —
// one family per name with real weight mapping, unlike expo-font's
// per-weight family names.
function buildFontFaceCss(fontFaces: RichBodyFontFace[] | undefined): string {
  if (!fontFaces) return ''
  return fontFaces
    .map(
      ({ family, uri, weight }) =>
        `@font-face { font-family: '${family}'; font-weight: ${weight}; font-display: swap; src: url('${uri}') format('truetype'); }`,
    )
    .join('\n')
}

class BodyErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function RichBody({
  activeCommentAnchor = null,
  apiBase,
  content,
  enrichments,
  fontFaces,
  fontScale = 1,
  highlightBlockId = null,
  labels,
  locale,
  readerId,
  blockComments,
  rangeComments,
  serifFontFamily,
  site,
  theme,
  variant,
  viewportHeight,
  onLinkPress,
  onImagePress,
  onNestedDocExpand,
  onPrintReady,
  onScrollToAnchor,
  printDocument,
  webUrl,
}: RichBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  liveReaderId = readerId
  const prepared = useSyncExternalStore(subscribeReader, readPreparedContent)
  const activePrepared = activePreparedContent(prepared, readerId, content)

  useEffect(() => {
    if (!prepared || activePrepared) return
    preparedContent = null
    notifyReader()
  }, [activePrepared, prepared])

  const bodyContent = activePrepared?.content ?? content
  const bodyReaderId = activePrepared?.id ?? readerId
  const bodyEnrichments = useStableEnrichments(
    activePrepared?.enrichments ?? enrichments,
  )
  const bodyVariant = activePrepared?.variant ?? variant
  const bodyWebUrl = activePrepared?.webUrl ?? webUrl

  useEffect(() => {
    if (!bodyReaderId || bodyContent.trim() === '') return
    renderedReaderId = bodyReaderId
    postBridgeMessage({ type: 'yohaku:reader-ready', data: bodyReaderId })
  }, [bodyContent, bodyReaderId])

  const handlersRef = useLatestRef({
    onImagePress,
    onLinkPress,
    onScrollToAnchor,
  })
  const handlers = useMemo(
    () => ({
      onImagePress: (payload: RichBodyImagePress) =>
        handlersRef.current.onImagePress(payload),
      onLinkPress: (url: string) => handlersRef.current.onLinkPress(url),
      onScrollToAnchor: (id: string) =>
        handlersRef.current.onScrollToAnchor(id),
    }),
    [handlersRef],
  )

  useEffect(() => {
    if (!onNestedDocExpand) return
    nestedDocExpandHolder.current = ({ contentState, title }) => {
      void onNestedDocExpand({ contentState, title })
    }
    return () => {
      nestedDocExpandHolder.current = null
    }
  }, [onNestedDocExpand])

  useEffect(() => {
    if (document.querySelector('meta[name="viewport"]')) return
    const meta = document.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1'
    document.head.append(meta)
  }, [])

  useEffect(() => {
    const postAnchors = () => {
      postBridgeMessage({
        type: 'yohaku:anchors',
        data: Object.fromEntries(
          [...document.querySelectorAll<HTMLElement>('[id]')].map((el) => [
            el.id,
            el.getBoundingClientRect().top + window.scrollY,
          ]),
        ),
      })
      const root = document.querySelector('.rich-content')
      if (!root) return
      postBridgeMessage({
        type: 'yohaku:blocks',
        data: [...root.children].map((node) => {
          const el = node as HTMLElement
          const rect = el.getBoundingClientRect()
          return {
            height: rect.height,
            y: rect.top + window.scrollY,
          }
        }),
      })
    }

    const report = () => {
      postBridgeMessage({
        type: '$$match_contents_event',
        data: {
          width: document.body.clientWidth,
          height: document.body.clientHeight,
        },
      })
      postAnchors()
    }
    reportReaderLayoutImpl = report

    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(report)
    })

    // Images, mermaid/excalidraw canvases, and every fetchJSON-backed block
    // (poll/stock/afilmory/dynamic) settle after the rAF snapshot above and
    // shift everything below them — re-post whenever body layout changes.
    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(report, 200)
    })
    resizeObserver.observe(document.body)

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      resizeObserver.disconnect()
      clearTimeout(resizeTimer)
      if (reportReaderLayoutImpl === report) reportReaderLayoutImpl = null
    }
  }, [bodyContent])

  useEffect(() => {
    const apply = () => {
      const root = containerRef.current?.querySelector('.rich-content')
      if (!root) return
      for (const child of root.children) child.classList.remove('tts-current')
      if (!highlightBlockId) return
      const index = indexForBlock(
        extractBlockOrder(bodyContent),
        highlightBlockId,
      )
      if (index < 0) return
      root.children[index]?.classList.add('tts-current')
    }
    apply()
    const timer = window.setTimeout(apply, 80)
    return () => window.clearTimeout(timer)
  }, [bodyContent, highlightBlockId])

  const rangeCommentsKey = JSON.stringify(rangeComments ?? null)
  const stableRangeComments = useMemo(
    () =>
      rangeCommentsKey === 'null'
        ? []
        : (JSON.parse(rangeCommentsKey) as RangeComment[]),
    [rangeCommentsKey],
  )
  const blockCommentsKey = JSON.stringify(blockComments ?? null)
  const stableBlockComments = useMemo(
    () =>
      blockCommentsKey === 'null'
        ? []
        : (JSON.parse(blockCommentsKey) as BlockComment[]),
    [blockCommentsKey],
  )
  const activeAnchorKey = JSON.stringify(activeCommentAnchor ?? null)
  const stableActiveAnchor = useMemo(
    () =>
      activeAnchorKey === 'null'
        ? null
        : (JSON.parse(activeAnchorKey) as CommentAnchor),
    [activeAnchorKey],
  )
  const blockInfos = useMemo(
    () => extractBlockInfos(bodyContent),
    [bodyContent],
  )

  useEffect(() => {
    const runRange = () =>
      requestSelectionComment(containerRef.current, blockInfos)
    const runBlock = () => requestBlockComment(containerRef.current, blockInfos)
    const remember = () =>
      rememberSelectionBlock(containerRef.current, blockInfos)
    requestSelectionCommentImpl = runRange
    requestBlockCommentImpl = runBlock
    document.addEventListener('selectionchange', remember)
    return () => {
      document.removeEventListener('selectionchange', remember)
      if (requestSelectionCommentImpl === runRange) {
        requestSelectionCommentImpl = null
      }
      if (requestBlockCommentImpl === runBlock) {
        requestBlockCommentImpl = null
      }
    }
  }, [blockInfos])

  useEffect(() => {
    const host = containerRef.current
    const apply = () => {
      const root = host?.querySelector('.rich-content') ?? null
      applyCommentHighlights(root, blockInfos, stableRangeComments)
      applyBlockWashes(root, blockInfos, stableBlockComments)
      applyActiveCommentHighlight(root, blockInfos, stableActiveAnchor)
    }
    apply()
    const timer = window.setTimeout(apply, 80)
    return () => {
      clearTimeout(timer)
      applyCommentHighlights(null, blockInfos, [])
      applyBlockWashes(
        host?.querySelector('.rich-content') ?? null,
        blockInfos,
        [],
      )
      applyActiveCommentHighlight(null, blockInfos, null)
    }
  }, [
    blockInfos,
    bodyContent,
    stableActiveAnchor,
    stableBlockComments,
    stableRangeComments,
  ])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const bridge = (
      window as unknown as {
        ReactNativeWebView?: { postMessage: (data: string) => void }
      }
    ).ReactNativeWebView
    const post = (locked: boolean) =>
      bridge?.postMessage(
        JSON.stringify({ type: 'yohaku:gesture-lock', locked }),
      )
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement
      const image = target.closest?.('img')
      if (image instanceof HTMLImageElement) {
        prewarmNativeImagePreview(image)
      }
      if (target.closest?.('.group\\/excalidraw')) {
        post(true)
        return
      }
      const scroller = target.closest?.('.rich-table-scroll')
      if (scroller && scroller.scrollWidth > scroller.clientWidth) {
        post(true)
      }
    }
    const onRelease = () => post(false)
    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onRelease)
    window.addEventListener('pointercancel', onRelease)
    return () => {
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onRelease)
      window.removeEventListener('pointercancel', onRelease)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onClick = (event: MouseEvent) => {
      const contentEl = container.querySelector('.rich-content')
      const postHit = (type: string, anchor: unknown) => {
        event.preventDefault()
        event.stopPropagation()
        try {
          ;(
            window as unknown as {
              ReactNativeWebView?: { postMessage: (data: string) => void }
            }
          ).ReactNativeWebView?.postMessage(JSON.stringify({ type, anchor }))
        } catch {}
      }
      if (contentEl && stableRangeComments.length > 0) {
        const hit = hitTestRangeComment(
          contentEl,
          blockInfos,
          stableRangeComments,
          event.clientX,
          event.clientY,
        )
        if (hit) {
          postHit('yohaku:range-comment', hit)
          return
        }
      }
      const link = (event.target as HTMLElement).closest('a')
      if (link?.href) {
        const rawHref = link.getAttribute('href')
        event.preventDefault()
        event.stopPropagation()
        if (rawHref?.startsWith('#')) {
          void handlers.onScrollToAnchor(rawHref.slice(1))
          return
        }
        void handlers.onLinkPress(link.href)
        return
      }
      if (contentEl && stableBlockComments.length > 0) {
        const hit = hitTestBlockComment(
          contentEl,
          blockInfos,
          stableBlockComments,
          event.clientX,
          event.clientY,
        )
        if (hit) {
          postHit('yohaku:block-comment', hit)
        }
      }
    }
    container.addEventListener('click', onClick)
    return () => container.removeEventListener('click', onClick)
  }, [blockInfos, handlers, stableBlockComments, stableRangeComments])

  // Depend on the label strings, not on `labels`: props cross the DOM bridge
  // serialized, so the object arrives with a fresh identity on every update
  // and would invalidate this memo — and with it the whole renderer subtree —
  // on every render.
  const {
    codeCopied,
    codeCopy,
    codeExpand,
    fileDownloadFull,
    filePreviewDownload,
    filePreviewTruncated,
    filePreviewUnavailable,
    nestedDocCollapse,
    nestedDocExpand,
    nestedDocLabel,
    openInBrowser,
    unrenderable,
  } = labels

  const canExpandNestedDoc = onNestedDocExpand !== undefined

  const siteOwnerAvatar = site?.ownerAvatar ?? null
  const siteOwnerName = site?.ownerName ?? null

  const host = useMemo(
    () =>
      createWebviewHost({
        apiBase,
        codeBlock: MobileCodeBlock,
        enrichments: bodyEnrichments,
        fileCard: (props) =>
          printDocument ? (
            <p className="print-block-fallback">
              {printBlockFallback(
                'file',
                { name: props.name },
                locale as Locale,
              )}
            </p>
          ) : (
            <MobileFileCard
              {...props}
              labels={{
                fileDownloadFull,
                filePreviewDownload,
                filePreviewTruncated,
                filePreviewUnavailable,
              }}
            />
          ),
        locale,
        labels: {
          codeCopied,
          codeCopy,
          codeExpand,
          nestedDocCollapse,
          nestedDocExpand,
          nestedDocLabel,
        },
        nestedDocPresentation: canExpandNestedDoc ? 'modal' : 'inline',
        printCaption: (kind, fields) =>
          printBlockFallback(
            kind as PrintBlockKind,
            fields ?? {},
            locale as Locale,
          ),
        printMode: Boolean(printDocument),
        onImagePress: handlers.onImagePress,
        onLinkPress: handlers.onLinkPress,
        onScrollToAnchor: handlers.onScrollToAnchor,
        site: { ownerAvatar: siteOwnerAvatar, ownerName: siteOwnerName },
        theme,
        webOrigin: bodyWebUrl ? new URL(bodyWebUrl).origin : '',
      }),
    [
      apiBase,
      bodyEnrichments,
      bodyWebUrl,
      canExpandNestedDoc,
      fileDownloadFull,
      filePreviewDownload,
      filePreviewTruncated,
      filePreviewUnavailable,
      handlers,
      locale,
      nestedDocCollapse,
      nestedDocExpand,
      nestedDocLabel,
      printDocument,
      siteOwnerAvatar,
      siteOwnerName,
      theme,
    ],
  )

  const editorState = useMemo<SerializedEditorState | null>(() => {
    try {
      return sanitizeEditorState(JSON.parse(bodyContent), REGISTERED_NODE_TYPES)
    } catch {
      return null
    }
  }, [bodyContent])

  const vars = useMemo(
    () =>
      ({
        ...baseFontVarStyle,
        ...createYohakuThemeStyle(bodyVariant),
        // The shared sans chain leads with var(--app-font-sans), which only
        // web's next/font defines — leaving it unset invalidates the whole font
        // list. System faces resolve from iOS; bundled faces resolve to the
        // @font-face rules injected below from the same ttf assets as native.
        '--app-font-sans': WEBVIEW_FONT_FAMILY.sans,
        '--app-font-serif': serifFontFamily,
        '--app-font-mono': WEBVIEW_FONT_FAMILY.mono,
        '--rc-text': printDocument ? neutral.light[10] : neutral[theme][9],
        '--rc-bg': printDocument ? '#ffffff' : 'transparent',
        '--surface-paper': printDocument ? '#ffffff' : neutral[theme][1],
        '--color-accent': printDocument ? accent.light : accent[theme],
        ...Object.fromEntries(
          Object.entries(printDocument ? neutral.light : neutral[theme]).map(
            ([step, value]) => [`--color-neutral-${step}`, value],
          ),
        ),
        color: printDocument ? neutral.light[10] : neutral[theme][9],
        ...(printDocument
          ? {
              '--app-viewport-height': '1056px',
              // Print host is never shown; set type here so UIPrintFormatter
              // sees 12px even if it snapshots screen styles, not @media print.
              '--rc-font-size-base': '12px',
              '--rc-font-size-small': '10px',
              fontSize: 12,
            }
          : {
              '--rc-font-size-base': `${16 * fontScale}px`,
              '--rc-font-size-small': `${14 * fontScale}px`,
              ...(viewportHeight
                ? { '--app-viewport-height': `${viewportHeight}px` }
                : {}),
            }),
      }) as CSSProperties,
    [
      bodyVariant,
      fontScale,
      printDocument,
      serifFontFamily,
      theme,
      viewportHeight,
    ],
  )

  const openInWeb = useMemo(
    () => (
      <div style={{ padding: '24px 0', textAlign: 'center' }}>
        <p style={{ color: neutral[theme][7], fontSize: 14 }}>{unrenderable}</p>
        <button
          type="button"
          style={{
            background: neutral[theme][10],
            border: 'none',
            borderRadius: 14,
            color: neutral[theme][1],
            fontSize: 15,
            marginTop: 12,
            padding: '10px 20px',
          }}
          onClick={() => void handlers.onLinkPress(bodyWebUrl)}
        >
          {openInBrowser}
        </button>
      </div>
    ),
    [bodyWebUrl, handlers, openInBrowser, theme, unrenderable],
  )

  // Prepared content is followed by Expo's live props, usually with the same
  // values. Holding the rendered subtree in a memo lets React bail out on it
  // when every input compares equal by value, so a repeat costs nothing; a real
  // change (network refresh, another article, a theme flip mid-transition)
  // still invalidates a dependency and re-renders.
  const body = useMemo(
    () => (
      <BodyErrorBoundary fallback={openInWeb}>
        <HostProvider host={host}>
          {bodyContent.trim() === '' ? null : editorState ? (
            <RichContent
              style={vars}
              theme={printDocument ? 'light' : theme}
              value={editorState}
              variant={bodyVariant}
            />
          ) : (
            openInWeb
          )}
        </HostProvider>
      </BodyErrorBoundary>
    ),
    [
      bodyContent,
      bodyVariant,
      editorState,
      host,
      openInWeb,
      printDocument,
      theme,
      vars,
    ],
  )

  useEffect(() => {
    if (!printDocument) return
    for (const node of document.querySelectorAll('details')) node.open = true
  }, [bodyContent, printDocument])

  useEffect(() => {
    if (!printDocument || !onPrintReady) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        const assets = Promise.all([
          document.fonts?.ready ?? Promise.resolve(),
          ...[...document.images].map(
            (image) =>
              image.complete ||
              new Promise<void>((resolve) => {
                image.addEventListener('load', () => resolve(), { once: true })
                image.addEventListener('error', () => resolve(), { once: true })
              }),
          ),
        ])
        await Promise.race([
          assets,
          new Promise<void>((resolve) => window.setTimeout(resolve, 2500)),
        ])
        if (cancelled) return
        const usedNative = await onPrintReady().catch(() => false)
        if (!usedNative) window.print()
      })()
    }, 80)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [bodyContent, onPrintReady, printDocument])

  return (
    <div
      ref={containerRef}
      style={vars}
      className={
        theme === 'dark' && !printDocument
          ? 'rich-body-root dark'
          : 'rich-body-root'
      }
    >
      <style>{`
        ${buildFontFaceCss(fontFaces)}
        html, body { width: 100%; overflow-x: hidden; background: ${printDocument ? '#fff' : 'transparent'}; margin: 0; -webkit-text-size-adjust: 100%; ${printDocument ? 'font-size: 12px; padding: 0;' : ''} }
        .font-mono, code, kbd, samp { font-family: var(--font-mono); }
        .rich-body-root { width: 100vw; overflow-x: hidden; box-sizing: border-box; background: ${printDocument ? '#fff' : 'transparent'}; }
        ${
          printDocument
            ? `
        @page { margin: 12mm 16mm 12mm; }
        .yohaku-details::details-content,
        .yohaku-details[open]::details-content {
          height: auto !important;
          overflow: visible !important;
          opacity: 1 !important;
          content-visibility: visible !important;
        }
        .m-code-block, .yohaku-code-block, .yohaku-code-fold,
        .rich-code-block, .rich-table-scroll, pre {
          overflow: visible !important;
          max-height: none !important;
          mask-image: none !important;
          -webkit-mask-image: none !important;
        }
        .m-code-block--collapsed .m-code-block__body,
        .yohaku-code-block--collapsed .yohaku-code-block__body,
        .yohaku-code-fold--collapsed .yohaku-code-fold__body {
          max-height: none !important;
          overflow: visible !important;
          mask-image: none !important;
          -webkit-mask-image: none !important;
        }
        @media print {
          html, body, .rich-body-root { background: #fff !important; color: var(--color-neutral-10); }
          button, [data-hide-print] { display: none !important; }
          .print-masthead { break-after: avoid; }
          .print-block-fallback { font-size: 12px; line-height: 1.5; color: var(--color-neutral-7); margin: 12px 0; }
          figure, img { break-inside: avoid; }
          .rich-content blockquote { border-left-color: var(--color-accent); }
          .rich-content pre { background: var(--color-neutral-1); }
        }
        .print-masthead { padding: 0 0 14px !important; }
        .print-masthead h1 {
          margin: 0;
          font-family: var(--app-font-serif), var(--font-serif);
          font-size: 22px;
          font-weight: 500;
          line-height: 1.29;
          color: var(--color-neutral-10);
        }
        .print-masthead-rule { height: 1px; margin: 12px 0 8px; background: var(--color-accent); border: 0; }
        .print-masthead-meta, .print-masthead-url {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: var(--color-neutral-7);
        }
        .print-masthead-url { margin-top: 4px; word-break: break-all; }
        .print-block-fallback { font-size: 12px; line-height: 1.5; color: var(--color-neutral-7); margin: 12px 0; }
        `
            : ''
        }
        .rich-content { max-width: 100% !important; box-sizing: border-box; overflow-wrap: break-word; padding-inline: ${printDocument ? '0 !important' : '20px'}; }
        .rich-content img, .rich-content video, .rich-content iframe { max-width: 100%; }
        .rich-content pre { max-width: 100%; overflow-x: auto; }
        .rich-content .rich-table-scroll,
        .rich-content .rich-table-scroll th,
        .rich-content .rich-table-scroll td { overflow-wrap: normal; }
        .rich-content > .tts-current {
          margin-inline: -20px;
          padding-inline: 20px;
          background: color-mix(in srgb, var(--color-accent) 6%, transparent);
        }
        ::highlight(comment-block),
        ::highlight(comment-highlight) {
          background-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
          text-decoration: underline solid;
          text-decoration-color: color-mix(in srgb, var(--color-accent) 42%, transparent);
          text-underline-offset: 3px;
          text-decoration-thickness: 1px;
        }
        ::highlight(comment-selection-active) {
          background-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
          text-decoration: underline solid;
          text-decoration-color: color-mix(in srgb, var(--color-accent) 70%, transparent);
          text-underline-offset: 3px;
          text-decoration-thickness: 1px;
        }
      `}</style>
      {printDocument ? (
        <header className="print-masthead">
          <h1>{printDocument.title}</h1>
          <hr className="print-masthead-rule" />
          <p className="print-masthead-meta">
            {printDocument.category} · {printDocument.dateLabel}
          </p>
          <p className="print-masthead-url">{printDocument.url}</p>
        </header>
      ) : null}
      {body}
    </div>
  )
}
