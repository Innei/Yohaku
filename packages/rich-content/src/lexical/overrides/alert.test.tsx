import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'

import { LexicalAlertOverride } from './alert'

it('renders the yohaku label for a known alert type', () => {
  const html = renderToStaticMarkup(<LexicalAlertOverride type="warning" />)
  expect(html).toContain('rich-alert-yohaku-label')
  expect(html).toContain('data-type="warning"')
  expect(html).toContain('Warning')
})

it('falls back to note for an unknown alert type', () => {
  const html = renderToStaticMarkup(
    <LexicalAlertOverride type={'bogus' as never} />,
  )
  expect(html).toContain('data-type="note"')
  expect(html).toContain('Note')
})
