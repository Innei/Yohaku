import MarkdownIt from 'markdown-it'

import type { MarkdownNode, MarkdownNodeType } from '@/rich/markdown/ast'

/**
 * Android replacement for the Swift Markdown parser (`MarkdownAST.swift`).
 *
 * The app expects `YohakuNative.parseMarkdown(source)` to return a JSON encoded
 * AST whose shape is documented in `src/rich/markdown/ast.ts`. markdown-it
 * produces a flat token stream, so this module folds it back into that tree
 * and applies the handful of extra inline spans the Apple parser supports
 * (`==highlight==`, `||spoiler||`, `^sup^`, `~sub~`, `++underline++`).
 */

const md = new MarkdownIt({
  breaks: false,
  html: false,
  linkify: true,
  typographer: false,
})

/**
 * md4c's LaTeX extension: `$$ ... $$` blocks and `$ ... $` spans. markdown-it
 * has no math rule, so both are added here and mapped to the same AST node
 * types the renderer already understands.
 */
function mathBlockRule(
  state: any,
  startLine: number,
  endLine: number,
  silent: boolean,
) {
  const start = state.bMarks[startLine] + state.tShift[startLine]
  const max = state.eMarks[startLine]
  const first = state.src.slice(start, max).trim()
  if (!first.startsWith('$$')) return false
  if (silent) return true

  let line = startLine
  let content = ''
  let closed = false
  if (first.length > 2 && first.endsWith('$$')) {
    content = first.slice(2, -2)
    line += 1
    closed = true
  } else {
    content = first.slice(2)
    line += 1
    while (line < endLine) {
      const lineStart = state.bMarks[line] + state.tShift[line]
      const lineEnd = state.eMarks[line]
      const text = state.src.slice(lineStart, lineEnd)
      if (text.trim().endsWith('$$')) {
        content += '\n' + text.replace(/\$\$\s*$/, '')
        line += 1
        closed = true
        break
      }
      content += '\n' + text
      line += 1
    }
  }
  if (!closed) return false

  state.line = line
  const token = state.push('math_block', 'math', 0)
  token.content = content.trim()
  token.markup = '$$'
  token.block = true
  return true
}

function mathInlineRule(state: any, silent: boolean) {
  const start = state.pos
  const src: string = state.src
  if (src[start] !== '$' || src[start + 1] === '$') return false
  let end = start + 1
  while (end < src.length) {
    if (src[end] === '$' && src[end - 1] !== '\\') break
    end += 1
  }
  if (end >= src.length || end === start + 1) return false
  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.content = src.slice(start + 1, end)
    token.markup = '$'
  }
  state.pos = end + 1
  return true
}

md.block.ruler.before('fence', 'math_block', mathBlockRule)
md.inline.ruler.before('escape', 'math_inline', mathInlineRule)

interface Token {
  attrs: [string, string][] | null
  block: boolean
  children: Token[] | null
  content: string
  info: string
  level: number
  markup: string
  nesting: number
  tag: string
  type: string
}

function attr(token: Token, name: string): string | undefined {
  return token.attrs?.find(([key]) => key === name)?.[1]
}

function splitExtensions(text: string): MarkdownNode[] {
  const out: MarkdownNode[] = []
  const pattern =
    /(\+\+[^+]+?\+\+)|(==[^=]+?==)|\|\|([^|]+?)\|\||(\^[^^]+?\^)|(~[^~]+?~)/g
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) {
      out.push({ content: text.slice(last, index), type: 'text' })
    }
    const raw = match[0]
    const start = raw.startsWith('++')
      ? 2
      : raw.startsWith('==')
        ? 2
        : raw.startsWith('||')
          ? 2
          : 1
    const inner = raw.slice(start, -start)
    const type: MarkdownNodeType = raw.startsWith('++')
      ? 'underline'
      : raw.startsWith('==')
        ? 'highlight'
        : raw.startsWith('||')
          ? 'spoiler'
          : raw.startsWith('^')
            ? 'superscript'
            : 'subscript'
    out.push({ children: [{ content: inner, type: 'text' }], type })
    last = index + raw.length
  }
  if (last < text.length) {
    out.push({ content: text.slice(last), type: 'text' })
  }
  return out.length > 0 ? out : [{ content: text, type: 'text' }]
}

function inlineNodes(tokens: Token[]): MarkdownNode[] {
  const root: MarkdownNode[] = []
  const stack: MarkdownNode[][] = [root]
  const push = (node: MarkdownNode) => stack.at(-1)!.push(node)
  const open = (type: MarkdownNodeType, attributes?: Record<string, string>) => {
    const node: MarkdownNode = { type, ...(attributes ? { attributes } : null) }
    push(node)
    node.children = []
    stack.push(node.children)
  }
  const close = () => {
    if (stack.length > 1) stack.pop()
  }

  for (const token of tokens) {
    switch (token.type) {
      case 'text': {
        // markdown-it folds consecutive text into one token; the extension
        // spans are applied here so they nest exactly like the Apple parser.
        for (const node of splitExtensions(token.content)) push(node)
        break
      }
      case 'code_inline': {
        push({ children: [{ content: token.content, type: 'text' }], type: 'code' })
        break
      }
      case 'softbreak': {
        push({ type: 'softBreak' })
        break
      }
      case 'math_inline': {
        push({ content: token.content, type: 'latexMathInline' })
        break
      }
      case 'hardbreak': {
        push({ type: 'lineBreak' })
        break
      }
      case 'strong_open': {
        open('strong')
        break
      }
      case 'em_open': {
        open('emphasis')
        break
      }
      case 's_open': {
        open('strikethrough')
        break
      }
      case 'link_open': {
        const href = attr(token, 'href') ?? ''
        const title = attr(token, 'title')
        open('link', { url: href, ...(title ? { title } : null) })
        break
      }
      case 'image': {
        push({
          attributes: {
            ...(attr(token, 'title') ? { title: attr(token, 'title')! } : null),
            url: attr(token, 'src') ?? '',
          },
          content: token.content,
          type: 'image',
        })
        break
      }
      case 'strong_close':
      case 'em_close':
      case 's_close':
      case 'link_close': {
        close()
        break
      }
      case 'html_inline': {
        if (token.content) push({ content: token.content, type: 'text' })
        break
      }
      default: {
        if (token.children) for (const node of inlineNodes(token.children)) push(node)
        else if (token.content) push({ content: token.content, type: 'text' })
      }
    }
  }
  return root
}

