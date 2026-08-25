import { describe, expect, it } from 'vitest'

import { skillBody } from './skill-markdown'

describe('skillBody', () => {
  it('drops the frontmatter block and the leading title', () => {
    expect(
      skillBody('---\nname: a\ndescription: >\n  x\n---\n\n# A Skill\n\nBody.\n'),
    ).toBe('Body.')
  })

  it('leaves a body that has neither', () => {
    expect(skillBody('## Section\n\nBody.')).toBe('## Section\n\nBody.')
  })

  it('keeps the body when the frontmatter is never closed', () => {
    expect(skillBody('---\nname: a\nBody.')).toBe('---\nname: a\nBody.')
  })
})
