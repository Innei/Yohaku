import { describe, expect, it } from 'vitest'

import {
  foldSource,
  gistFiles,
  isMarkdownPath,
  parseGistUrl,
  sourcePathLine,
} from './source-card-model'

describe('parseGistUrl', () => {
  it('reads owner and id', () => {
    expect(parseGistUrl('https://gist.github.com/Innei/1a2b3c')).toEqual({
      id: '1a2b3c',
      owner: 'Innei',
    })
  })

  it('ignores file anchors and trailing slashes', () => {
    expect(parseGistUrl('https://gist.github.com/Innei/1a2b3c/#file-a-ts')?.id).toBe('1a2b3c')
  })

  it('accepts an id-only gist url', () => {
    expect(parseGistUrl('https://gist.github.com/1a2b3c')).toEqual({ id: '1a2b3c' })
  })

  it('rejects other hosts', () => {
    expect(parseGistUrl('https://github.com/Innei/repo')).toBeNull()
  })
})

describe('isMarkdownPath', () => {
  it('matches md and markdown files only', () => {
    expect(isMarkdownPath('skills/SKILL.md')).toBe(true)
    expect(isMarkdownPath('README.MARKDOWN')).toBe(true)
    expect(isMarkdownPath('page.mdx')).toBe(false)
    expect(isMarkdownPath('tap.ts')).toBe(false)
  })
})

describe('foldSource', () => {
  const text = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n')

  it('keeps the first 12 lines when collapsed', () => {
    const folded = foldSource(text, false)
    expect(folded.code.split('\n')).toHaveLength(12)
    expect(folded).toMatchObject({ collapsible: true, total: 20 })
  })

  it('returns everything when expanded', () => {
    expect(foldSource(text, true).code).toBe(text)
  })

  it('does not count a trailing newline as a line', () => {
    expect(foldSource('a\nb\n', false)).toEqual({ code: 'a\nb', collapsible: false, total: 2 })
  })
})

describe('gistFiles', () => {
  it('maps API files in order with languages from their names', () => {
    const files = gistFiles({
      files: {
        'sim-shot.sh': { content: 'set -e', filename: 'sim-shot.sh' },
        'README.md': { content: '# hi', filename: 'README.md' },
      },
    })
    expect(files).toEqual([
      { content: 'set -e', language: 'bash', name: 'sim-shot.sh' },
      { content: '# hi', language: 'markdown', name: 'README.md' },
    ])
  })

  it('skips files without inline content', () => {
    expect(gistFiles({ files: { 'big.bin': { filename: 'big.bin' } } })).toEqual([])
  })
})

describe('sourcePathLine', () => {
  it('keeps the ref in its chip for code files', () => {
    expect(sourcePathLine({ chip: 'main', markdown: false, subtitle: 'Innei/SKILL · skills' })).toBe('Innei/SKILL · skills')
  })

  it('moves the ref into the path line for markdown files', () => {
    expect(sourcePathLine({ chip: 'main', markdown: true, subtitle: 'Innei/SKILL · skills' })).toBe('Innei/SKILL · main · skills')
  })

  it('appends the ref when the path has no directory', () => {
    expect(sourcePathLine({ chip: 'main', markdown: true, subtitle: 'Innei/SKILL' })).toBe('Innei/SKILL · main')
  })
})
