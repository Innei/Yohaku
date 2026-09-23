import { describe, expect, it } from 'vitest'

import { trackBounds, trackPolylines, trackSummary } from './map-track'

describe('trackPolylines', () => {
  it('wraps points in a single polyline and drops elevation', () => {
    expect(
      trackPolylines({
        points: [
          [35.69, 139.8, 6.9],
          [35.7, 139.81, 7],
        ],
      }),
    ).toEqual([
      [
        [35.69, 139.8],
        [35.7, 139.81],
      ],
    ])
  })

  it('prefers segments over points', () => {
    expect(
      trackPolylines({
        points: [
          [1, 1],
          [2, 2],
          [3, 3],
        ],
        segments: [
          [[1, 1]],
          [
            [2, 2],
            [3, 3],
          ],
        ],
      }),
    ).toEqual([
      [[1, 1]],
      [
        [2, 2],
        [3, 3],
      ],
    ])
  })

  it('drops invalid tuples and empty polylines', () => {
    expect(
      trackPolylines({
        segments: [
          [[91, 0], ['a', 1], [1], null, [Number.NaN, 2], [10, 20]],
          [[0, 181]],
          'nope',
        ],
      }),
    ).toEqual([[[10, 20]]])
  })

  it('returns nothing for malformed json', () => {
    expect(trackPolylines(null)).toEqual([])
    expect(trackPolylines({ points: 'x' })).toEqual([])
  })
})

describe('trackSummary', () => {
  it('formats distance and duration', () => {
    expect(
      trackSummary({
        distanceMeters: 12_449,
        endTimeMs: 12_000_000,
        startTimeMs: 0,
      }),
    ).toEqual({ distanceKm: '12.4 km', duration: '3 h 20 min' })
  })

  it('formats sub-hour and whole-hour durations', () => {
    expect(trackSummary({ endTimeMs: 2_700_000, startTimeMs: 0 })).toEqual({
      duration: '45 min',
    })
    expect(trackSummary({ endTimeMs: 7_200_000, startTimeMs: 0 })).toEqual({
      duration: '2 h',
    })
  })

  it('omits missing or invalid fields', () => {
    expect(trackSummary({ distanceMeters: 0, startTimeMs: 1 })).toEqual({})
    expect(trackSummary({ endTimeMs: 0, startTimeMs: 5_000_000 })).toEqual({})
    expect(trackSummary(undefined)).toEqual({})
  })
})

describe('trackBounds', () => {
  it('spans every polyline', () => {
    expect(
      trackBounds([
        [
          [35.6, 139.7],
          [35.7, 139.8],
        ],
        [[-1, -2]],
      ]),
    ).toEqual({ maxLat: 35.7, maxLon: 139.8, minLat: -1, minLon: -2 })
  })

  it('is null without points', () => {
    expect(trackBounds([])).toBeNull()
  })
})
