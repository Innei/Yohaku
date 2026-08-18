import { describe, expect, it } from 'vitest'

import {
  formatTopicNoteDate,
  sortTopicsByCreated,
  topicById,
} from './topic-list'

describe('topicById', () => {
  const topic = {
    id: 't1',
    name: '北海道',
    slug: 'hokkaido',
    description: '',
    introduce: null,
    icon: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  }

  it('returns the matching topic and ignores a missing id', () => {
    expect(topicById([topic], 't1')).toEqual(topic)
    expect(topicById([topic], null)).toBeNull()
    expect(topicById([topic], 'missing')).toBeNull()
  })
})

describe('formatTopicNoteDate', () => {
  it('pads month and day', () => {
    expect(formatTopicNoteDate(new Date(2026, 2, 4))).toBe('03.04')
    expect(formatTopicNoteDate(new Date(2025, 11, 22))).toBe('12.22')
  })
})

describe('sortTopicsByCreated', () => {
  it('puts newer topics first without mutating the source', () => {
    const older = { createdAt: new Date('2024-01-01T00:00:00.000Z') }
    const newer = { createdAt: new Date('2026-03-14T00:00:00.000Z') }
    const source = [older, newer]
    expect(sortTopicsByCreated(source)).toEqual([newer, older])
    expect(source).toEqual([older, newer])
  })
})
