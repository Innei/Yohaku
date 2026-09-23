import { describe, expect, it } from 'vitest'

import {
  formatTweetDate,
  parseTweet,
  tweetIdFromUrl,
  tweetToken,
} from './tweet'

const REAL_TWEET_RESPONSE = {
  __typename: 'Tweet',
  created_at: '2021-11-15T19:08:05.000Z',
  display_text_range: [0, 272],
  entities: {
    media: [
      {
        display_url: 'pic.x.com/YFfCDErHsg',
        expanded_url:
          'https://x.com/TwitterDev/status/1460323737035677698/video/1',
        indices: [271, 294],
        url: 'https://t.co/YFfCDErHsg',
      },
    ],
    urls: [
      {
        display_url: 'blog.twitter.com/developer/en_u…',
        expanded_url:
          'https://blog.twitter.com/developer/en_us/topics/tools/2021/build-whats-next-with-the-new-twitter-developer-platform',
        indices: [247, 270],
        url: 'https://t.co/Hrm15bkBWJ',
      },
    ],
  },
  id_str: '1460323737035677698',
  photos: [],
  text: 'Introducing a new era for the Twitter Developer Platform! \n\n📣The Twitter API v2 is now the primary API and full of new features\n⏱Immediate access for most use cases, or apply to get more access for free\n📖Removed certain restrictions in the Policy\nhttps://t.co/Hrm15bkBWJ https://t.co/YFfCDErHsg',
  user: {
    name: 'Developers',
    profile_image_url_https:
      'https://pbs.twimg.com/profile_images/1683501992314798080/xl1POYLw_normal.jpg',
    screen_name: 'XDevelopers',
  },
  video: {
    aspectRatio: [16, 9],
    poster:
      'https://pbs.twimg.com/ext_tw_video_thumb/1460322142680072196/pu/img/Eg0iP3S7EWdFLjxk.jpg',
  },
}

describe('tweetIdFromUrl', () => {
  it('reads the id from an x.com status url', () => {
    expect(
      tweetIdFromUrl('https://x.com/XDevelopers/status/1460323737035677698'),
    ).toBe('1460323737035677698')
  })

  it('reads the id from a twitter.com url with ?s=20', () => {
    expect(
      tweetIdFromUrl(
        'https://twitter.com/XDevelopers/status/1460323737035677698?s=20',
      ),
    ).toBe('1460323737035677698')
  })

  it('returns null when there is no digit-only path segment', () => {
    expect(tweetIdFromUrl('https://x.com/XDevelopers')).toBeNull()
  })

  it('returns null for an unparsable url', () => {
    expect(tweetIdFromUrl('not a url')).toBeNull()
  })
})

describe('tweetToken', () => {
  it('matches the react-tweet algorithm for a known id', () => {
    expect(tweetToken('2027424056291774541')).toBe('4wxc9bcg58c')
  })
})

describe('parseTweet', () => {
  it('returns null for a tombstone', () => {
    expect(parseTweet({ __typename: 'TweetTombstone' })).toBeNull()
  })

  it('returns null when required fields are missing', () => {
    expect(parseTweet({ __typename: 'Tweet' })).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(parseTweet(null)).toBeNull()
    expect(parseTweet(undefined)).toBeNull()
  })

  it('parses a real syndication response, trimming the trailing media link and picking up the video poster', () => {
    const tweet = parseTweet(REAL_TWEET_RESPONSE)
    expect(tweet).not.toBeNull()
    expect(tweet?.id).toBe('1460323737035677698')
    expect(tweet?.user).toEqual({
      avatar:
        'https://pbs.twimg.com/profile_images/1683501992314798080/xl1POYLw_normal.jpg',
      name: 'Developers',
      screenName: 'XDevelopers',
    })
    expect(tweet?.text.endsWith('https://t.co/YFfCDErHsg')).toBe(false)
    expect(tweet?.photo).toBeUndefined()
    expect(tweet?.videoPoster).toEqual({
      url: 'https://pbs.twimg.com/ext_tw_video_thumb/1460322142680072196/pu/img/Eg0iP3S7EWdFLjxk.jpg',
      width: 16,
      height: 9,
    })
    expect(tweet?.entities).toEqual([
      {
        type: 'link',
        start: 247,
        end: 270,
        href: 'https://blog.twitter.com/developer/en_us/topics/tools/2021/build-whats-next-with-the-new-twitter-developer-platform',
      },
    ])
  })

  it('parses mentions, hashtags and a photo', () => {
    const tweet = parseTweet({
      __typename: 'Tweet',
      created_at: '2024-01-01T00:00:00.000Z',
      display_text_range: [0, 20],
      entities: {
        hashtags: [{ indices: [10, 15], text: 'yoha' }],
        user_mentions: [
          { indices: [0, 6], screen_name: 'innei', name: 'Innei' },
        ],
      },
      id_str: '9999',
      photos: [{ url: 'https://example.com/a.jpg', width: 100, height: 50 }],
      text: '@innei loves #yoha stuff!!',
      user: {
        name: 'Innei',
        profile_image_url_https: 'https://example.com/avatar.jpg',
        screen_name: 'innei',
      },
    })
    expect(tweet?.photo).toEqual({
      url: 'https://example.com/a.jpg',
      width: 100,
      height: 50,
    })
    expect(tweet?.entities).toEqual([
      { type: 'mention', start: 0, end: 6, href: 'https://x.com/innei' },
      { type: 'hashtag', start: 10, end: 15, href: 'https://x.com/hashtag/yoha' },
    ])
  })
})

describe('formatTweetDate', () => {
  it('formats an ISO date as YYYY-MM-DD HH:mm in local time', () => {
    const date = new Date(2026, 5, 1, 21, 4)
    expect(formatTweetDate(date.toISOString())).toBe('2026-06-01 21:04')
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatTweetDate('not-a-date')).toBe('')
  })
})
