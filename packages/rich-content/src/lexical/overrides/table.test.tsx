import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'

import { lexicalTableOverrides } from './table'

it('wraps the table in a scroller that sizes to content', () => {
  const html = renderToStaticMarkup(
    <>
      {lexicalTableOverrides.table(
        {},
        'k',
        <tr>
          <td>cell</td>
        </tr>,
      )}
    </>,
  )
  expect(html).toContain('rich-table-scroll')
  expect(html).toContain('overflow-x-auto')
  expect(html).toContain('w-max')
  expect(html).toContain('min-w-full')
})

it('keeps header and body cells on one line', () => {
  const th = renderToStaticMarkup(
    <>{lexicalTableOverrides.tablecell({ headerState: 1 }, 'h', '键')}</>,
  )
  const td = renderToStaticMarkup(
    <>{lexicalTableOverrides.tablecell({}, 'c', '值')}</>,
  )
  expect(th).toContain('whitespace-nowrap')
  expect(td).toContain('whitespace-nowrap')
})
