import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { fenceLang } from './insights-code'

const here = dirname(fileURLToPath(import.meta.url))

const INSIGHTS_SOURCES = [
  'insights-code.tsx',
  'insights-mermaid.tsx',
  'insights-body.tsx',
  'webview-host.ts',
] as const

describe('fenceLang', () => {
  it('reads mermaid from a fenced code className', () => {
    expect(fenceLang('lang-mermaid')).toBe('mermaid')
    expect(fenceLang('language-mermaid')).toBe('mermaid')
    expect(fenceLang('language-ts')).toBe('ts')
    expect(fenceLang(undefined)).toBeUndefined()
  })
})

describe('insights import graph', () => {
  it.each(INSIGHTS_SOURCES)(
    '%s does not import the haklex editor or portable mermaid',
    (file) => {
      const src = readFileSync(join(here, file), 'utf8')
      expect(src).not.toMatch(/@haklex\/rich-editor/)
      expect(src).not.toMatch(/portable\/mermaid/)
      expect(src).not.toMatch(/@haklex\/rich-compose\/style\/mermaid/)
      expect(src).not.toMatch(/from ['"]\.\/code-block['"]/)
      expect(src).not.toMatch(/shiki-highlighter/)
    },
  )
})
