import type { SerializedEditorState } from 'lexical'
import { describe, expect, it } from 'vitest'

import { gridCells, isMediaGrid } from './grid'

const cell = (...children: unknown[]) =>
  ({ root: { type: 'root', children } }) as unknown as SerializedEditorState
const image = { type: 'image', src: 'a.jpg' }
const text = (value: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text: value }],
})

describe('isMediaGrid', () => {
  it('accepts cells holding only media, including images wrapped in paragraphs', () => {
    expect(
      isMediaGrid([
        cell(image),
        cell({ type: 'paragraph', children: [image] }, text('  ')),
        cell({ type: 'gallery' }, { type: 'video' }),
      ]),
    ).toBe(true)
  })

  it('rejects a grid where any cell has text', () => {
    expect(isMediaGrid([cell(image), cell(text('hello'))])).toBe(false)
  })

  it('rejects empty grids and empty cells', () => {
    expect(isMediaGrid([])).toBe(false)
    expect(isMediaGrid([cell(image), cell()])).toBe(false)
  })
})

describe('gridCells', () => {
  it('reads cells and falls back to legacy children as one cell each', () => {
    expect(gridCells({ cells: [cell(image)] })).toEqual([cell(image)])
    expect(gridCells({ children: [image, text('x')] })).toEqual([
      cell(image),
      cell(text('x')),
    ])
    expect(gridCells({})).toEqual([])
  })
})
