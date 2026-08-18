import { describe, expect, it, vi } from 'vitest'

import { createRelayClient, RelayError } from './relay-client'

const ORIGIN = 'https://push.example.com'
const TOKEN = 'ab'.repeat(32)
const INSTALLATION = {
  installation_id: 'ins_1',
  installation_secret: 's'.repeat(32),
}
const TICKET = {
  ticket: 't'.repeat(32),
  expires_at: '2026-08-17T12:00:00.000Z',
}

function jsonResponse(
  status: number,
  body: unknown,
  extra?: Partial<Response>,
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body == null ? '' : JSON.stringify(body)),
    ...extra,
  } as Response
}

function client(fetchImpl: typeof fetch, origin = ORIGIN) {
  return createRelayClient({ origin, fetch: fetchImpl, timeoutMs: 10_000 })
}

describe('createRelayClient', () => {
  it('registers an installation at the origin path with a lowercase APNs token', async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(`${ORIGIN}/v1/installations`)
        expect(init?.method).toBe('POST')
        expect(init?.redirect).toBe('error')
        expect(init?.headers).toMatchObject({
          'content-type': 'application/json',
        })
        expect(JSON.parse(String(init?.body))).toEqual({
          app_id: 'yohaku',
          apns_environment: 'development',
          apns_token: TOKEN,
        })
        return jsonResponse(201, INSTALLATION)
      },
    )

    await expect(
      client(fetchImpl).registerInstallation({
        app_id: 'yohaku',
        apns_environment: 'development',
        apns_token: TOKEN,
      }),
    ).resolves.toEqual(INSTALLATION)
  })

  it('joins origin and path without double slashes when the origin has a trailing slash', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe(`${ORIGIN}/v1/installations`)
      return jsonResponse(201, INSTALLATION)
    })
    await createRelayClient({
      origin: `${ORIGIN}/`,
      fetch: fetchImpl,
    }).registerInstallation({
      app_id: 'yohaku',
      apns_environment: 'production',
      apns_token: TOKEN,
    })
  })

  it('rejects an APNs token that is not lowercase hex of at least 64 chars', async () => {
    const fetchImpl = vi.fn()
    const relay = client(fetchImpl)
    await expect(
      relay.registerInstallation({
        app_id: 'yohaku',
        apns_environment: 'development',
        apns_token: TOKEN.toUpperCase(),
      }),
    ).rejects.toThrow(/apns/i)
    await expect(
      relay.registerInstallation({
        app_id: 'yohaku',
        apns_environment: 'development',
        apns_token: 'abcd',
      }),
    ).rejects.toThrow(/apns/i)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('updates a token with Installation id.secret authorization', async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(
          `${ORIGIN}/v1/installations/${INSTALLATION.installation_id}/token`,
        )
        expect(init?.method).toBe('PUT')
        expect(init?.headers).toMatchObject({
          authorization: `Installation ${INSTALLATION.installation_id}.${INSTALLATION.installation_secret}`,
          'content-type': 'application/json',
        })
        expect(JSON.parse(String(init?.body))).toEqual({
          apns_environment: 'production',
          apns_token: TOKEN,
        })
        return jsonResponse(200, { updated: true })
      },
    )

    await client(fetchImpl).updateInstallationToken(
      INSTALLATION.installation_id,
      INSTALLATION.installation_secret,
      { apns_environment: 'production', apns_token: TOKEN },
    )
  })

  it('creates a source-activation ticket with the same Installation auth', async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(`${ORIGIN}/v1/source-activations`)
        expect(init?.method).toBe('POST')
        expect(init?.headers).toMatchObject({
          authorization: `Installation ${INSTALLATION.installation_id}.${INSTALLATION.installation_secret}`,
        })
        expect(init?.body).toBeUndefined()
        return jsonResponse(201, TICKET)
      },
    )

    await expect(
      client(fetchImpl).createActivationTicket(
        INSTALLATION.installation_id,
        INSTALLATION.installation_secret,
      ),
    ).resolves.toEqual(TICKET)
  })

  it('throws a structured RelayError from a rejected response', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(401, {
        error: 'unauthorized',
        message: 'Installation credential is invalid',
      }),
    )

    const error = await client(fetchImpl)
      .updateInstallationToken('ins_1', 's'.repeat(32), {
        apns_environment: 'development',
        apns_token: TOKEN,
      })
      .catch((caught) => caught)

    expect(error).toBeInstanceOf(RelayError)
    expect(error).toMatchObject({
      status: 401,
      code: 'unauthorized',
      message: 'Installation credential is invalid',
    })
  })

  it('rejects a malformed installation response', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(201, { installation_id: 'ins_1' }),
    )
    await expect(
      client(fetchImpl).registerInstallation({
        app_id: 'yohaku',
        apns_environment: 'development',
        apns_token: TOKEN,
      }),
    ).rejects.toThrow(/invalid/i)
  })

  it('aborts a hung request after the timeout', async () => {
    const fetchImpl = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(init.signal?.reason ?? new Error('aborted'))
          })
        }),
    )
    const relay = createRelayClient({
      origin: ORIGIN,
      fetch: fetchImpl,
      timeoutMs: 5,
    })
    await expect(
      relay.registerInstallation({
        app_id: 'yohaku',
        apns_environment: 'development',
        apns_token: TOKEN,
      }),
    ).rejects.toThrow()
  })

  it('reads a binding with Installation auth', async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(`${ORIGIN}/v1/bindings/bind_1`)
        expect(init?.method).toBe('GET')
        expect(init?.headers).toMatchObject({
          authorization: `Installation ${INSTALLATION.installation_id}.${INSTALLATION.installation_secret}`,
        })
        return jsonResponse(200, {
          binding_id: 'bind_1',
          source_id: 'src_1',
          installation_id: INSTALLATION.installation_id,
          reader_id: null,
          preferences: {
            content_post: true,
            content_note: false,
            content_recently: true,
            comment_replied: true,
          },
        })
      },
    )

    await expect(
      client(fetchImpl).getBinding(
        INSTALLATION.installation_id,
        INSTALLATION.installation_secret,
        'bind_1',
      ),
    ).resolves.toEqual({
      binding_id: 'bind_1',
      source_id: 'src_1',
      installation_id: INSTALLATION.installation_id,
      reader_id: null,
      preferences: {
        contentPost: true,
        contentNote: false,
        contentRecently: true,
        commentReplied: true,
      },
    })
  })

  it('updates binding preferences with snake_case fields', async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(`${ORIGIN}/v1/bindings/bind_1/preferences`)
        expect(init?.method).toBe('PUT')
        expect(JSON.parse(String(init?.body))).toEqual({
          content_post: false,
        })
        return jsonResponse(200, {
          updated: true,
          binding_id: 'bind_1',
          preferences: {
            content_post: false,
            content_note: true,
            content_recently: true,
            comment_replied: true,
          },
        })
      },
    )

    await expect(
      client(fetchImpl).updateBindingPreferences(
        INSTALLATION.installation_id,
        INSTALLATION.installation_secret,
        'bind_1',
        { content_post: false },
      ),
    ).resolves.toEqual({
      contentPost: false,
      contentNote: true,
      contentRecently: true,
      commentReplied: true,
    })
  })

  it('revokes a binding with Installation auth', async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(`${ORIGIN}/v1/bindings/bind_1`)
        expect(init?.method).toBe('DELETE')
        return jsonResponse(200, { revoked: true })
      },
    )

    await client(fetchImpl).revokeBinding(
      INSTALLATION.installation_id,
      INSTALLATION.installation_secret,
      'bind_1',
    )
  })
})
