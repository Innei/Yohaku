'use client'

import type {
  PollDataAdapter,
  PollState,
} from '@haklex/rich-compose/modules/poll'
import { useMemo } from 'react'

import { useHost } from '../../../host'
import { invalidateResource, useResource } from '../../../lib/use-resource'

const fallbackState: PollState = {
  canVote: false,
  closed: false,
  status: 'loading',
  tallies: {},
  totalVotes: 0,
}

export function usePortablePollAdapter(): PollDataAdapter {
  const host = useHost()
  return useMemo<PollDataAdapter>(
    () => ({
      usePollState: (pollId) => {
        const { data } = useResource(`poll:${pollId}`, () =>
          host.fetchJSON<PollState>(`/proxy/polls/${pollId}`),
        )
        return data ?? fallbackState
      },
      useSubmit: (pollId) => async (optionIds) => {
        await host.fetchJSON<PollState>(`/proxy/polls/${pollId}/vote`, {
          body: JSON.stringify({ optionIds }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        invalidateResource(`poll:${pollId}`)
      },
    }),
    [host],
  )
}
