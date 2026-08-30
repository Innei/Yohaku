import { describe, expect, it } from 'vitest'

import { articleIdsFromVisible } from '../lists/flatten-posts-list'
import {
  flattenTopicList,
  TOPIC_CHROME_ID,
  TOPIC_EMPTY_ID,
  TOPIC_FOOTER_ID,
  topicYearItemId,
} from './flatten-topic-list'

describe('flattenTopicList', () => {
  it('starts with chrome then year groups', () => {
    expect(
      flattenTopicList({
        loadingMore: false,
        showEmpty: false,
        groups: [{ year: 2026, notes: [{ id: 'n1' }, { id: 'n2' }] }],
      }).map((item) => [item.id, item.type]),
    ).toEqual([
      [TOPIC_CHROME_ID, 'chrome'],
      [topicYearItemId(2026), 'year'],
      ['n1', 'note'],
      ['n2', 'note'],
    ])
  })

  it('can show empty and a paging footer', () => {
    expect(
      flattenTopicList({
        groups: [],
        loadingMore: true,
        showEmpty: true,
      }).map((item) => item.type),
    ).toEqual(['chrome', 'empty', 'footer'])
    expect(TOPIC_EMPTY_ID).toBe('__empty')
    expect(TOPIC_FOOTER_ID).toBe('__footer')
  })
})

describe('topic visible ids', () => {
  it('keeps note rows', () => {
    expect(
      articleIdsFromVisible(
        [
          { id: TOPIC_CHROME_ID, type: 'chrome' },
          { id: 'n1', type: 'note' },
        ],
        ['note'],
      ),
    ).toEqual(['n1'])
  })
})
