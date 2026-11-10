import { describe, expect, it } from 'vitest'

import { locales } from './config'
import { getMessages, translate } from './translate'

function paths(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null
      ? paths(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

const reference = paths(getMessages('zh'))

describe('message catalogs', () => {
  it.each(locales)('%s has exactly the reference keys', (locale) => {
    expect(paths(getMessages(locale)).sort()).toEqual([...reference].sort())
  })

  it.each(locales)('%s has no empty strings', (locale) => {
    const empty = Object.entries(getMessages(locale)).flatMap(
      ([namespace, entries]) =>
        Object.entries(entries)
          .filter(([, value]) => String(value).trim().length === 0)
          .map(([key]) => `${namespace}.${key}`),
    )
    expect(empty).toEqual([])
  })

  it.each(locales)(
    '%s keeps every {placeholder} of the reference',
    (locale) => {
      const placeholders = (messages: object) =>
        Object.fromEntries(
          Object.entries(messages).flatMap(([namespace, entries]) =>
            Object.entries(entries).map(([key, value]) => [
              `${namespace}.${key}`,
              // eslint-disable-next-line unicorn/better-regex -- see translate.ts
              [...String(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(),
            ]),
          ),
        )
      expect(placeholders(getMessages(locale))).toEqual(
        placeholders(getMessages('zh')),
      )
    },
  )
})

describe('translate', () => {
  it('interpolates named vars', () => {
    expect(translate('zh', 'comment', 'expandReplies', { count: 3 })).toBe(
      '展开 3 条回复',
    )
    expect(translate('en', 'comment', 'replyingTo', { name: 'innei' })).toBe(
      'Replying to @innei',
    )
  })

  it('leaves unknown placeholders in place rather than printing undefined', () => {
    expect(translate('zh', 'comment', 'replyingTo', { other: 'x' })).toBe(
      '回复 @{name}',
    )
  })
})
