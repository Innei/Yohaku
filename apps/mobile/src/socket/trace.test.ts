import { describe, expect, it } from 'vitest'

import { createSocketTrace } from './trace'

describe('createSocketTrace', () => {
  it('keeps inbound and outbound events in order and notifies subscribers', () => {
    const trace = createSocketTrace(8)
    let ticks = 0
    const stop = trace.subscribe(() => {
      ticks += 1
    })
    trace.record({ dir: 'out', event: 'room.join', payload: { room: 'a' } })
    trace.record({ dir: 'in', event: 'activity.update_presence' })
    expect(trace.list().map((entry) => entry.event)).toEqual([
      'room.join',
      'activity.update_presence',
    ])
    expect(trace.list()[0]?.dir).toBe('out')
    expect(ticks).toBe(2)
    stop()
  })

  it('drops the oldest entries once the ring is full', () => {
    const trace = createSocketTrace(3)
    trace.record({ dir: 'state', event: 'connecting' })
    trace.record({ dir: 'state', event: 'open' })
    trace.record({ dir: 'out', event: 'ping' })
    trace.record({ dir: 'in', event: 'ack' })
    expect(trace.list().map((entry) => entry.event)).toEqual([
      'open',
      'ping',
      'ack',
    ])
  })

  it('summarizes a payload for the desttools list', () => {
    const trace = createSocketTrace()
    expect(trace.summarize({ room: 'article-1', extra: 1 })).toBe(
      '{"room":"article-1","extra":1}',
    )
    expect(trace.summarize(undefined)).toBe('')
  })
})
