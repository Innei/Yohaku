import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

vi.mock('expo/fetch', () => ({ fetch: fetchMock }))
vi.mock('@/auth/client', () => ({ getSessionCookie: () => 'session=abc' }))
vi.mock('@/auth/session-store', () => ({ setSession: vi.fn() }))
vi.mock('@/i18n/locale-store', () => ({ getLocale: () => 'zh' }))
vi.mock('@/api/base-url', () => ({
  apiBaseUrl: () => 'https://mx.example/api/v3',
}))

function jsonResponse(status: number, body: unknown) {
  const text = body == null ? '' : JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  }
}

describe('api push methods', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('POSTs a camelCase activation body', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(201, {
        data: {
          enabled: true,
          relay_url: 'https://push.example.com',
          binding_id: 'bind_1',
        },
      }),
    )
    const { api } = await import('./client')
    await expect(
      api.pushActivate({
        relayUrl: 'https://push.example.com',
        activationTicket: 't'.repeat(32),
      }),
    ).resolves.toEqual({
      enabled: true,
      relayUrl: 'https://push.example.com',
      bindingId: 'bind_1',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://mx.example/api/v3/notifications/push/activate')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(
      JSON.stringify({
        relayUrl: 'https://push.example.com',
        activationTicket: 't'.repeat(32),
      }),
    )
    expect(init.headers.cookie).toBe('session=abc')
  })
})
