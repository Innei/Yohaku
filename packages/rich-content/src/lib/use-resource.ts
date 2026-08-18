'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'

interface Entry<T> {
  error?: unknown
  promise?: Promise<T>
  status: 'error' | 'loading' | 'success'
  value?: T
}

const cache = new Map<string, Entry<unknown>>()
const listeners = new Map<string, Set<() => void>>()

export function __resetResourceCache() {
  cache.clear()
  listeners.clear()
}

export function __listenerCount(key: string): number {
  return listeners.get(key)?.size ?? 0
}

function notify(key: string) {
  for (const listener of listeners.get(key) ?? []) listener()
}

export function invalidateResource(key: string) {
  cache.delete(key)
  notify(key)
}

const RETRY_COUNT = 2
const RETRY_DELAY_MS = 50

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  retriesLeft = RETRY_COUNT,
): Promise<T> {
  try {
    return await fetcher()
  } catch (error) {
    if (retriesLeft <= 0) throw error
    await delay(RETRY_DELAY_MS)
    return fetchWithRetry(fetcher, retriesLeft - 1)
  }
}

export function fetchResource<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = cache.get(key) as Entry<T> | undefined
  if (existing?.status === 'success')
    return Promise.resolve(existing.value as T)
  if (existing?.status === 'loading' && existing.promise)
    return existing.promise

  const promise = fetchWithRetry(fetcher)
    .then((value) => {
      cache.set(key, { status: 'success', value } as Entry<unknown>)
      notify(key)
      return value
    })
    .catch((error: unknown) => {
      cache.set(key, { error, status: 'error' } as Entry<unknown>)
      notify(key)
      throw error
    })

  cache.set(key, { promise, status: 'loading' } as Entry<unknown>)
  return promise
}

export interface ResourceState<T> {
  data?: T
  error?: unknown
  isLoading: boolean
}

const noopSubscribe = () => () => {}

// 渲染期直接读模块级 cache 会被 React Compiler 按 [key] 记忆化，
// loading→success 的过渡在 bump 式重渲染里永远读到陈旧快照（mobile
// WebView 卡骨架的根因）——外部可变存储必须走 useSyncExternalStore。
export function useResource<T>(
  key: string | null,
  fetcher: () => Promise<T>,
): ResourceState<T> {
  const subscribe = useMemo(() => {
    if (!key) return noopSubscribe
    return (onStoreChange: () => void) => {
      const set = listeners.get(key) ?? new Set<() => void>()
      listeners.set(key, set)
      set.add(onStoreChange)
      return () => {
        set.delete(onStoreChange)
        if (set.size === 0) listeners.delete(key)
      }
    }
  }, [key])

  const entry = useSyncExternalStore(
    subscribe,
    () => (key ? (cache.get(key) as Entry<T> | undefined) : undefined),
    () => (key ? (cache.get(key) as Entry<T> | undefined) : undefined),
  )

  useEffect(() => {
    if (!key) return
    // fetcher 有意不入依赖：缓存身份由 key 决定，内联箭头函数每渲染都变，
    // 入依赖会导致无限重取。
    void fetchResource(key, fetcher).catch(() => {})
  }, [key])

  if (!key) return { isLoading: false }
  return {
    data: entry?.value,
    error: entry?.error,
    isLoading: !entry || entry.status === 'loading',
  }
}
