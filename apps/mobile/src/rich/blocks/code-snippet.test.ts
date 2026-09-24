import { describe, expect, it } from 'vitest'

import { snippetFiles } from './code-snippet'

describe('snippetFiles', () => {
  it('keeps well-formed files and names unnamed ones by position', () => {
    expect(
      snippetFiles({
        files: [
          { code: 'a', filename: 'a.ts', language: 'ts' },
          { code: 'b' },
          'junk',
          { filename: 'no-code.ts' },
        ],
      }),
    ).toEqual([
      { code: 'a', filename: 'a.ts', language: 'ts' },
      { code: 'b', filename: 'file 2', language: '' },
    ])
  })

  it('returns an empty list without files', () => {
    expect(snippetFiles({})).toEqual([])
  })
})
