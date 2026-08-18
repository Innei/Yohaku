import { expect, it } from 'vitest'

import { sanitizeEditorState } from './sanitize'

const registered = new Set(['root', 'paragraph', 'text', 'poll', 'alert-quote'])

it('keeps registered node types untouched', () => {
  const state = {
    root: {
      children: [{ type: 'poll', version: 1, pollId: 'p1' }],
      type: 'root',
      version: 1,
    },
  } as never
  const out = sanitizeEditorState(state, registered)
  expect((out.root.children[0] as { type: string }).type).toBe('poll')
})

it('replaces an unregistered node with a placeholder paragraph', () => {
  const state = {
    root: {
      children: [{ type: 'brand-new-block', version: 1 }],
      type: 'root',
      version: 1,
    },
  } as never
  const out = sanitizeEditorState(state, registered)
  const node = out.root.children[0] as unknown as {
    children: { text: string }[]
    type: string
  }
  expect(node.type).toBe('paragraph')
  expect(node.children[0].text).toContain('请在网页中查看')
})

it('recurses into children', () => {
  const state = {
    root: {
      children: [
        {
          children: [{ type: 'unknown-x', version: 1 }],
          type: 'paragraph',
          version: 1,
        },
      ],
      type: 'root',
      version: 1,
    },
  } as never
  const out = sanitizeEditorState(state, registered)
  const child = (
    out.root.children[0] as unknown as { children: { type: string }[] }
  ).children[0]
  expect(child.type).toBe('paragraph')
})

it('recurses into nested editor states under content.root (alert/banner/nested-doc bodies)', () => {
  const state = {
    root: {
      children: [
        {
          alertType: 'warning',
          content: {
            root: {
              children: [{ type: 'unknown-y', version: 1 }],
              type: 'root',
              version: 1,
            },
          },
          type: 'alert-quote',
          version: 1,
        },
      ],
      type: 'root',
      version: 1,
    },
  } as never
  const out = sanitizeEditorState(state, registered)
  const alertNode = out.root.children[0] as unknown as {
    content: { root: { children: { type: string }[] } }
    type: string
  }
  expect(alertNode.type).toBe('alert-quote')
  expect(alertNode.content.root.children[0].type).toBe('paragraph')
})
