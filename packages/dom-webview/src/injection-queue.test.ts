import { describe, expect, it, vi } from 'vitest'

import {
  createInjectionQueue,
  type InjectionDropReason,
} from './injection-queue'

function harness(
  options: {
    capacity?: number
    maxAttempts?: number
  } = {},
) {
  const sent: string[] = []
  const dropped: [InjectionDropReason, string][] = []
  const scheduled: (() => void)[] = []
  let accept = true

  const queue = createInjectionQueue({
    ...options,
    onDrop: (reason, script) => dropped.push([reason, script]),
    schedule: (run) => scheduled.push(run),
    send: (script) => {
      if (!accept) return undefined
      sent.push(script)
      return Promise.resolve()
    },
  })

  return {
    dropped,
    queue,
    sent,
    get pendingRetries() {
      return scheduled.length
    },
    offline() {
      accept = false
    },
    online() {
      accept = true
    },
    runOne() {
      scheduled.shift()?.()
    },
    runScheduled() {
      const runs = scheduled.splice(0, scheduled.length)
      for (const run of runs) run()
    },
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('createInjectionQueue', () => {
  it('sends straight through while the view accepts', async () => {
    const h = harness()
    h.queue.push('a')
    await settle()
    expect(h.sent).toEqual(['a'])
    expect(h.queue.size).toBe(0)
  })

  it('holds an injection the view cannot take yet and delivers it on retry', async () => {
    const h = harness()
    h.offline()
    h.queue.push('a')
    expect(h.sent).toEqual([])
    expect(h.queue.size).toBe(1)

    h.online()
    h.runScheduled()
    await settle()
    expect(h.sent).toEqual(['a'])
    expect(h.queue.size).toBe(0)
  })

  it('preserves order across a retry, so a later payload cannot overtake', async () => {
    const h = harness()
    h.offline()
    h.queue.push('a')
    h.queue.push('b')
    h.queue.push('c')

    h.online()
    h.runScheduled()
    await settle()
    expect(h.sent).toEqual(['a', 'b', 'c'])
  })

  it('drops the oldest waiting injection past capacity', async () => {
    const h = harness({ capacity: 2 })
    h.offline()
    h.queue.push('a')
    h.queue.push('b')
    h.queue.push('c')
    h.queue.push('d')

    expect(h.dropped).toEqual([
      ['capacity', 'a'],
      ['capacity', 'b'],
    ])

    h.online()
    h.runScheduled()
    await settle()
    expect(h.sent).toEqual(['c', 'd'])
  })

  it('gives up on an injection once the attempt budget runs out', () => {
    const h = harness({ maxAttempts: 2 })
    h.offline()
    h.queue.push('a')
    h.runOne()

    expect(h.dropped).toEqual([['attempts', 'a']])
    expect(h.queue.size).toBe(0)
  })

  it('moves on to the next injection after giving up on one', async () => {
    const h = harness({ maxAttempts: 2 })
    h.offline()
    h.queue.push('a')
    h.queue.push('b')

    expect(h.dropped).toEqual([['attempts', 'a']])

    h.online()
    h.runOne()
    await settle()
    expect(h.sent).toEqual(['b'])
  })

  it('clears everything on dispose and ignores later pushes', async () => {
    const h = harness()
    h.offline()
    h.queue.push('a')
    h.queue.dispose()
    expect(h.queue.size).toBe(0)

    h.online()
    h.runScheduled()
    h.queue.push('b')
    await settle()
    expect(h.sent).toEqual([])
  })

  it('keeps retrying the same payload when the send rejects', async () => {
    const scheduled: (() => void)[] = []
    const send = vi
      .fn<(script: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new Error('ViewNotFound'))
      .mockResolvedValue(undefined)
    const queue = createInjectionQueue({
      schedule: (run) => scheduled.push(run),
      send,
    })

    queue.push('a')
    await settle()
    expect(send).toHaveBeenCalledTimes(1)

    scheduled.splice(0, scheduled.length).forEach((run) => run())
    await settle()
    expect(send).toHaveBeenCalledTimes(2)
    expect(send.mock.calls.map(([script]) => script)).toEqual(['a', 'a'])
    expect(queue.size).toBe(0)
  })
})
