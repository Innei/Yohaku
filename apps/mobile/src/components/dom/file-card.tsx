import { fileMetaText } from '@haklex/rich-editor/renderers'
import { useHost } from '@yohaku/rich-content/host'
import { InlineMarkdown } from '@yohaku/rich-content/src/lexical/portable/inline-markdown.tsx'
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  useState,
} from 'react'

import { filePreviewKind } from './file-preview'
import { postNativeFilePreview } from './webview-host'

const PREVIEW_BYTE_LIMIT = 512 * 1024

export interface MobileFileCardLabels {
  fileDownloadFull: string
  filePreviewDownload: string
  filePreviewTruncated: string
  filePreviewUnavailable: string
}

interface MobileFileCardProps {
  display?: 'block' | 'inline'
  ext?: string
  labels?: MobileFileCardLabels
  mimeType?: string
  name: string
  size?: number
  src: string
}

function PaperclipIcon({ style }: { style: CSSProperties }) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      style={style}
      viewBox="0 0 24 24"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l8.57-8.57A4 4 0 1118 8.84l-8.59 8.57a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

const chipStyle: CSSProperties = {
  borderBottom: '1px dashed var(--color-accent)',
  color: 'var(--color-neutral-9)',
  fontWeight: 500,
  paddingBottom: 1,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

const chipIconStyle: CSSProperties = {
  color: 'var(--color-neutral-6)',
  display: 'inline',
  height: 12,
  marginRight: 2,
  transform: 'translateY(1px)',
  width: 12,
}

const rowStyle: CSSProperties = {
  alignItems: 'center',
  borderBottom: '1px solid var(--color-neutral-4)',
  borderTop: '1px solid var(--color-neutral-4)',
  color: 'var(--color-neutral-9)',
  display: 'flex',
  gap: 12,
  margin: '1rem 0',
  padding: '14px 4px',
  textDecoration: 'none',
}

const rowIconStyle: CSSProperties = {
  color: 'var(--color-neutral-6)',
  flex: 'none',
  height: 15,
  width: 15,
}

const nameStyle: CSSProperties = {
  flex: 1,
  fontSize: 15,
  fontWeight: 500,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const metaStyle: CSSProperties = {
  color: 'var(--color-neutral-6)',
  flex: 'none',
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
}

const chevronStyle: CSSProperties = {
  color: 'var(--color-neutral-6)',
  flex: 'none',
  height: 14,
  width: 14,
}

const previewFrameStyle: CSSProperties = {
  borderBottom: '1px solid var(--color-neutral-4)',
  marginTop: -16,
  paddingBottom: 14,
}

const previewBodyStyle: CSSProperties = {
  borderLeft: '2px solid color-mix(in srgb, var(--color-accent) 45%, transparent)',
  fontSize: 14,
  margin: '10px 0 8px 7px',
  maxHeight: 192,
  overflow: 'auto',
  paddingLeft: 18,
}

const previewMetaStyle: CSSProperties = {
  color: 'var(--color-neutral-6)',
  fontSize: 12,
  marginLeft: 27,
}

const previewLinkStyle: CSSProperties = {
  color: 'var(--color-accent)',
  fontWeight: 500,
  textDecoration: 'none',
}

const previewErrorStyle: CSSProperties = {
  alignItems: 'center',
  background: 'var(--color-neutral-2)',
  borderRadius: 4,
  color: 'var(--color-neutral-6)',
  display: 'flex',
  fontSize: 13,
  height: 192,
  justifyContent: 'center',
  margin: '10px 0',
}

const previewPulseStyle: CSSProperties = {
  background: 'var(--color-neutral-2)',
  borderRadius: 4,
  height: 192,
  margin: '10px 0',
}

const previewPreStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12.5,
  lineHeight: 1.7,
  margin: 0,
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
}

type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; text: string; truncated: boolean }

function isUnmodifiedPrimaryClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}

