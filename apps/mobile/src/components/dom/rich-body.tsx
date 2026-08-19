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

import { WEBVIEW_FONT_FAMILY } from '@/theme/font-faces'
import { extractBlockOrder, indexForBlock } from '@/tts/blocks'

import { extractBlockInfos } from './anchor-utils'
import { MobileCodeBlock } from './code-block'
import {
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
  nestedDocCollapse: string
  nestedDocExpand: string
  nestedDocLabel: string
  openInBrowser: string
  unrenderable: string
}

export interface RichBodyPrime {
  content: string
  enrichments?: Record<string, HostEnrichment>
  key: string
  variant: 'article' | 'note'
  webUrl: string
}

interface RichBodyProps {
  apiBase: string
  blockComments?: BlockComment[]
  content: string
  dom?: import('expo/dom').DOMProps
  enrichments?: Record<string, HostEnrichment>
  fontFaces?: RichBodyFontFace[]
  highlightBlockId?: string | null
  labels: RichBodyLabels
  locale: string
  onImagePress: (payload: RichBodyImagePress) => Promise<void>
  onLinkPress: (url: string) => Promise<void>
  onNestedDocExpand?: (payload: RichBodyNestedDocExpand) => Promise<void>
  onScrollToAnchor: (id: string) => Promise<void>
  primeKey?: string
  rangeComments?: RangeComment[]
  ref?: import('react').Ref<unknown>
  renderNonce?: number
  site?: { ownerAvatar?: string | null; ownerName?: string | null }
  theme: 'dark' | 'light'
  variant: 'article' | 'note'
  viewportHeight?: number
  webUrl: string
}

let primed: (RichBodyPrime & { seq: number }) | null = null
let primeSeq = 0
const primeListeners = new Set<() => void>()

function notifyPrime() {
  for (const listener of primeListeners) listener()
}

function subscribePrime(listener: () => void) {
  primeListeners.add(listener)
  return () => {
    primeListeners.delete(listener)
  }
}

function readPrime() {
  return primed
}

// Props are the source of truth once the host has caught up; keeping the primed
// copy past that would pin the body to whatever was in SQLite at tap time and
// hide the detail screen's network refresh.
function dropSupersededPrime(content: string, key: string | undefined) {
  if (primed === null) return
  if (primed.content === content && primed.key === key) return
  primed = null
  notifyPrime()
}

// The pool injects both of these while the webview sits unmounted between
// screens, so they have to exist from module evaluation — registering them from
// an effect would miss every instance primed or reset before React commits.
const domGlobal = window as unknown as {
  __yohakuPrime?: (json: string) => boolean
  __yohakuRequestBlockComment?: () => void
  __yohakuRequestSelectionComment?: () => void
  __yohakuReset?: () => void
}

let requestSelectionCommentImpl: (() => void) | null = null
let requestBlockCommentImpl: (() => void) | null = null

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

domGlobal.__yohakuPrime = (json) => {
  let payload: RichBodyPrime
  try {
    payload = JSON.parse(json) as RichBodyPrime
  } catch {
    return false
  }
  if (primeListeners.size === 0) return false
  primeSeq += 1
  primed = { ...payload, seq: primeSeq }
  notifyPrime()
  return true
}

// Dropping the prime is what makes the reset a real reset: the pool hands this
// instance to a screen that may render before its own props arrive, and a
// surviving prime would show it the article the previous reader was on. It
// deliberately does not notify — the subscribers re-run their report effect,
// which un-hides the body this just hid; the store is re-read by the render the
// adopting screen's props cause, which is exactly when the drop should land.
domGlobal.__yohakuReset = () => {
  document.body.style.visibility = 'hidden'
  primed = null
}

const RichContent = createYohakuLexicalRenderer()

