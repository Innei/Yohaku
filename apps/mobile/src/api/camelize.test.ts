import { describe, expect, it } from 'vitest'

import { camelize } from './camelize'

describe('camelize', () => {
  it('converts snake_case keys recursively', () => {
    expect(
      camelize({
        data: [
          {
            content_format: 'lexical',
            read_count: 1,
            category: { created_at: 'x' },
          },
        ],
        meta: { pagination: { total_pages: 3 } },
      }),
    ).toEqual({
      data: [
        {
          contentFormat: 'lexical',
          readCount: 1,
          category: { createdAt: 'x' },
        },
      ],
      meta: { pagination: { totalPages: 3 } },
    })
  })

  it('leaves primitives and arrays intact', () => {
    expect(camelize([1, 'a_b', null])).toEqual([1, 'a_b', null])
  })
})
