import { describe, expect, it, vi } from 'vitest'

import {
  createNotificationResponseHandler,
  notificationTargetPath,
} from './notification-routing'

describe('notificationTargetPath', () => {
  it.each([
    '/posts/journal/hello-world',
    '/notes/42',
    '/thinking/123456789',
    '/comments/123456789',
  ])('accepts the internal route %s', (path) => {
    expect(notificationTargetPath({ target_path: path })).toBe(path)
  })

  it.each([
    'https://attacker.example/post',
    '//attacker.example/post',
    '/posts/only-one-segment',
    '/notes/not-a-number',
    '/comments/1?redirect=https://attacker.example',
    '/posts/journal/%2e%2e',
    '/posts/journal/%2Fsettings',
    '/settings',
  ])('rejects the unsafe or unsupported route %s', (path) => {
    expect(notificationTargetPath({ target_path: path })).toBeNull()
  })

  it('rejects non-object notification data', () => {
    expect(notificationTargetPath(null)).toBeNull()
    expect(notificationTargetPath('target_path=/notes/42')).toBeNull()
  })
})

describe('createNotificationResponseHandler', () => {
  it('navigates once when cold-start and listener responses share an id', () => {
    const navigate = vi.fn()
    const handle = createNotificationResponseHandler(navigate)
    const response = {
      notification: {
        request: {
          identifier: 'notification-1',
          content: { data: { target_path: '/notes/42' } },
        },
      },
    }

    expect(handle(response)).toBe(true)
    expect(handle(response)).toBe(false)
    expect(navigate).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith('/notes/42')
  })
})
