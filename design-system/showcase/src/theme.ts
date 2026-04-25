import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'yohaku-design-theme'
const URL_PARAM = 'theme'
const CHANGE_EVENT = 'yohaku-theme-change'

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const fromUrl = new URL(window.location.href).searchParams.get(URL_PARAM)
  if (fromUrl === 'light' || fromUrl === 'dark') return fromUrl
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb)
  window.addEventListener(CHANGE_EVENT, cb)
  return () => {
    window.removeEventListener('popstate', cb)
    window.removeEventListener(CHANGE_EVENT, cb)
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    () => 'light' as Theme,
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    const url = new URL(window.location.href)
    url.searchParams.set(URL_PARAM, next)
    window.history.replaceState(null, '', url)
    window.localStorage.setItem(STORAGE_KEY, next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  const toggle = useCallback(() => {
    setTheme(readTheme() === 'dark' ? 'light' : 'dark')
  }, [setTheme])

  return { theme, setTheme, toggle }
}
