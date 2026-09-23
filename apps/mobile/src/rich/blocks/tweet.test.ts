import { describe, expect, it } from 'vitest'

import {
  formatTweetCount,
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

  it('parses a real syndication response, trimming the trailing media link', () => {
    const tweet = parseTweet(REAL_TWEET_RESPONSE)
    expect(tweet).not.toBeNull()
    expect(tweet?.id).toBe('1460323737035677698')
    expect(tweet?.user).toEqual({
      avatar:
        'https://pbs.twimg.com/profile_images/1683501992314798080/xl1POYLw_normal.jpg',
      name: 'Developers',
      screenName: 'XDevelopers',
      verified: false,
    })
    expect(tweet?.text.endsWith('https://t.co/YFfCDErHsg')).toBe(false)
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
    expect(tweet?.media).toEqual([
      {
        kind: 'photo',
        url: 'https://example.com/a.jpg',
        width: 100,
        height: 50,
      },
    ])
    expect(tweet?.entities).toEqual([
      { type: 'mention', start: 0, end: 6, href: 'https://x.com/innei' },
      {
        type: 'hashtag',
        start: 10,
        end: 15,
        href: 'https://x.com/hashtag/yoha',
      },
    ])
  })
})

describe('formatTweetDate', () => {
  const now = new Date(2026, 8, 23, 12, 0)

  it('formats a date in the current year as M月D日 HH:mm', () => {
    const date = new Date(2026, 5, 1, 21, 4)
    expect(formatTweetDate(date.toISOString(), now)).toBe('6月1日 21:04')
  })

  it('prefixes the year for a date in another year', () => {
    const date = new Date(2021, 10, 15, 9, 8)
    expect(formatTweetDate(date.toISOString(), now)).toBe(
      '2021年11月15日 09:08',
    )
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatTweetDate('not-a-date')).toBe('')
  })
})

const USER = {
  is_blue_verified: true,
  name: '拾一.max-fast',
  profile_image_url_https: 'https://pbs.twimg.com/a_normal.jpg',
  screen_name: '__oQuery',
}

const photoDetail = (url: string, width: number, height: number) => ({
  media_url_https: url,
  original_info: { height, width },
  type: 'photo',
})

