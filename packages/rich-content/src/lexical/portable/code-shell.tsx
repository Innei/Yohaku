'use client'

import { type ReactNode, useEffect, useState } from 'react'

import { useHost } from '../../host'
import { shouldCollapseCode } from './code-collapse'
import { resolveCodeLanguage } from './code-language'
import { useExpandHeight } from './tween-height'

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

export function CodeLanguageMark({ language }: { language?: string }) {
  const { Icon, color } = resolveCodeLanguage(language)
  if (Icon)
    return (
      <Icon
        className="yohaku-code__icon"
        style={color ? { color } : undefined}
      />
    )
  return (
    <span
      aria-hidden
      className="yohaku-code__dot"
      style={color ? { color } : undefined}
    />
  )
}

function CopyButton({ code }: { code: string }) {
  const { labels } = useHost()
  const [copied, setCopied] = useState(false)
  const { codeCopied = 'Copied', codeCopy = 'Copy' } = labels ?? {}

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      className="yohaku-code__copy"
      type="button"
      onClick={() => {
        copyText(code)
        setCopied(true)
      }}
    >
      {copied ? codeCopied : codeCopy}
    </button>
  )
}

export function CodeShell({
  children,
  code,
  fold = true,
  footerName,
  header,
  language,
}: {
  children: ReactNode
  code: string
  fold?: boolean
  footerName?: string
  header?: ReactNode
  language?: string
}) {
  const { labels } = useHost()
  const { codeExpand = 'Expand · {count}' } = labels ?? {}
  const { label } = resolveCodeLanguage(language)
  const source = code ?? ''
  const long = fold && shouldCollapseCode(source)
  const [expandedFor, setExpandedFor] = useState<string | null>(null)
  const collapsed = long && expandedFor !== source
  const { capture, ref } = useExpandHeight(collapsed)
  const hasFooter = footerName !== undefined || collapsed
  const expandLabel = codeExpand.replace(
    '{count}',
    String(source.split('\n').length),
  )

  return (
    <div
      className={
        collapsed ? 'yohaku-code yohaku-code--collapsed' : 'yohaku-code'
      }
    >
      <div className="yohaku-code__body" ref={ref}>
        <div className="yohaku-code__head">
          {header ?? (
            <span className="yohaku-code__name">
              <CodeLanguageMark language={language} />
              {label}
            </span>
          )}
          {hasFooter ? null : <CopyButton code={source} />}
        </div>
        <div className="yohaku-code__scroll">{children}</div>
      </div>
      {hasFooter ? (
        <div className="yohaku-code__foot">
          {footerName === undefined ? null : (
            <span className="yohaku-code__foot-name">{footerName}</span>
          )}
          {collapsed ? (
            <button
              className="yohaku-code__expand"
              type="button"
              onClick={() => {
                capture()
                setExpandedFor(source)
              }}
            >
              {expandLabel}
            </button>
          ) : null}
          <CopyButton code={source} />
        </div>
      ) : null}
    </div>
  )
}
