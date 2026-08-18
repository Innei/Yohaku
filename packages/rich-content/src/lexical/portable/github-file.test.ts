import { describe, expect, it } from 'vitest'

import { parseGithubFileUrl } from './github-file'

describe('parseGithubFileUrl', () => {
  it('parses a blob URL into a jsDelivr fetch target and language', () => {
    expect(
      parseGithubFileUrl(
        'https://github.com/Innei/SKILL/blob/main/skills/automation/session-to-skill-and-blog/SKILL.md',
      ),
    ).toEqual({
      endLine: undefined,
      fetchUrl:
        'https://cdn.jsdelivr.net/gh/Innei/SKILL@main/skills/automation/session-to-skill-and-blog/SKILL.md',
      language: 'markdown',
      owner: 'Innei',
      path: 'skills/automation/session-to-skill-and-blog/SKILL.md',
      ref: 'main',
      repo: 'SKILL',
      startLine: 0,
    })
  })

  it('honors a single-line hash', () => {
    const parsed = parseGithubFileUrl(
      'https://github.com/Innei/x/blob/main/src/a.ts#L10',
    )
    expect(parsed?.language).toBe('typescript')
    expect(parsed?.startLine).toBe(9)
    expect(parsed?.endLine).toBe(10)
  })

  it('honors a line range hash', () => {
    const parsed = parseGithubFileUrl(
      'https://github.com/Innei/x/blob/main/src/a.ts#L10-L20',
    )
    expect(parsed?.startLine).toBe(9)
    expect(parsed?.endLine).toBe(20)
  })

  it('returns null for non-blob GitHub URLs', () => {
    expect(parseGithubFileUrl('https://github.com/Innei/SKILL')).toBeNull()
    expect(parseGithubFileUrl('https://example.com/foo.md')).toBeNull()
    expect(parseGithubFileUrl('not-a-url')).toBeNull()
  })
})
