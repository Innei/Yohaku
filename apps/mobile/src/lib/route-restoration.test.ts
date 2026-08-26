import { describe, expect, it } from 'vitest'

import { restorableRoute, restorableRouteURL } from './route-restoration'

describe('restorableRoute', () => {
  it.each([
    ['/', ['(tabs)', '(posts)'], '/(tabs)/(posts)'],
    ['/', ['(tabs)', '(study)'], '/(tabs)/(study)'],
    ['/notes', ['(tabs)', '(notes)', 'notes'], '/notes'],
    ['/thinking', ['(tabs)', '(thinking)', 'thinking'], '/thinking'],
    ['/reader', ['(tabs)', '(study)', 'reader'], '/reader'],
    [
      '/posts/life/hello',
      ['posts', '[category]', '[slug]'],
      '/posts/life/hello',
    ],
    ['/notes/42', ['notes', '[nid]'], '/notes/42'],
    [
      '/notes/2026/8/26/hello',
      ['notes', '[year]', '[month]', '[day]', '[slug]'],
      '/notes/2026/8/26/hello',
    ],
    ['/pages/about', ['pages', '[slug]'], '/pages/about'],
    ['/pages', ['pages'], '/pages'],
    ['/categories/life', ['categories', '[slug]'], '/categories/life'],
    ['/posts/tag/ios', ['posts', 'tag', '[name]'], '/posts/tag/ios'],
    ['/series', ['series'], '/series'],
    ['/series/ios', ['series', '[slug]'], '/series/ios'],
    ['/skills/swift', ['skills', '[name]'], '/skills/swift'],
    ['/liked', ['liked'], '/liked'],
    ['/reading', ['reading'], '/reading'],
    ['/my-comments', ['my-comments'], '/my-comments'],
  ] as const)('keeps stable route %s', (pathname, segments, expected) => {
    expect(restorableRoute(pathname, [...segments])).toBe(expected)
  })

  it.each([
    '/comments/123',
    '/toc',
    '/login',
    '/locale',
    '/desk',
    '/summary/post/123',
    '/insights/post/123',
    '/search',
    '/dev',
    '/dev-demos',
  ])('leaves the prior route active while %s is presented', (pathname) => {
    expect(restorableRoute(pathname, pathname.slice(1).split('/'))).toBeNull()
  })

  it.each([
    '',
    'posts/life/hello',
    '//posts/life/hello',
    '/posts/life/../hello',
    '/posts/life/hello?preview=1',
    '/unknown',
  ])('rejects malformed or unsupported route %s', (pathname) => {
    expect(restorableRoute(pathname, [])).toBeNull()
  })
})

describe('restorableRouteURL', () => {
  const createURL = (route: string) => `yohaku://${route}`

  it('creates a launch URL for a stable route', () => {
    expect(
      restorableRouteURL(
        '/posts/life/hello',
        ['posts', '[category]', '[slug]'],
        createURL,
      ),
    ).toBe('yohaku:///posts/life/hello')
  })

  it('keeps the qualified tab route when two tabs share the root path', () => {
    expect(restorableRouteURL('/', ['(tabs)', '(study)'], createURL)).toBe(
      'yohaku:///(tabs)/(study)',
    )
  })

  it('does not replace the prior launch URL for a transient sheet', () => {
    expect(restorableRouteURL('/toc', ['toc'], createURL)).toBeNull()
  })
})
