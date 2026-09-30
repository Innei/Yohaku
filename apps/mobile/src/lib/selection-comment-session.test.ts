import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getSelectionCommentSession,
  markSelectionCommentMounted,
  presentSelectionComment,
  subscribeSelectionComment,
} from './selection-comment-session'

const anchor = {
  blockId: 'b1',
  endOffset: 4,
  quote: 'text',
  startOffset: 0,
} as never

function present(refId = 'post-1') {
  return presentSelectionComment({
    refId,
    refType: 'post',
    state: { anchor, kind: 'thread' },
  })
}

describe('selection comment session', () => {
  beforeEach(() => {
    markSelectionCommentMounted(false)
  })

  it('asks for a push when no sheet is on screen', () => {
    expect(present()).toBe('push')
    expect(getSelectionCommentSession()?.refId).toBe('post-1')
  })

  it('swaps content in place while the sheet is mounted', () => {
    present()
    markSelectionCommentMounted(true)
    expect(present('post-2')).toBe('replace')
    expect(getSelectionCommentSession()?.refId).toBe('post-2')
  })

  it('keeps the session until the sheet unmounts', () => {
    present()
    markSelectionCommentMounted(true)
    expect(getSelectionCommentSession()).not.toBeNull()
    markSelectionCommentMounted(false)
    expect(getSelectionCommentSession()).toBeNull()
  })

  it('notifies subscribers on present and unmount', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSelectionComment(listener)
    present()
    markSelectionCommentMounted(true)
    markSelectionCommentMounted(false)
    unsubscribe()
    present()
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
