import { addDatabaseChangeListener } from 'expo-sqlite'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useRouteTransitionSettled } from '@/components/navigation/use-route-transition-settled'

interface DatabaseSnapshotOptions<T> {
  identity: string
  read: () => Promise<T>
  tables: readonly string[]
}

interface SnapshotResult<T> {
  identity: string
  value: T
}

// ponytail: one pending snapshot matches the single shared reader; use a keyed
// cache only if article routes ever preload concurrently.
let primedSnapshot: SnapshotResult<unknown> | null = null

export function primeDatabaseSnapshot<T>(identity: string, value: T) {
  primedSnapshot = { identity, value }
}

function readPrimedSnapshot<T>(identity: string): SnapshotResult<T> | null {
  if (primedSnapshot?.identity !== identity) return null
  return primedSnapshot as SnapshotResult<T>
}

/**
 * Reads related SQLite state as one snapshot and publishes one React update.
 * Database writes are reconciled only after the native presentation finishes,
 * preventing live-query commits from competing with the push animation.
 */
export function useDatabaseSnapshot<T>({
  identity,
  read,
  tables,
}: DatabaseSnapshotOptions<T>) {
  const updatesEnabled = useRouteTransitionSettled(identity)
  const [result, setResult] = useState<SnapshotResult<T> | null>(() =>
    readPrimedSnapshot(identity),
  )
  const [failedIdentity, setFailedIdentity] = useState<string | null>(null)
  const revisionRef = useRef(0)
  const readRef = useRef(read)
  readRef.current = read
  const tableKey = tables.join('\u0000')

  const reload = useCallback(async () => {
    const revision = ++revisionRef.current
    try {
      const value = await readRef.current()
      if (revision !== revisionRef.current) return
      if (primedSnapshot?.identity === identity) primedSnapshot = null
      setResult({ identity, value })
      setFailedIdentity(null)
    } catch {
      if (revision === revisionRef.current) setFailedIdentity(identity)
    }
  }, [identity])

  useEffect(() => {
    void reload()
    return () => {
      revisionRef.current += 1
    }
  }, [reload])

  useEffect(() => {
    if (!updatesEnabled) return

    const watchedTables = new Set(tableKey.split('\u0000'))
    let disposed = false
    let reloading = false
    let reloadQueued = false

    const queueReload = () => {
      if (disposed) return
      if (reloading) {
        reloadQueued = true
        return
      }

      reloading = true
      void (async () => {
        do {
          reloadQueued = false
          await reload()
        } while (reloadQueued && !disposed)
        reloading = false
      })()
    }

    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if (watchedTables.has(tableName)) queueReload()
    })

    // Reconcile writes that landed between the initial read and transitionEnd.
    queueReload()

    return () => {
      disposed = true
      subscription.remove()
    }
  }, [reload, tableKey, updatesEnabled])

  return {
    failed: failedIdentity === identity,
    reload,
    snapshot: result?.identity === identity ? result.value : null,
    updatesEnabled,
  }
}
