import * as stylex from '@stylexjs/stylex'
import clsx from 'clsx'

type StylexArg = Parameters<typeof stylex.props>[0]

type SxInput =
  | StylexArg
  | string
  | false
  | null
  | undefined
  | Array<StylexArg | string | false | null | undefined>

const SEMANTIC_PREFIXES = [
  'i-mingcute-',
  'i-material-',
  'prose',
  'not-prose',
  'shiki-',
  'yohaku-',
  'comment-',
  'thread-',
  'image-placeholder',
  'gallery-',
  'float-popover',
  'markdown-editor',
  'sheet-',
  'nav-menu',
  'header--',
  'paper-',
  'rich-',
  'st-toc',
  'line-numbers',
  'code-wrap',
  'label',
  'underline-transparent',
  'paragraph',
  'is-active',
  'is-new',
  'print-block-fallback',
] as const

const TAILWIND_TOKENS = new Set([
  'flex',
  'inline-flex',
  'grid',
  'block',
  'inline',
  'hidden',
  'absolute',
  'relative',
  'sticky',
  'fixed',
  'center',
  'group',
  'peer',
  'container',
  'transform',
  'content-auto',
  'scrollbar-none',
  'animate-in',
  'fade-in',
])

function isSemanticClass(token: string) {
  return SEMANTIC_PREFIXES.some(
    (prefix) => token === prefix || token.startsWith(prefix),
  )
}

function assertSemanticClass(value: string) {
  if (process.env.NODE_ENV === 'production') return
  for (const token of value.split(/\s+/).filter(Boolean)) {
    if (isSemanticClass(token)) continue
    const bare = token.replace(/^[\w-]+:/, '')
    if (
      TAILWIND_TOKENS.has(token) ||
      TAILWIND_TOKENS.has(bare) ||
      token.includes(':') ||
      token.includes('[') ||
      token.includes(']')
    ) {
      throw new Error(
        `sx(): leftover Tailwind utility "${token}". Pass a StyleX style or a semantic CSS module class.`,
      )
    }
  }
}

function visit(arg: SxInput, styles: StylexArg[], extra: string[]) {
  if (!arg) return
  if (Array.isArray(arg)) {
    for (const item of arg) visit(item, styles, extra)
    return
  }
  if (typeof arg === 'string') {
    assertSemanticClass(arg)
    extra.push(arg)
    return
  }
  styles.push(arg)
}

export function sx(...args: SxInput[]) {
  const styles: StylexArg[] = []
  const extra: string[] = []
  for (const arg of args) visit(arg, styles, extra)
  const props = stylex.props(...styles)
  return extra.length
    ? { ...props, className: clsx(props.className, extra) }
    : props
}

export function sxClass(
  semantic: string | false | null | undefined,
  ...args: SxInput[]
) {
  return sx(...args, semantic || undefined)
}

export const clsxm = clsx
