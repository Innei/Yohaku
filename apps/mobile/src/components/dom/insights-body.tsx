'use dom'

import './insights-body.css'
import '@haklex/rich-compose/style/mermaid.css'

import { accent, neutral } from '@yohaku/design-system/tokens'
import {
  HostProvider,
  imagePreviewSourceFromElement,
  type OpenImagePayload,
} from '@yohaku/rich-content/host'
import {
  baseFontVarStyle,
  createYohakuThemeStyle,
} from '@yohaku/rich-content/src/lexical/theme.ts'
import { compiler } from 'markdown-to-jsx'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { stripInsightsMarkup } from '@/lib/insights-markup'
import { WEBVIEW_FONT_FAMILY } from '@/theme/font-faces'

import { InsightsPre } from './insights-code'
import type { RichBodyFontFace } from './rich-body'
import {
  createWebviewHost,
  postNativeImagePreview,
  prewarmNativeImagePreview,
} from './webview-host'

export interface InsightsBodyLabels {
  missing: string
}

interface InsightsBodyProps {
  apiBase: string
  background: string
  dom?: import('expo/dom').DOMProps
  fontFaces?: RichBodyFontFace[]
  headerInset?: number
  labels: InsightsBodyLabels
  locale: string
  markdown: string
  onImagePress: (payload: OpenImagePayload) => Promise<void>
  onLinkPress: (url: string) => Promise<void>
  theme: 'dark' | 'light'
  variant: 'note' | 'post'
  webOrigin: string
}

function buildFontFaceCss(fontFaces: RichBodyFontFace[] | undefined): string {
  if (!fontFaces) return ''
  return fontFaces
    .map(
      ({ family, uri, weight }) =>
        `@font-face { font-family: '${family}'; font-weight: ${weight}; font-display: swap; src: url('${uri}') format('truetype'); }`,
    )
    .join('\n')
}

function InsightsRef({ quote, section }: { quote?: string; section?: string }) {
  const [open, setOpen] = useState(false)
  const canOpen = Boolean(quote)
  return (
    <>
      <button
        aria-label={section ?? quote ?? 'ref'}
        className="yohaku-ref-anchor"
        data-open={open ? 'true' : 'false'}
        type="button"
        onClick={() => {
          if (canOpen) setOpen((value) => !value)
        }}
      >
        ↖
      </button>
      {open && quote ? <cite className="yohaku-ref-quote">{quote}</cite> : null}
    </>
  )
}

function InsightsImage({
  alt,
  images,
  onImagePress,
  src,
}: {
  alt?: string
  images: string[]
  onImagePress: InsightsBodyProps['onImagePress']
  src?: string
}) {
  if (!src) return null
  const caption = alt?.replace(/^[!¡]/, '')
  return (
    <>
      <img
        alt={caption || ''}
        className="insights-image"
        src={src}
        onClick={(event) => {
          const payload: OpenImagePayload = {
            images,
            index: Math.max(0, images.indexOf(src)),
            source: imagePreviewSourceFromElement(event.currentTarget),
            src,
          }
          if (!postNativeImagePreview(payload)) void onImagePress(payload)
        }}
        onPointerDown={(event) => {
          prewarmNativeImagePreview(event.currentTarget)
        }}
      />
      {caption ? <p className="insights-image-caption">{caption}</p> : null}
    </>
  )
}

export default function InsightsBody({
  apiBase,
  background,
  fontFaces,
  headerInset = 56,
  labels,
  locale,
  markdown,
  theme,
  variant,
  webOrigin,
  onImagePress,
  onLinkPress,
}: InsightsBodyProps) {
  const images = useMemo(() => {
    /* eslint-disable unicorn/better-regex -- regexp/strict needs the \] escape; better-regex wants it gone */
    const found = [...markdown.matchAll(/!\[[^\]]*\]\(([^\s)]+)\)/g)]
    /* eslint-enable unicorn/better-regex */
    return found.map((match) => match[1])
  }, [markdown])

  const body = useMemo(() => {
    const clean = stripInsightsMarkup(markdown)
    if (!clean) return null
    return compiler(clean, {
      overrides: {
        a: {
          component: ({
            children,
            href,
          }: {
            children?: unknown
            href?: string
          }) => (
            <a
              href={href}
              onClick={(event) => {
                event.preventDefault()
                if (href) void onLinkPress(href)
              }}
            >
              {children as never}
            </a>
          ),
        },
        img: {
          component: (props: { alt?: string; src?: string }) => (
            <InsightsImage
              alt={props.alt}
              images={images}
              src={props.src}
              onImagePress={onImagePress}
            />
          ),
        },
        pre: { component: InsightsPre },
        ref: { component: InsightsRef },
      },
      wrapper: 'div',
    })
  }, [images, markdown, onImagePress, onLinkPress])

  const host = useMemo(
    () =>
      createWebviewHost({
        apiBase,
        labels: {
          nestedDocCollapse: '',
          nestedDocExpand: '',
          nestedDocLabel: '',
        },
        locale,
        theme,
        webOrigin,
        onImagePress,
        onLinkPress,
        onScrollToAnchor: async () => {},
      }),
    [apiBase, locale, onImagePress, onLinkPress, theme, webOrigin],
  )

  const vars = useMemo(
    () =>
      ({
        ...baseFontVarStyle,
        ...createYohakuThemeStyle(),
        '--app-font-sans': WEBVIEW_FONT_FAMILY.sans,
        '--app-font-serif': WEBVIEW_FONT_FAMILY.sans,
        '--app-font-mono': WEBVIEW_FONT_FAMILY.mono,
        '--font-serif':
          "system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', sans-serif",
        '--color-accent': accent[theme],
        '--rc-bg': background,
        '--rc-text': neutral[theme][9],
        '--surface-paper': neutral[theme][1],
        '--yohaku-accent-deep':
          theme === 'dark'
            ? 'color-mix(in oklch, var(--color-accent), white 22%)'
            : 'color-mix(in oklch, var(--color-accent), black 28%)',
        '--yohaku-note-ink': theme === 'dark' ? '#d8d2c4' : '#2d2a26',
        ...Object.fromEntries(
          Object.entries(neutral[theme]).map(([step, value]) => [
            `--color-neutral-${step}`,
            value,
          ]),
        ),
        '--insights-header-inset': `${headerInset}px`,
        background,
        color: neutral[theme][9],
      }) as CSSProperties,
    [background, headerInset, theme],
  )

  useEffect(() => {
    document.body.style.visibility = ''
    document.body.style.background = background
    try {
      ;(
        window as unknown as {
          ReactNativeWebView?: { postMessage: (data: string) => void }
        }
      ).ReactNativeWebView?.postMessage(
        JSON.stringify({ type: 'yohaku:insights-ready' }),
      )
    } catch {}
  }, [background, markdown])

  const markdownClass =
    variant === 'note' ? 'markdown--yohaku-note' : 'markdown--yohaku'

  return (
    <div className="insights-root" data-variant={variant} style={vars}>
      <style>{`
        ${buildFontFaceCss(fontFaces)}
        html, body {
          width: 100%;
          max-width: 100%;
          margin: 0;
          overflow-x: clip;
          background: ${background};
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', sans-serif;
        }
        code, kbd, samp { font-family: var(--font-mono); }
      `}</style>
      <HostProvider host={host}>
        {body ? (
          <div className={markdownClass}>{body}</div>
        ) : (
          <p className={markdownClass}>{labels.missing}</p>
        )}
      </HostProvider>
    </div>
  )
}
