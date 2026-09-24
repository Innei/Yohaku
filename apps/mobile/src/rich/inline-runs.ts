export interface InlineRun {
  bold?: boolean
  code?: boolean
  color?: string
  footnote?: string
  highlight?: boolean
  href?: string
  italic?: boolean
  math?: boolean
  spoiler?: boolean
  strike?: boolean
  sub?: boolean
  sup?: boolean
  text: string
  underline?: boolean
}

export type RichBlockRole =
  'heading' | 'hr' | 'listItem' | 'paragraph' | 'quote'

export interface RichTextBlock {
  attribution?: string
  checked?: boolean
  depth?: number
  id: string
  index?: number
  level?: number
  listType?: 'bullet' | 'check' | 'number'
  role: RichBlockRole
  runs: InlineRun[]
}

export interface RichTextHighlight {
  blockId: string
  end: number
  id: string
  kind: 'active' | 'block' | 'comment'
  start: number
}

export interface RichTextPosition {
  blockId: string
  offset: number
}

export interface RichTextMenuItem {
  icon?: string
  id: string
  label: string
}

export function runsToPlainText(runs: InlineRun[]): string {
  let out = ''
  for (const run of runs) out += run.text
  return out
}
