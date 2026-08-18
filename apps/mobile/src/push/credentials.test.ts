import { describe, expect, it } from 'vitest'

import { createCredentialStore } from './credentials'
import type { PushInstallationCredential } from './types'

const CREDENTIAL: PushInstallationCredential = {
  relayUrl: 'https://push.example.com',
  appId: 'yohaku',
  installationId: 'ins_1',
  installationSecret: 's'.repeat(32),
}

function memory() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value)
    },
    deleteItem: async (key: string) => {
      data.delete(key)
    },
  }
}

describe('createCredentialStore', () => {
  it('persists installation credentials under a distinct key', async () => {
    const storage = memory()
    const store = createCredentialStore(storage)
    await store.write(CREDENTIAL)
    expect([...storage.data.keys()]).toEqual(['yohaku.push-installation'])
    await expect(
      store.read({
        relayUrl: CREDENTIAL.relayUrl,
        appId: CREDENTIAL.appId,
      }),
    ).resolves.toEqual({ ...CREDENTIAL, bindingId: null })
    const stored = JSON.parse([...storage.data.values()][0]!) as Record<
      string,
      unknown
    >
    expect(stored).not.toHaveProperty('ticket')
    expect(stored).not.toHaveProperty('apnsToken')
    expect(stored).not.toHaveProperty('apns_token')
  })

  it('treats a config mismatch as absent and clears the stored value', async () => {
    const storage = memory()
    const store = createCredentialStore(storage)
    await store.write(CREDENTIAL)
    await expect(
      store.read({
        relayUrl: 'https://other.example.com',
        appId: 'yohaku',
      }),
    ).resolves.toBeNull()
    expect(storage.data.size).toBe(0)

    await store.write(CREDENTIAL)
    await expect(
      store.read({
        relayUrl: CREDENTIAL.relayUrl,
        appId: 'space',
      }),
    ).resolves.toBeNull()
    expect(storage.data.size).toBe(0)
  })

  it('clears and returns null for malformed JSON', async () => {
    const storage = memory()
    await storage.setItem('yohaku.push-installation', '{not-json')
    const store = createCredentialStore(storage)
    await expect(
      store.read({
        relayUrl: CREDENTIAL.relayUrl,
        appId: CREDENTIAL.appId,
      }),
    ).resolves.toBeNull()
    expect(storage.data.size).toBe(0)
  })

  it('clears and returns null when required fields are missing or short', async () => {
    const storage = memory()
    await storage.setItem(
      'yohaku.push-installation',
      JSON.stringify({
        relayUrl: CREDENTIAL.relayUrl,
        appId: CREDENTIAL.appId,
        installationId: 'ins_1',
        installationSecret: 'short',
      }),
    )
    const store = createCredentialStore(storage)
    await expect(
      store.read({
        relayUrl: CREDENTIAL.relayUrl,
        appId: CREDENTIAL.appId,
      }),
    ).resolves.toBeNull()
    expect(storage.data.size).toBe(0)
  })

  it('returns null when nothing is stored', async () => {
    const store = createCredentialStore(memory())
    await expect(
      store.read({
        relayUrl: CREDENTIAL.relayUrl,
        appId: CREDENTIAL.appId,
      }),
    ).resolves.toBeNull()
  })
})
