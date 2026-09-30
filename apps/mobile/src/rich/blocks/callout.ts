export type CalloutTone = 'accent' | 'error' | 'info' | 'success' | 'warning'

export interface CalloutKind {
  glyph: string
  label: string
  tone: CalloutTone
}

const KINDS: Record<string, CalloutKind> = {
  note: { glyph: '注', label: '注', tone: 'info' },
  info: { glyph: '信', label: '信息', tone: 'info' },
  tip: { glyph: '示', label: '提示', tone: 'success' },
  success: { glyph: '成', label: '完成', tone: 'success' },
  important: { glyph: '要', label: '重要', tone: 'accent' },
  warning: { glyph: '意', label: '注意', tone: 'warning' },
  caution: { glyph: '警', label: '警告', tone: 'error' },
  error: { glyph: '错', label: '错误', tone: 'error' },
}

export function calloutKind(kind: string): CalloutKind {
  if (!kind) return KINDS.note!
  return (
    KINDS[kind] ?? {
      glyph: kind.slice(0, 1).toUpperCase(),
      label: kind.toUpperCase(),
      tone: 'info',
    }
  )
}