describe('parseTweet media, quote, reply and counts', () => {
  it('reads every photo from mediaDetails in order', () => {
    const tweet = parseTweet({
      __typename: 'Tweet',
      conversation_count: 5,
      created_at: '2026-06-03T08:06:54.000Z',
      display_text_range: [0, 8],
      favorite_count: 23,
      id_str: '2062083589483999405',
      mediaDetails: [
        photoDetail('https://pbs.twimg.com/media/a.jpg', 2048, 1536),
        photoDetail('https://pbs.twimg.com/media/b.jpg', 2048, 1536),
        photoDetail('https://pbs.twimg.com/media/c.jpg', 2048, 1152),
      ],
      text: '三丽鸥 cafe https://t.co/qiIiZa1yXg',
      user: USER,
    })
    expect(tweet?.text).toBe('三丽鸥 cafe')
    expect(tweet?.media.map((m) => [m.kind, m.url, m.width, m.height])).toEqual(
      [
        ['photo', 'https://pbs.twimg.com/media/a.jpg', 2048, 1536],
        ['photo', 'https://pbs.twimg.com/media/b.jpg', 2048, 1536],
        ['photo', 'https://pbs.twimg.com/media/c.jpg', 2048, 1152],
      ],
    )
    expect(tweet?.likes).toBe(23)
    expect(tweet?.replies).toBe(5)
    expect(tweet?.user.verified).toBe(true)
  })

  it('picks the second-best mp4 variant for a video and keeps the poster', () => {
    const tweet = parseTweet({
      __typename: 'Tweet',
      created_at: '2026-06-03T08:06:54.000Z',
      id_str: '1',
      mediaDetails: [
        {
          media_url_https: 'https://pbs.twimg.com/poster.jpg',
          original_info: { height: 720, width: 1280 },
          type: 'video',
          video_info: {
            aspect_ratio: [16, 9],
            variants: [
              {
                content_type: 'application/x-mpegURL',
                url: 'https://v/p.m3u8',
              },
              {
                bitrate: 256000,
                content_type: 'video/mp4',
                url: 'https://v/low.mp4',
              },
              {
                bitrate: 2176000,
                content_type: 'video/mp4',
                url: 'https://v/high.mp4',
              },
              {
                bitrate: 832000,
                content_type: 'video/mp4',
                url: 'https://v/mid.mp4',
              },
            ],
          },
        },
      ],
      text: 'clip',
      user: USER,
    })
    expect(tweet?.media).toEqual([
      {
        height: 720,
        kind: 'video',
        url: 'https://pbs.twimg.com/poster.jpg',
        videoUrl: 'https://v/mid.mp4',
        width: 1280,
      },
    ])
  })

  it('marks an animated gif and uses its only mp4 variant', () => {
    const tweet = parseTweet({
      __typename: 'Tweet',
      created_at: '2026-06-03T08:06:54.000Z',
      id_str: '1',
      mediaDetails: [
        {
          media_url_https: 'https://pbs.twimg.com/gif.jpg',
          original_info: { height: 200, width: 200 },
          type: 'animated_gif',
          video_info: {
            aspect_ratio: [1, 1],
            variants: [
              {
                bitrate: 0,
                content_type: 'video/mp4',
                url: 'https://v/gif.mp4',
              },
            ],
          },
        },
      ],
      text: 'gif',
      user: USER,
    })
    expect(tweet?.media[0]?.kind).toBe('gif')
    expect(tweet?.media[0]?.videoUrl).toBe('https://v/gif.mp4')
  })

  it('skips a video that has no mp4 variant', () => {
    const tweet = parseTweet({
      __typename: 'Tweet',
      created_at: '2026-06-03T08:06:54.000Z',
      id_str: '1',
      mediaDetails: [
        {
          media_url_https: 'https://pbs.twimg.com/poster.jpg',
          original_info: { height: 720, width: 1280 },
          type: 'video',
          video_info: {
            aspect_ratio: [16, 9],
            variants: [
              {
                content_type: 'application/x-mpegURL',
                url: 'https://v/p.m3u8',
              },
            ],
          },
        },
      ],
      text: 'clip',
      user: USER,
    })
    expect(tweet?.media).toEqual([])
  })

  it('parses a quoted tweet one level deep, using reply_count for its replies', () => {
    const tweet = parseTweet({
      __typename: 'Tweet',
      created_at: '2026-06-02T05:00:00.000Z',
      id_str: '2061673485056040980',
      quoted_tweet: {
        created_at: '2026-06-02T04:28:22.000Z',
        display_text_range: [0, 19],
        favorite_count: 44,
        id_str: '2061666206059536808',
        mediaDetails: [
          photoDetail('https://pbs.twimg.com/media/q.jpg', 1536, 2048),
        ],
        quoted_tweet: {
          created_at: '2026-06-01T00:00:00.000Z',
          id_str: '3',
          text: 'deeper',
          user: USER,
        },
        reply_count: 19,
        text: '旅游放弃吧😭\n\n等待的人不会再出现了 https://t.co/FEG1ZUhgP9',
        user: USER,
      },
      text: '本来没抽的',
      user: { ...USER, is_blue_verified: false, screen_name: 'shirouzu_ref' },
    })
    expect(tweet?.quoted?.id).toBe('2061666206059536808')
    expect(tweet?.quoted?.text).toBe('旅游放弃吧😭\n\n等待的人不会再出现了')
    expect(tweet?.quoted?.replies).toBe(19)
    expect(tweet?.quoted?.media[0]?.url).toBe(
      'https://pbs.twimg.com/media/q.jpg',
    )
    expect(tweet?.quoted?.quoted).toBeUndefined()
  })

  it('reads the reply target', () => {
    const tweet = parseTweet({
      __typename: 'Tweet',
      created_at: '2026-06-03T08:24:19.000Z',
      id_str: '2062087973089534338',
      in_reply_to_screen_name: '__oQuery',
      in_reply_to_status_id_str: '2062083589483999405',
      text: 'more',
      user: USER,
    })
    expect(tweet?.replyTo).toEqual({
      screenName: '__oQuery',
      statusId: '2062083589483999405',
    })
  })
})

describe('formatTweetCount', () => {
  it('keeps small numbers as is', () => {
    expect(formatTweetCount(999)).toBe('999')
  })

  it('abbreviates thousands and millions', () => {
    expect(formatTweetCount(1234)).toBe('1.2K')
    expect(formatTweetCount(2_500_000)).toBe('2.5M')
  })
})

describe('parseTweet display range start', () => {
  it('drops leading reply mentions and shifts entity offsets', () => {
    const tweet = parseTweet({
      __typename: 'Tweet',
      created_at: '2026-06-03T08:24:19.000Z',
      display_text_range: [10, 19],
      entities: {
        hashtags: [{ indices: [15, 19], text: 'tag' }],
        user_mentions: [{ indices: [0, 9], screen_name: '__oQuery' }],
      },
      id_str: '1',
      in_reply_to_screen_name: '__oQuery',
      in_reply_to_status_id_str: '2',
      text: '@__oQuery more #tag https://t.co/x',
      user: {
        name: 'n',
        profile_image_url_https: 'https://a',
        screen_name: 's',
      },
    })
    expect(tweet?.text).toBe('more #tag')
    expect(tweet?.entities).toEqual([
      {
        end: 9,
        href: 'https://x.com/hashtag/tag',
        start: 5,
        type: 'hashtag',
      },
    ])
  })
})