// Props cross the DOM bridge freshly deserialized on every update, and expo
// marshals callbacks through a Proxy that mints a new function per property
// read — so object and function identities churn even when nothing changed.
// Content arrives twice per open (prime, then `$$props`); comparing these by
// identity would redo the whole article on the second, identical arrival.
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
  apiBase,
  content,
  enrichments,
  fontFaces,
  highlightBlockId = null,
  labels,
  locale,
  primeKey,
  blockComments,
  rangeComments,
  renderNonce = 0,
  site,
  theme,
  variant,
  viewportHeight,
  onLinkPress,
  onImagePress,
  onNestedDocExpand,
  onScrollToAnchor,
  webUrl,
}: RichBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prime = useSyncExternalStore(subscribePrime, readPrime)

  useEffect(() => {
    dropSupersededPrime(content, primeKey)
  }, [content, primeKey, variant, webUrl])

  const bodyContent = prime?.content ?? content
  const bodyEnrichments = useStableEnrichments(
    prime?.enrichments ?? enrichments,
  )
  const bodyVariant = prime?.variant ?? variant
  const bodyWebUrl = prime?.webUrl ?? webUrl

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
    document.body.style.visibility = ''

    // Looked up per call and guarded: adoption swaps the native message handler
    // out and back in, and a post landing in that window throws instead of
    // returning — without the guard one throw would abort the whole sequence.
    const post = (message: object) => {
      try {
        ;(
          window as unknown as {
            ReactNativeWebView?: { postMessage: (data: string) => void }
          }
        ).ReactNativeWebView?.postMessage(JSON.stringify(message))
      } catch {}
    }

    const postAnchors = () => {
      post({
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
      post({
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

    // An adopted webview re-rendering identical content never fires the
    // body ResizeObserver, so the fresh mount's matchContents height stays 0.
    // Re-report the size alongside the rendered signal — two frames later, so
    // the measurement reflects layout at the adopting container's frame
    // rather than the pooled instance's stale one.
    let reported = false
    const report = () => {
      if (reported) return
      reported = true
      post({
        type: '$$match_contents_event',
        data: {
          width: document.body.clientWidth,
          height: document.body.clientHeight,
        },
      })
      postAnchors()
      post({ type: 'yohaku:rendered', length: bodyContent.length })
    }

    // A webview waiting in the pool is detached from the view hierarchy, and
    // WebKit stops servicing rAF there — a click-time prime would render and
    // then never report. Reading `clientHeight` forces layout on demand, so the
    // timer path measures the same thing the frame path would.
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(report)
    })
    const detachedTimer = setTimeout(report, 60)

    // Images, mermaid/excalidraw canvases, and every fetchJSON-backed block
    // (poll/stock/afilmory/dynamic) settle after the rAF snapshot above and
    // shift everything below them — re-post whenever body layout changes.
    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(postAnchors, 200)
    })
    resizeObserver.observe(document.body)

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(detachedTimer)
      resizeObserver.disconnect()
      clearTimeout(resizeTimer)
    }
    // `seq` keeps a prime that repeats the content already on screen from being
    // a no-op: the pooled body is hidden, so it still needs the re-report to
    // become visible and to hand the adopting view its height.
  }, [bodyContent, prime?.seq, renderNonce])

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
  }, [bodyContent, highlightBlockId, renderNonce])

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
    }
  }, [blockInfos, bodyContent, stableBlockComments, stableRangeComments])

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
        locale,
        labels: { nestedDocCollapse, nestedDocExpand, nestedDocLabel },
        nestedDocPresentation: canExpandNestedDoc ? 'modal' : 'inline',
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
      handlers,
      locale,
      nestedDocCollapse,
      nestedDocExpand,
      nestedDocLabel,
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
        // list. Sans resolves to the OS font; 'Noto Serif SC' / 'Cascadia Code
        // PL' resolve to the @font-face rules injected below from the app's own
        // bundled ttf assets.
        '--app-font-sans': WEBVIEW_FONT_FAMILY.sans,
        '--app-font-mono': WEBVIEW_FONT_FAMILY.mono,
        '--rc-text': neutral[theme][9],
        '--rc-bg': 'transparent',
        '--surface-paper': neutral[theme][1],
        '--color-accent': accent[theme],
        ...Object.fromEntries(
          Object.entries(neutral[theme]).map(([step, value]) => [
            `--color-neutral-${step}`,
            value,
          ]),
        ),
        color: neutral[theme][9],
        ...(viewportHeight
          ? { '--app-viewport-height': `${viewportHeight}px` }
          : {}),
      }) as CSSProperties,
    [bodyVariant, theme, viewportHeight],
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

  // Content reaches this component twice per open — once through the prime,
  // once through expo's `$$props` — and the second arrival usually repeats the
  // first. Holding the rendered subtree in a memo lets React bail out on it
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
              theme={theme}
              value={editorState}
              variant={bodyVariant}
            />
          ) : (
            openInWeb
          )}
        </HostProvider>
      </BodyErrorBoundary>
    ),
    [bodyContent, bodyVariant, editorState, host, openInWeb, theme, vars],
  )

  return (
    <div
      className={theme === 'dark' ? 'rich-body-root dark' : 'rich-body-root'}
      ref={containerRef}
      style={vars}
    >
      <style>{`
        ${buildFontFaceCss(fontFaces)}
        html, body { width: 100%; overflow-x: hidden; background: transparent; margin: 0; }
        .font-mono, code, kbd, samp { font-family: var(--font-mono); }
        .rich-body-root { width: 100vw; overflow-x: hidden; box-sizing: border-box; background: transparent; }
        .rich-content { max-width: 100% !important; box-sizing: border-box; overflow-wrap: break-word; padding-inline: 20px; }
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
        ::highlight(comment-block) {
          background-color: color-mix(in srgb, var(--color-accent) 8%, transparent);
        }
        ::highlight(comment-highlight) {
          text-decoration: underline dashed;
          text-decoration-color: var(--color-accent);
          text-underline-offset: 2px;
        }
      `}</style>
      {body}
    </div>
  )
}
