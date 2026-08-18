import { apiBaseUrl } from '@/api/base-url'
import { api } from '@/api/client'

import { snapshotFromAggregate } from './snapshot'
import { setOwner } from './store'

export async function refreshOwnerSnapshot() {
  if (!apiBaseUrl()) return
  try {
    const next = snapshotFromAggregate(await api.aggregate())
    if (next) setOwner(next)
  } catch {
    // offline / 5xx: keep the bundled or last-cached snapshot
  }
}
