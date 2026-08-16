import { getLocales } from 'expo-localization'
import * as SecureStore from 'expo-secure-store'
import { useSyncExternalStore } from 'react'

import type { Locale } from './config'
import { defaultLocale, isLocale } from './config'
import { matchLocale } from './match-locale'

const STORAGE_KEY = 'yohaku.locale'

const listeners = new Set<() => void>()

function readInitial(): Locale {
  // Synchronous on purpose: the api client reads the locale outside React and
  // before drizzle migrations finish, so this cannot come from SQLite.
  try {
    const stored = SecureStore.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // keychain unavailable on first launch of a restored backup; fall through
  }
  try {
    return matchLocale(getLocales())
  } catch {
    return defaultLocale
  }
}

let locale: Locale = readInitial()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getLocale(): Locale {
  return locale
}

export function setLocale(next: Locale) {
  if (locale === next) return
  locale = next
  try {
    SecureStore.setItem(STORAGE_KEY, next)
  } catch {
    // preference is best-effort; an unwritable keychain must not block the UI
  }
  for (const listener of listeners) listener()
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale)
}
