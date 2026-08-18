import { describe, expect, it } from 'vitest'

import {
  codeLanguageAccent,
  formatCodeLanguageLabel,
} from './code-block-chrome'

describe('formatCodeLanguageLabel', () => {
  it('shortens common language aliases the way web does', () => {
    expect(formatCodeLanguageLabel('typescript')).toBe('TS')
    expect(formatCodeLanguageLabel('javascript')).toBe('JS')
    expect(formatCodeLanguageLabel('tsx')).toBe('TSX')
    expect(formatCodeLanguageLabel('shell')).toBe('SH')
    expect(formatCodeLanguageLabel('objective-c')).toBe('OBJC')
  })

  it('uppercases unknown languages and hides empty ones', () => {
    expect(formatCodeLanguageLabel('rust')).toBe('RUST')
    expect(formatCodeLanguageLabel(undefined)).toBe('')
    expect(formatCodeLanguageLabel('')).toBe('')
  })
})

describe('codeLanguageAccent', () => {
  it('returns the web language color when one exists', () => {
    expect(codeLanguageAccent('ts')).toBe('#3178C6')
    expect(codeLanguageAccent('typescript')).toBe('#3178C6')
    expect(codeLanguageAccent('swift')).toBe('#FA7343')
  })

  it('returns undefined when the language has no mapped color', () => {
    expect(codeLanguageAccent('rust')).toBeUndefined()
    expect(codeLanguageAccent(undefined)).toBeUndefined()
  })
})
