import { describe, expect, it } from 'vitest'

import { parseNotePreview } from './note-preview-model'

const BOLD = 1
const ITALIC = 2
const CODE = 16

function text(value: string, format = 0) {
  return {
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text: value,
    type: 'text',
    version: 1,
  }
}

function paragraph(...children: object[]) {
  return {
    children,
    direction: null,
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
  }
}

function state(...children: object[]) {
  return JSON.stringify({
    root: {
      children,
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  })
}

function previewBlocks(content: string) {
  return parseNotePreview(content).blocks
}

describe('parseNotePreview', () => {
  it('returns empty when the payload is not valid JSON', () => {
    expect(parseNotePreview('{"root":{"children":[]}} trailing')).toEqual({
      blocks: [],
      truncated: false,
    })
  })

  it('reads a paragraph with format flags and a link', () => {
    expect(
      previewBlocks(
        state(
          paragraph(
            text('Hello ', 0),
            text('world', BOLD | ITALIC),
            text(' '),
            {
              children: [text('site')],
              type: 'link',
              url: 'https://example.com',
              version: 1,
            },
          ),
        ),
      ),
    ).toEqual([
      {
        inlines: [
          { text: 'Hello ' },
          { bold: true, italic: true, text: 'world' },
          { text: ' ' },
          { href: 'https://example.com', text: 'site' },
        ],
        type: 'paragraph',
      },
    ])
  })

  it('keeps heading, quote, list, and image; skips unknown blocks', () => {
    expect(
      previewBlocks(
        state(
          { type: 'poll', version: 1, pollId: 'p1' },
          {
            children: [text('Title')],
            tag: 'h2',
            type: 'heading',
            version: 1,
          },
          { children: [text('Quoted')], type: 'quote', version: 1 },
          {
            children: [
              {
                children: [text('One')],
                type: 'listitem',
                value: 1,
                version: 1,
              },
              {
                children: [text('Two')],
                type: 'listitem',
                value: 2,
                version: 1,
              },
            ],
            listType: 'number',
            type: 'list',
            version: 1,
          },
          {
            altText: 'A photo',
            src: 'https://example.com/photo.jpg',
            type: 'image',
            version: 1,
          },
          { type: 'code', version: 1, children: [text('x = 1')] },
        ),
      ),
    ).toEqual([
      { inlines: [{ text: 'Title' }], level: 2, type: 'heading' },
      { inlines: [{ text: 'Quoted' }], type: 'quote' },
      {
        items: [[{ text: 'One' }], [{ text: 'Two' }]],
        ordered: true,
        type: 'list',
      },
      {
        alt: 'A photo',
        src: 'https://example.com/photo.jpg',
        type: 'image',
      },
    ])
  })

  it('keeps four long prose blocks and grows to eight when they are short', () => {
    const long = state(
      ...Array.from({ length: 6 }, (_, i) =>
        paragraph(text(`${'x'.repeat(80)}${i}`)),
      ),
    )
    const longPreview = parseNotePreview(long)
    expect(longPreview.truncated).toBe(true)
    expect(longPreview.blocks).toHaveLength(4)

    const short = state(
      ...Array.from({ length: 10 }, (_, i) => paragraph(text(`short ${i}`))),
    )
    const shortPreview = parseNotePreview(short)
    expect(shortPreview.truncated).toBe(true)
    expect(shortPreview.blocks).toHaveLength(8)
  })

  it('does not report truncation when every supported block is included', () => {
    const complete = state(
      ...Array.from({ length: 5 }, (_, i) => paragraph(text(`short ${i}`))),
    )

    const preview = parseNotePreview(complete)
    expect(preview.truncated).toBe(false)
    expect(preview.blocks).toHaveLength(5)
  })

  it('skips leading unknown blocks so the preview still fills with prose', () => {
    expect(
      previewBlocks(
        state(
          { type: 'poll', version: 1, pollId: 'p1' },
          { type: 'stock', version: 1 },
          paragraph(text('x'.repeat(80))),
          paragraph(text('y'.repeat(80))),
          paragraph(text('z'.repeat(80))),
          paragraph(text('w'.repeat(80))),
          paragraph(text('v'.repeat(80))),
        ),
      ).map((block) => block.type),
    ).toEqual(['paragraph', 'paragraph', 'paragraph', 'paragraph'])
  })

  it('reads inline code and a linebreak inside a paragraph', () => {
    expect(
      previewBlocks(
        state(
          paragraph(
            text('run '),
            text('ls', CODE),
            { type: 'linebreak' },
            text('now'),
          ),
        ),
      ),
    ).toEqual([
      {
        inlines: [
          { text: 'run ' },
          { code: true, text: 'ls' },
          { break: true },
          { text: 'now' },
        ],
        type: 'paragraph',
      },
    ])
  })
})
