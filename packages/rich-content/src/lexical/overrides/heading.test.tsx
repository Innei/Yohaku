import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'

import { type HostCapabilities, HostProvider } from '../../host'
import { lexicalHeadingOverride } from './heading'

const host: HostCapabilities = {
  apiBase: '',
  fetchJSON: async () => ({}) as never,
  labels: {
    nestedDocCollapse: 'Collapse',
    nestedDocExpand: 'Expand',
    nestedDocLabel: 'Nested document',
  },
  nestedDocPresentation: 'modal',
  openImage: () => {},
  openLink: () => {},
  scrollToAnchor: () => {},
  theme: 'light',
  webOrigin: 'https://example.com',
}

it('renders the tag with a slug id and an anchor', () => {
  const html = renderToStaticMarkup(
    <HostProvider host={host}>
      {lexicalHeadingOverride({ tag: 'h3' }, 'k', 'Hello World')}
    </HostProvider>,
  )
  expect(html).toContain('<h3')
  expect(html).toContain('id="hello-world"')
  expect(html).toContain('rich-heading-anchor')
  expect(html).toContain('href="#hello-world"')
})

it('omits the anchor when the heading has no text', () => {
  const html = renderToStaticMarkup(
    <HostProvider host={host}>
      {lexicalHeadingOverride({ tag: 'h2' }, 'k', '')}
    </HostProvider>,
  )
  expect(html).not.toContain('rich-heading-anchor')
})
