import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'

import { lexicalTableOverrides } from './table'

it('wraps the table in a scroller that sizes to content', () => {
  const html = renderToStaticMarkup(
    <>
      {lexicalTableOverrides.table(
        {},
        'k',
        [
          <tr key="row">
            <td>cell</td>
          </tr>,
        ],
        () => null,
      )}
    </>,
  )
  expect(html).toContain('rich-table-scroll')
  expect(html).toContain('rich-table-scroll-shell')
  expect(html).toContain('w-max')
  expect(html).toContain('min-w-full')
})

it('keeps header and body cells on one line', () => {
  const th = renderToStaticMarkup(
    <>
      {lexicalTableOverrides.tablecell(
        { headerState: 1 },
        'h',
        ['键'],
        () => null,
      )}
    </>,
  )
  const td = renderToStaticMarkup(
    <>{lexicalTableOverrides.tablecell({}, 'c', ['值'], () => null)}</>,
  )
  expect(th).toContain('whitespace-nowrap')
  expect(td).toContain('whitespace-nowrap')
})

it('vertically centers body cells against taller cells in the same row', () => {
  const html = renderToStaticMarkup(
    <>{lexicalTableOverrides.tablecell({}, 'c', ['值'], () => null)}</>,
  )

  expect(html).toContain('align-middle')
  expect(html).not.toContain('align-top')
})
