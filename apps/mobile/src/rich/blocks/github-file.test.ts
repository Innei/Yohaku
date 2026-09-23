import { describe, expect, it } from 'vitest'

import { parseGithubFileUrl } from './github-file'

describe('parseGithubFileUrl', () => {
  it('parses a blob URL', () => {
    expect(
      parseGithubFileUrl(
        'https://github.com/Innei/SKILL/blob/main/skills/automation/session-to-skill-and-blog/SKILL.md',
      ),
    ).toEqual({
      language: 'markdown',
      owner: 'Innei',
      path: 'skills/automation/session-to-skill-and-blog/SKILL.md',
      ref: 'main',
      rawUrl:
        'https://cdn.jsdelivr.net/gh/Innei/SKILL@main/skills/automation/session-to-skill-and-blog/SKILL.md',
      repo: 'SKILL',
    })
  })

  it('parses a blob URL with a tag ref and no directory', () => {
    expect(
      parseGithubFileUrl(
        'https://github.com/facebook/react/blob/v18.2.0/README.md',
      ),
    ).toEqual({
      language: 'markdown',
      owner: 'facebook',
      path: 'README.md',
      ref: 'v18.2.0',
      rawUrl: 'https://cdn.jsdelivr.net/gh/facebook/react@v18.2.0/README.md',
      repo: 'react',
    })
  })

  it('returns null for non-blob GitHub URLs', () => {
    expect(parseGithubFileUrl('https://github.com/facebook/react')).toBeNull()
    expect(
      parseGithubFileUrl('https://github.com/facebook/react/tree/main'),
    ).toBeNull()
  })

  it('returns null for non-GitHub URLs', () => {
    expect(parseGithubFileUrl('https://example.com/foo/bar')).toBeNull()
    expect(parseGithubFileUrl('not a url')).toBeNull()
  })
})
