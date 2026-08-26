import { describe, expect, it } from 'vitest'

import { collectLexicalNodeTypes } from './collect-node-types'

describe('collectLexicalNodeTypes', () => {
  it('walks children and nested content.root', () => {
    expect(
      collectLexicalNodeTypes({
        root: {
          type: 'root',
          children: [
            { type: 'paragraph', children: [{ type: 'text' }] },
            {
              type: 'alert-quote',
              content: {
                root: { type: 'root', children: [{ type: 'quote' }] },
              },
            },
          ],
        },
      }),
    ).toEqual(new Set(['root', 'paragraph', 'text', 'alert-quote', 'quote']))
  })
})
