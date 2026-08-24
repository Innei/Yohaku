import { fileMetaText } from '@haklex/rich-editor/renderers'
import type { CSSProperties } from 'react'

interface MobileFileCardProps {
  display?: 'block' | 'inline'
  ext?: string
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

export function MobileFileCard({
  display,
  ext,
  name,
  size,
  src,
}: MobileFileCardProps) {
  // Every anchor in the body is intercepted by rich-body and handed to
  // WebBrowser.openBrowserAsync — SFSafariViewController is what provides the
  // download and "Save to Files" affordances the `download` attribute cannot.
  const href = src || undefined

  if (display === 'inline') {
    return (
      <a
        href={href}
        rel="noopener noreferrer"
        style={chipStyle}
        target="_blank"
      >
        <PaperclipIcon style={chipIconStyle} />
        {name}
      </a>
    )
  }

  const meta = fileMetaText(name, size, ext)
  return (
    <a href={href} rel="noopener noreferrer" style={rowStyle} target="_blank">
      <PaperclipIcon style={rowIconStyle} />
      <span style={nameStyle}>{name}</span>
      {meta ? <span style={metaStyle}>{meta}</span> : null}
    </a>
  )
}
