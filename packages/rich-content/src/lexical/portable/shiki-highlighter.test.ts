import { describe, expect, it } from 'vitest'

import {
  highlightToHtml,
  LANGUAGE_IDS,
  resolveLanguage,
  THEMES,
} from './shiki-highlighter'

describe('resolveLanguage', () => {
  it.each([
    ['ts', 'typescript'],
    ['js', 'javascript'],
    ['py', 'python'],
    ['rb', 'ruby'],
    ['rs', 'rust'],
    ['kt', 'kotlin'],
    ['sh', 'shellscript'],
    ['bash', 'shellscript'],
    ['zsh', 'shellscript'],
    ['yml', 'yaml'],
    ['md', 'markdown'],
    ['c++', 'cpp'],
    ['c#', 'csharp'],
    ['objc', 'objective-c'],
    ['dockerfile', 'docker'],
  ])('maps the %s fence tag to %s', (tag, expected) => {
    expect(resolveLanguage(tag)).toBe(expected)
  })

  it('is case-insensitive', () => {
    expect(resolveLanguage('TS')).toBe('typescript')
    expect(resolveLanguage('Bash')).toBe('shellscript')
  })

  it('returns null for unsupported and empty tags', () => {
    expect(resolveLanguage('brainfuck')).toBeNull()
    expect(resolveLanguage(undefined)).toBeNull()
    expect(resolveLanguage('')).toBeNull()
  })
})

describe('language catalog', () => {
  it('pins the two themes the renderer styles for', () => {
    expect(THEMES).toEqual({ dark: 'github-dark', light: 'github-light' })
  })

  // A typo in any loader path surfaces only once someone posts that
  // language, so resolve every one of them here instead.
  it('has a working loader for every catalogued language', async () => {
    const failures = await Promise.all(
      LANGUAGE_IDS.map(async (id) => {
        try {
          await highlightToHtml('x', id)
          return null
        } catch (error) {
          return `${id}: ${String(error)}`
        }
      }),
    )
    expect(failures.filter(Boolean)).toEqual([])
    expect(LANGUAGE_IDS).toHaveLength(48)
  }, 60_000)
})
