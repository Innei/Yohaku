import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const catalogPath = path.resolve(
  import.meta.dirname,
  '../../assets/notifications/Localizable.xcstrings',
)

describe('notification localization catalog', () => {
  it('contains every APNs localization key in all five app locales', async () => {
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8')) as {
      strings: Record<
        string,
        { localizations: Record<string, { stringUnit: { value: string } }> }
      >
    }
    const keys = [
      'PUSH_CONTENT_TITLE',
      'PUSH_CONTENT_SUMMARY',
      'PUSH_REPLY_TITLE',
      'PUSH_REPLY_BODY',
      'PUSH_THINKING_WATCHED',
      'PUSH_THINKING_READ',
      'PUSH_THINKING_LISTENED',
      'PUSH_THINKING_STUDIED',
      'PUSH_THINKING_LINKED',
      'PUSH_THINKING_PLAIN',
      'PUSH_THINKING_FACT_CREATOR',
      'PUSH_THINKING_FACT_CREATOR_ONLY',
      'PUSH_THINKING_FACT_TV',
      'PUSH_THINKING_FACT_MOVIE',
      'PUSH_THINKING_FACT_BOOK',
      'PUSH_THINKING_FACT_ALBUM',
      'PUSH_THINKING_FACT_SONG',
    ]
    const removed = [
      'PUSH_CONTENT_POST_SUBTITLE',
      'PUSH_CONTENT_NOTE_SUBTITLE',
      'PUSH_CONTENT_RECENTLY_SUBTITLE',
    ]
    const locales = ['en', 'ja', 'ko', 'zh-Hans', 'zh-Hant']

    expect(Object.keys(catalog.strings).sort()).toEqual(keys.sort())
    for (const key of removed) {
      expect(catalog.strings[key]).toBeUndefined()
    }
    for (const key of keys) {
      for (const locale of locales) {
        expect(
          catalog.strings[key]?.localizations[locale]?.stringUnit.value,
        ).toBeTruthy()
      }
    }
  })
})
