import { describe, expect, it } from 'vitest'

import { resolveCodeLanguage } from './code-language'

describe('resolveCodeLanguage', () => {
  it('返回品牌 icon 与颜色', () => {
    const info = resolveCodeLanguage('typescript')
    expect(info.label).toBe('TypeScript')
    expect(info.color).toBe('#3178C6')
    expect(info.Icon).not.toBeNull()
  })

  it('解析别名', () => {
    expect(resolveCodeLanguage('ts').label).toBe('TypeScript')
    expect(resolveCodeLanguage('objc').label).toBe('Objective-C')
    expect(resolveCodeLanguage('c++').label).toBe('C++')
    expect(resolveCodeLanguage('zsh').label).toBe('Shell')
  })

  it('有颜色无 icon 时只给颜色', () => {
    const info = resolveCodeLanguage('zsh')
    expect(info.Icon).toBeNull()
    expect(info.color).toBe('#4EAA25')
  })

  it('未知语言原样大写且无颜色', () => {
    const info = resolveCodeLanguage('brainfuck')
    expect(info.label).toBe('BRAINFUCK')
    expect(info.Icon).toBeNull()
    expect(info.color).toBeNull()
  })

  it('无语言时给空 label', () => {
    expect(resolveCodeLanguage(undefined).label).toBe('')
  })
})
