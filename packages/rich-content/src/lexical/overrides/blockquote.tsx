'use client'
import { sx, sxClass } from '../../lib/sx'
import { atoms } from '../../styles/atoms.stylex'

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
      {...sxClass("rich-quote-yohaku", atoms.font_serif, atoms.my_4)}
      data-no-close-quote={hasCloseQuote ? '' : undefined}
      data-no-open-quote={hasOpenQuote ? '' : undefined}
      key={key}
    >
      {!hasOpenQuote && (
        <span
          aria-hidden
          {...sxClass("rich-quote-yohaku-glyph", atoms.block, atoms.opacity_40, atoms.text____color_accent)}
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
      <div {...sx(atoms.text_copy_15, atoms.italic, atoms.pl_7, atoms.text____color_neutral_9)}>
        {children}
      </div>
      {attribution && (
        <footer {...sx(atoms.text_label_12, atoms.mt_2, atoms.not_italic, atoms.text_right, atoms.text____color_neutral_7)}>
          — {attribution}
        </footer>
      )}
    </blockquote>
  )
}