export function MobileFileCard({
  display,
  ext,
  labels,
  mimeType,
  name,
  size,
  src,
}: MobileFileCardProps) {
  const host = useHost()
  const kind = filePreviewKind({ ext, mimeType, name })
  const href = src || undefined
  const meta = fileMetaText(name, size, ext)
  const expandable = kind === 'markdown' || kind === 'text'
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle' })

  const openNative = (event: MouseEvent) => {
    if (!isUnmodifiedPrimaryClick(event)) return
    event.preventDefault()
    event.stopPropagation()
    if (kind === 'image') {
      void host.openImage({ images: [src], index: 0, src })
      return
    }
    if (kind === 'quicklook') {
      if (
        !postNativeFilePreview({
          mimeType,
          name,
          siteReferer: host.webOrigin,
          url: src,
        })
      ) {
        void host.openLink(src)
      }
    }
  }

  const loadPreview = async () => {
    setPreview({ status: 'loading' })
    try {
      const res = await fetch(src, {
        headers: { Range: `bytes=0-${PREVIEW_BYTE_LIMIT - 1}` },
      })
      if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`)
      const raw = await res.text()
      const truncated =
        raw.length > PREVIEW_BYTE_LIMIT ||
        res.status === 206 ||
        (size !== undefined && size > PREVIEW_BYTE_LIMIT)
      setPreview({
        status: 'ready',
        text: raw.slice(0, PREVIEW_BYTE_LIMIT),
        truncated,
      })
    } catch {
      setPreview({ status: 'error' })
    }
  }

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && preview.status === 'idle') void loadPreview()
  }

  if (display === 'inline') {
    return (
      <a
        href={href}
        rel="noopener noreferrer"
        style={chipStyle}
        target="_blank"
        onClick={kind === 'image' || kind === 'quicklook' ? openNative : undefined}
      >
        <PaperclipIcon style={chipIconStyle} />
        {name}
      </a>
    )
  }

  if (kind === 'image' || kind === 'quicklook') {
    return (
      <a
        href={href}
        rel="noopener noreferrer"
        style={{ ...rowStyle, cursor: 'pointer' }}
        target="_blank"
        onClick={openNative}
      >
        <PaperclipIcon style={rowIconStyle} />
        <span style={nameStyle}>{name}</span>
        {meta ? <span style={metaStyle}>{meta}</span> : null}
      </a>
    )
  }

  if (!expandable) {
    return (
      <a href={href} rel="noopener noreferrer" style={rowStyle} target="_blank">
        <PaperclipIcon style={rowIconStyle} />
        <span style={nameStyle}>{name}</span>
        {meta ? <span style={metaStyle}>{meta}</span> : null}
      </a>
    )
  }

  return (
    <div style={{ margin: '1rem 0' }}>
      <div
        role="button"
        style={{
          ...rowStyle,
          cursor: 'pointer',
          margin: 0,
          userSelect: 'none',
          ...(open ? { borderBottomColor: 'transparent' } : {}),
        }}
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggle()
          }
        }}
      >
        <PaperclipIcon style={rowIconStyle} />
        <span style={nameStyle}>{name}</span>
        {meta ? <span style={metaStyle}>{meta}</span> : null}
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          style={{
            ...chevronStyle,
            transform: open ? 'rotate(180deg)' : undefined,
          }}
          viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open ? (
        <div style={previewFrameStyle}>
          {preview.status === 'loading' ? (
            <div aria-hidden style={previewPulseStyle} />
          ) : null}
          {preview.status === 'error' ? (
            <div style={previewErrorStyle}>
              {labels?.filePreviewUnavailable ?? 'Preview unavailable'}
              {href ? (
                <>
                  {' · '}
                  <a href={href} rel="noopener noreferrer" style={previewLinkStyle}>
                    {labels?.filePreviewDownload ?? 'Download to view'}
                  </a>
                </>
              ) : null}
            </div>
          ) : null}
          {preview.status === 'ready' ? (
            <>
              <div style={previewBodyStyle}>
                {kind === 'markdown' ? (
                  <InlineMarkdown>{preview.text}</InlineMarkdown>
                ) : (
                  <pre style={previewPreStyle}>{preview.text}</pre>
                )}
              </div>
              <div style={previewMetaStyle}>
                {preview.truncated
                  ? `${labels?.filePreviewTruncated ?? 'Previewing the first 512 KB'} · `
                  : ''}
                {href ? (
                  <a href={href} rel="noopener noreferrer" style={previewLinkStyle}>
                    {labels?.fileDownloadFull ?? 'Download the full file'}
                  </a>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
