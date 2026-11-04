import { beforeEach, expect, it, vi } from 'vitest'

import { secretStore } from './secret-store'

const native = vi.hoisted(() => ({
  secretDelete: vi.fn(),
  secretGet: vi.fn(),
  secretSet: vi.fn(),
}))
vi.mock('@modules/yohaku', () => ({ YohakuNative: native }))

beforeEach(() => vi.resetAllMocks())

it('provides asynchronous cookie persistence for the Expo auth client', async () => {
  native.secretGet.mockReturnValue('session=abc')
  await expect(secretStore.getItemAsync('cookie')).resolves.toBe('session=abc')
  await secretStore.setItemAsync('cookie', 'session=updated')
  expect(native.secretSet).toHaveBeenCalledWith('cookie', 'session=updated')
})

it('rejects asynchronously when native cookie access fails', async () => {
  native.secretGet.mockImplementation(() => {
    throw new Error('Keychain unavailable')
  })
  await expect(secretStore.getItemAsync('cookie')).rejects.toThrow(
    'Keychain unavailable',
  )
})
