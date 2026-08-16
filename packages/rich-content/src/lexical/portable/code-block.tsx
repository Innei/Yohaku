'use client'

import { useEffect, useState } from 'react'

function copyText(text: string): void {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
    return
  }
  legacyCopy(text)
}

// WKWebView pages loaded from file:// are not a secure context, so
// navigator.clipboard is unavailable there — fall back to execCommand.
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
    setHtml(null)
    import('./shiki-highlighter')
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

export function PortableCodeBlock({
  code,
  language,
}: {
  code: string
  language?: string
}) {
  const html = useShikiHtml(code, language)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <div className="yohaku-code-block">
      <button
        aria-label="Copy code"
        className="yohaku-code-block__copy"
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
      {html ? (
        <div
          className="yohaku-code-block__shiki"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="rich-code-block">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
