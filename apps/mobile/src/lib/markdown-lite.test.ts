import { describe, expect, it } from 'vitest'

import { parseCommentMarkdown } from './markdown-lite'

describe('parseCommentMarkdown', () => {
  it('parses plain text as a single paragraph', () => {
    expect(parseCommentMarkdown('你好世界')).toEqual([
      { type: 'paragraph', spans: [{ type: 'text', text: '你好世界' }] },
    ])
  })

  it('parses inline styles', () => {
    expect(
      parseCommentMarkdown('a **b** *c* _d_ `e` [f](https://x.io)'),
    ).toEqual([
      {
        type: 'paragraph',
        spans: [
          { type: 'text', text: 'a ' },
          { type: 'bold', text: 'b' },
          { type: 'text', text: ' ' },
          { type: 'italic', text: 'c' },
          { type: 'text', text: ' ' },
          { type: 'italic', text: 'd' },
          { type: 'text', text: ' ' },
          { type: 'code', text: 'e' },
          { type: 'text', text: ' ' },
          { type: 'link', text: 'f', href: 'https://x.io' },
        ],
      },
    ])
  })

  it('lifts images out as blocks', () => {
    expect(
      parseCommentMarkdown('看图\n![截图](https://x.io/a.png)\n结束'),
    ).toEqual([
      { type: 'paragraph', spans: [{ type: 'text', text: '看图' }] },
      { type: 'image', alt: '截图', src: 'https://x.io/a.png' },
      { type: 'paragraph', spans: [{ type: 'text', text: '结束' }] },
    ])
  })

  it('extracts an image embedded mid-line', () => {
    expect(parseCommentMarkdown('前 ![img](https://x.io/b.jpg) 后')).toEqual([
      { type: 'paragraph', spans: [{ type: 'text', text: '前 ' }] },
      { type: 'image', alt: 'img', src: 'https://x.io/b.jpg' },
      { type: 'paragraph', spans: [{ type: 'text', text: ' 后' }] },
    ])
  })

  it('joins consecutive lines with a newline and splits paragraphs on blanks', () => {
    expect(parseCommentMarkdown('一\n二\n\n三')).toEqual([
      {
        type: 'paragraph',
        spans: [
          { type: 'text', text: '一' },
          { type: 'text', text: '\n' },
          { type: 'text', text: '二' },
        ],
      },
      { type: 'paragraph', spans: [{ type: 'text', text: '三' }] },
    ])
  })

  it('degrades unclosed syntax to literal text', () => {
    expect(parseCommentMarkdown('**未闭合 和 `半个')).toEqual([
      {
        type: 'paragraph',
        spans: [{ type: 'text', text: '**未闭合 和 `半个' }],
      },
    ])
  })

  it('autolinks a bare http(s) URL', () => {
    expect(
      parseCommentMarkdown('看这个 https://example.com/foo_bar 结尾'),
    ).toEqual([
      {
        type: 'paragraph',
        spans: [
          { type: 'text', text: '看这个 ' },
          {
            type: 'link',
            text: 'https://example.com/foo_bar',
            href: 'https://example.com/foo_bar',
          },
          { type: 'text', text: ' 结尾' },
        ],
      },
    ])
  })
})
