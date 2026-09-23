import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

import { useLogin } from './use-login'

const { social, toast } = vi.hoisted(() => ({
  social: vi.fn(),
  toast: vi.fn(),
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: ['github'] }),
}))
vi.mock('@/api/client', () => ({ api: {} }))
vi.mock('@/auth/client', () => ({
  getAuthClient: () => ({ signIn: { social } }),
}))
vi.mock('@/auth/session', () => ({ refreshSession: vi.fn() }))
vi.mock('@/auth/session-store', () => ({ getSession: () => null }))
vi.mock('@/components/ui/toast-store', () => ({ showToast: toast }))
vi.mock('@/i18n', () => ({ useTranslations: () => (key: string) => key }))

it('reports rejected social sign-in and native browser failures, then allows retry', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  let login: ReturnType<typeof useLogin>
  function Probe() {
    login = useLogin()
    return null
  }
  const root = createRoot(document.createElement('div'))
  try {
    act(() => root.render(createElement(Probe)))
    social.mockResolvedValueOnce({ error: { message: 'Unavailable' } })
    social.mockRejectedValueOnce(new Error('Native browser unavailable'))
    for (let attempt = 0; attempt < 2; attempt++) {
      await act(async () => {
        expect(await login.signInSocial('github')).toBe(false)
      })
      expect(login!.busy).toBe(null)
    }
    expect(social).toHaveBeenCalledTimes(2)
    expect(toast).toHaveBeenCalledTimes(2)
    expect(toast).toHaveBeenCalledWith('socialUnavailable')
  } finally {
    act(() => root.unmount())
  }
})
