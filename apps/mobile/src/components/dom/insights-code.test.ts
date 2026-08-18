import { describe, expect, it } from 'vitest'

import { fenceLang } from './insights-code'

describe('fenceLang', () => {
  it('reads mermaid from a fenced code className', () => {
    expect(fenceLang('lang-mermaid')).toBe('mermaid')
    expect(fenceLang('language-mermaid')).toBe('mermaid')
    expect(fenceLang('language-ts')).toBe('ts')
    expect(fenceLang(undefined)).toBeUndefined()
  })
})