function blockNodes(tokens: Token[]): MarkdownNode[] {
  const root: MarkdownNode[] = []
  const stack: MarkdownNode[][] = [root]
  const push = (node: MarkdownNode) => stack.at(-1)!.push(node)

  const container = (type: MarkdownNodeType, attributes?: Record<string, string>) => {
    const node: MarkdownNode = { type, ...(attributes ? { attributes } : null) }
    push(node)
    node.children = []
    stack.push(node.children)
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!
    switch (token.type) {
      case 'heading_open': {
        const level = Number(token.tag.slice(1)) || 1
        container('heading', { level: String(level) })
        break
      }
      case 'heading_close':
      case 'paragraph_close':
      case 'blockquote_close':
      case 'bullet_list_close':
      case 'ordered_list_close':
      case 'list_item_close': {
        if (stack.length > 1) stack.pop()
        break
      }
      case 'paragraph_open': {
        container('paragraph')
        break
      }
      case 'blockquote_open': {
        container('blockquote')
        break
      }
      case 'bullet_list_open': {
        container('unorderedList')
        break
      }
      case 'ordered_list_open': {
        container('orderedList', {
          ...(attr(token, 'start') ? { start: attr(token, 'start')! } : null),
        })
        break
      }
      case 'list_item_open': {
        container('listItem')
        break
      }
      case 'inline': {
        // The inline payload belongs to the block container that was just
        // opened (heading/paragraph/table cell); push its spans directly.
        stack.at(-1)!.push(...inlineNodes(token.children ?? []))
        break
      }
      case 'fence':
      case 'code_block': {
        push({
          attributes: {
            ...(token.info.trim() ? { language: token.info.trim() } : null),
          },
          content: token.type === 'fence' ? token.content : token.content,
          type: 'codeBlock',
        })
        break
      }
      case 'hr': {
        push({ type: 'thematicBreak' })
        break
      }
      case 'math_block': {
        push({ content: token.content, type: 'latexMathDisplay' })
        break
      }
      case 'table_open': {
        container('table')
        break
      }
      case 'table_close': {
        if (stack.length > 1) stack.pop()
        break
      }
      case 'thead_open': {
        container('tableHead')
        break
      }
      case 'thead_close':
      case 'tbody_close': {
        if (stack.length > 1) stack.pop()
        break
      }
      case 'tbody_open': {
        container('tableBody')
        break
      }
      case 'tr_open': {
        container('tableRow')
        break
      }
      case 'tr_close': {
        if (stack.length > 1) stack.pop()
        break
      }
      case 'th_open': {
        container('tableHeaderCell')
        break
      }
      case 'td_open': {
        container('tableCell')
        break
      }
      case 'th_close':
      case 'td_close': {
        if (stack.length > 1) stack.pop()
        break
      }
      default: {
        if (token.content && token.type === 'text') {
          push({ content: token.content, type: 'text' })
        }
      }
    }
  }
  return root
}

/**
 * GitHub task lists: markdown-it has no checkbox extension, so the marker is
 * stripped from the first paragraph and recorded as item attributes, matching
 * what md4c's task extension emits.
 */
function applyTaskLists(nodes: MarkdownNode[]): MarkdownNode[] {
  for (const node of nodes) {
    if (node.type === 'listItem') {
      const firstParagraph = node.children?.find(
        (child) => child.type === 'paragraph',
      )
      const firstText = firstParagraph?.children?.[0]
      if (firstText?.type === 'text' && firstText.content) {
        const match = /^\[([ xX])\]\s+/.exec(firstText.content)
        if (match) {
          node.attributes = {
            ...node.attributes,
            isTask: 'true',
            taskChecked: match[1] === ' ' ? 'false' : 'true',
          }
          firstText.content = firstText.content.slice(match[0].length)
        }
      }
    }
    if (node.children) applyTaskLists(node.children)
  }
  return nodes
}

export function parseMarkdownToAstJson(source: string): string {
  const tokens = md.parse(source, {}) as unknown as Token[]
  const children = applyTaskLists(blockNodes(tokens))
  return JSON.stringify({ children, type: 'document' })
}

export function parseMarkdownToAst(source: string): MarkdownNode {
  const tokens = md.parse(source, {}) as unknown as Token[]
  return { children: applyTaskLists(blockNodes(tokens)), type: 'document' }
}
