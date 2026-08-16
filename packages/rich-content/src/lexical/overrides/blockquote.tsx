'use client'

import type { BuiltinNodeRenderer } from '@haklex/rich-compose'

const OPEN_QUOTE_RE = /^["'«‘“‹「『＂＇]/
const CLOSE_QUOTE_RE = /["'»’”›」』＂＇]$/

function extractText(node: any): string {
  if (!node || node.type === 'comment') return ''
  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.children))
    return node.children.map(extractText).join('')
  return ''
}

export const LexicalBlockquoteOverride: BuiltinNodeRenderer = (
  node,
  key,
  children,
) => {
  const attribution =
    typeof (node as any).attribution === 'string' &&
    (node as any).attribution.trim()
      ? ((node as any).attribution as string).trim()
      : null
  const text = extractText(node).trim()
  const hasOpenQuote = OPEN_QUOTE_RE.test(text)
  const hasCloseQuote = CLOSE_QUOTE_RE.test(text)

  return (
    <blockquote
      className="rich-quote-yohaku font-serif my-4"
      data-no-close-quote={hasCloseQuote ? '' : undefined}
      data-no-open-quote={hasOpenQuote ? '' : undefined}
      key={key}
    >
      {!hasOpenQuote && (
        <span
          aria-hidden
          className="rich-quote-yohaku-glyph block opacity-40 text-(--color-accent)"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '48px',
            lineHeight: 0.6,
            marginBottom: '6px',
          }}
        >
          &ldquo;
        </span>
      )}
      <div className="text-copy-15 italic pl-7 text-(--color-neutral-9)">
        {children}
      </div>
      {attribution && (
        <footer className="text-label-12 mt-2 not-italic text-right text-(--color-neutral-7)">
          — {attribution}
        </footer>
      )}
    </blockquote>
  )
}
