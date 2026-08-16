import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'

import { LexicalListItemOverride } from './list-item'

it('renders a checklist item when checked is a boolean', () => {
  const fallback = vi.fn(() => <li>fallback</li>)
  const html = renderToStaticMarkup(
    <>{LexicalListItemOverride({ checked: true }, 'k', ['body'], fallback)}</>,
  )
  expect(html).toContain('yohaku-checklist-item')
  expect(html).toContain('data-checked="true"')
  expect(fallback).not.toHaveBeenCalled()
})

it('delegates to the default renderer for a plain list item', () => {
  const fallback = vi.fn(() => <li>fallback</li>)
  renderToStaticMarkup(
    <>{LexicalListItemOverride({}, 'k', ['body'], fallback)}</>,
  )
  expect(fallback).toHaveBeenCalledOnce()
})
