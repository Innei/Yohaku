export type MarkdownNodeType =
  | 'blockquote'
  | 'code'
  | 'codeBlock'
  | 'document'
  | 'emphasis'
  | 'heading'
  | 'highlight'
  | 'image'
  | 'latexMathDisplay'
  | 'latexMathInline'
  | 'lineBreak'
  | 'link'
  | 'listItem'
  | 'orderedList'
  | 'paragraph'
  | 'softBreak'
  | 'spoiler'
  | 'strikethrough'
  | 'strong'
  | 'subscript'
  | 'superscript'
  | 'table'
  | 'tableBody'
  | 'tableCell'
  | 'tableHead'
  | 'tableHeaderCell'
  | 'tableRow'
  | 'text'
  | 'thematicBreak'
  | 'underline'
  | 'unorderedList'

export interface MarkdownNode {
  attributes?: Record<string, string>
  children?: MarkdownNode[]
  content?: string
  type: MarkdownNodeType
}

export type MarkdownParser = (markdown: string) => MarkdownNode

export function plainText(node: MarkdownNode): string {
  if (node.type === 'softBreak' || node.type === 'lineBreak') return '\n'
  let out = node.content ?? ''
  for (const child of node.children ?? []) out += plainText(child)
  return out
}
