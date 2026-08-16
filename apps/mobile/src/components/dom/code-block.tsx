import { type CSSProperties, useEffect, useMemo, useState } from 'react'

import {
  codeLanguageAccent,
  formatCodeLanguageLabel,
} from './code-block-chrome'

function copyText(text: string): void {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
    return
  }
  // WKWebView pages loaded from file:// are not a secure context, so
  // navigator.clipboard is unavailable there.
  legacyCopy(text)
}

function legacyCopy(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

function useShikiHtml(code: string, language?: string): string | null {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    import('@yohaku/rich-content/src/lexical/portable/shiki-highlighter.ts')
      .then(async ({ highlightToHtml }) => {
        try {
          return await highlightToHtml(code, language)
        } catch {
          return await highlightToHtml(code)
        }
      })
      .then((out) => {
        if (!cancelled) setHtml(out)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [code, language])

  return html
}

export function MobileCodeBlock({
  code,
  language,
}: {
  code: string
  language?: string
}) {
  const html = useShikiHtml(code, language)
  const [copied, setCopied] = useState(false)
  const label = formatCodeLanguageLabel(language)
  const accent = codeLanguageAccent(language)
  const style = useMemo(
    () => (accent ? ({ '--code-accent': accent } as CSSProperties) : undefined),
    [accent],
  )

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <div className="m-code-block" style={style}>
      <div className="m-code-block__surface">
        <div aria-hidden className="m-code-block__topline" />
        <div
          className={
            label
              ? 'm-code-block__header'
              : 'm-code-block__header m-code-block__header--utility'
          }
        >
          {label ? <span className="m-code-block__lang">{label}</span> : null}
          <button
            aria-label="Copy code"
            className="m-code-block__copy"
            type="button"
            onClick={() => {
              copyText(code)
              setCopied(true)
            }}
          >
            <i
              className={
                copied ? 'i-mingcute-check-line' : 'i-mingcute-copy-2-line'
              }
            />
          </button>
        </div>
        <div aria-hidden className="m-code-block__divider" />
        {html ? (
          <div
            className="m-code-block__shiki"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="m-code-block__pre">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
